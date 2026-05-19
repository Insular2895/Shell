'use server';

/**
 * Server Actions pour login/signup.
 * Pattern OFFICIEL Supabase + Next.js 15+ :
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createServerClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createServerClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  redirect('/signup?check_email=1');
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
