/**
 * growth-data-layer/tracking/server-events.ts
 */
type ServerEvent = {
  site_id: string;
  user_id?: string;
  event_name: string;
  properties?: Record<string, unknown>;
};

export async function trackServer(event: ServerEvent): Promise<void> {
  // INSERT direct dans raw.events (cf raw-schema.sql)
  console.log('[track-server]', event.event_name, event);
}
