import { NextResponse } from 'next/server';
import { createServerClient } from './supabase';

function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.FACTORY_ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireFactoryAdmin() {
  const admins = getAdminEmails();
  if (admins.size === 0) {
    return {
      user: null,
      response: NextResponse.json({ error: 'admin_allowlist_not_configured' }, { status: 503 }),
    };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (error || !email || !admins.has(email)) {
    return {
      user: null,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    };
  }

  return { user: data.user, response: null };
}
