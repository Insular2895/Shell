/**
 * Worker lifecycle policy.
 *
 * Doctrine cost-control:
 * - no active paid subscription => engine_mode='mock' and external workers stop
 * - at least one active/trialing paid subscription => engine_mode='live'
 *
 * The provider integration is intentionally best-effort. Stripe/webhooks and
 * job creation must not lose billing state because Fly has a transient API
 * issue; the hourly cron retries reconciliation.
 */

const PAYING_STATUSES = ['active', 'trialing'] as const;
const FLY_API_DEFAULT_HOST = 'https://api.machines.dev';

type DbClient = {
  from: (table: string) => any;
};

type EngineMode = 'live' | 'mock' | 'maintenance';

type WorkerRuntimeResult = {
  provider: string;
  action: 'skipped' | 'noop' | 'started' | 'stopped' | 'error';
  machines?: string[];
  reason?: string;
  error?: string;
};

export async function countActivePaidSubscriptions(
  supabase: DbClient,
): Promise<number> {
  const { count, error } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .in('status', [...PAYING_STATUSES])
    .neq('plan_id', 'free');

  if (error) {
    throw new Error('active_paid_subscription_count_failed');
  }

  return count ?? 0;
}

export async function syncEngineModeFromBilling(
  supabase: DbClient,
  source: string,
): Promise<{
  mode: EngineMode;
  previousMode: string;
  paidSubscriptions: number;
  runtime: WorkerRuntimeResult;
}> {
  const paidSubscriptions = await countActivePaidSubscriptions(supabase);
  const billingMode: EngineMode = paidSubscriptions > 0 ? 'live' : 'mock';

  const { data: cfg } = await supabase
    .from('site_config')
    .select('engine_mode')
    .eq('id', true)
    .maybeSingle();

  const previousMode = (cfg?.engine_mode ?? 'mock') as EngineMode;
  const mode: EngineMode = previousMode === 'maintenance' ? 'maintenance' : billingMode;

  if (previousMode !== mode) {
    await supabase
      .from('site_config')
      .upsert({
        id: true,
        engine_mode: mode,
        reason:
          mode === 'live'
            ? `${source}: paid subscription active`
            : mode === 'maintenance'
              ? `${source}: maintenance preserved`
            : `${source}: no active paid subscription`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
  }

  const runtime = await reconcileWorkerRuntime(mode === 'live', source);

  return {
    mode,
    previousMode,
    paidSubscriptions,
    runtime,
  };
}

export async function reconcileWorkerRuntime(
  shouldRun: boolean,
  source: string,
): Promise<WorkerRuntimeResult> {
  const provider = process.env.WORKER_PROVIDER ?? 'none';

  if (provider === 'none') {
    return {
      provider,
      action: 'skipped',
      reason: 'WORKER_PROVIDER=none',
    };
  }

  if (provider !== 'fly') {
    return {
      provider,
      action: 'error',
      error: `unsupported_worker_provider_${provider}`,
    };
  }

  try {
    return await reconcileFlyMachines(shouldRun, source);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'worker_provider_failed';
    console.warn(`[worker-lifecycle] provider=fly action=error source=${source} error=${error}`);
    return {
      provider,
      action: 'error',
      error,
    };
  }
}

type FlyMachine = {
  id: string;
  state?: string;
};

async function reconcileFlyMachines(
  shouldRun: boolean,
  source: string,
): Promise<WorkerRuntimeResult> {
  const appName = process.env.FLY_APP_NAME;
  const token = process.env.FLY_API_TOKEN;

  if (!appName || !token) {
    return {
      provider: 'fly',
      action: 'skipped',
      reason: 'FLY_APP_NAME or FLY_API_TOKEN missing',
    };
  }

  const machines = await getFlyMachines(appName, token);
  const selected = selectFlyMachines(machines);

  if (selected.length === 0) {
    return {
      provider: 'fly',
      action: 'error',
      error: 'no_fly_machines_matched',
    };
  }

  const targets = shouldRun
    ? selected.filter((m) => ['created', 'stopped', 'suspended'].includes(m.state ?? ''))
    : selected.filter((m) => ['starting', 'started'].includes(m.state ?? ''));

  if (targets.length === 0) {
    return {
      provider: 'fly',
      action: 'noop',
      machines: selected.map((m) => m.id),
      reason: shouldRun ? 'workers already running' : 'workers already stopped',
    };
  }

  await Promise.all(
    targets.map((machine) =>
      flyMachineAction(appName, token, machine.id, shouldRun ? 'start' : 'stop'),
    ),
  );

  return {
    provider: 'fly',
    action: shouldRun ? 'started' : 'stopped',
    machines: targets.map((m) => m.id),
    reason: `${source}: ${shouldRun ? 'paid work enabled' : 'no paid work'}`,
  };
}

function selectFlyMachines(machines: FlyMachine[]): FlyMachine[] {
  const ids = (process.env.FLY_MACHINE_ID ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) return machines;

  const wanted = new Set(ids);
  return machines.filter((machine) => wanted.has(machine.id));
}

async function getFlyMachines(appName: string, token: string): Promise<FlyMachine[]> {
  return flyRequest<FlyMachine[]>(appName, token, '/machines', { method: 'GET' });
}

async function flyMachineAction(
  appName: string,
  token: string,
  machineId: string,
  action: 'start' | 'stop',
): Promise<void> {
  await flyRequest(appName, token, `/machines/${encodeURIComponent(machineId)}/${action}`, {
    method: 'POST',
  });
}

async function flyRequest<T = unknown>(
  appName: string,
  token: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const host = process.env.FLY_API_HOSTNAME ?? FLY_API_DEFAULT_HOST;
  const timeoutMs = Number(process.env.WORKER_PROVIDER_TIMEOUT_MS ?? '5000');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `${host}/v1/apps/${encodeURIComponent(appName)}${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      throw new Error(`fly_api_${res.status}`);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
