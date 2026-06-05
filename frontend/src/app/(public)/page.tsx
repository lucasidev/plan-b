import { redirect } from 'next/navigation';

/**
 * Root `/`. Always redirects to `/home`.
 *
 * The `(member)/layout.tsx` route group guard handles the "no session" case by
 * sending to `/sign-in`, so this page does not need to read the session: one
 * decision, one target.
 *
 * Once the public catalog lands (US-001), `/` will become the real landing
 * (universities / careers / subjects browsable without auth) and the redirect to
 * `/home` for members moves to `(public)/layout.tsx` or is handled conditionally here
 * based on the session.
 */
export default function RootRedirectPage() {
  redirect('/home');
}
