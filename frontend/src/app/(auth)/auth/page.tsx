import { AuthView } from '@/components/layout/auth-view';

type Props = {
  searchParams: Promise<{ mode?: string; reset?: string }>;
};

/**
 * Single auth route. Renders one AuthView; the local switcher inside flips
 * between sign-in and sign-up without navigating, matching the mockup
 * (`docs/design/reference/components/screens.jsx`). Backend keeps its
 * endpoints separated (POST /api/identity/sign-in, POST /api/identity/register);
 * the frontend only exposes one URL because that's the visual contract.
 *
 * `?mode=signup` deep-links into the registration form; anything else (no
 * param, ?mode=signin, garbage) defaults to sign-in. Useful for sharing
 * a "registrate" link without making the user click the switcher.
 *
 * `?reset=success` is set by the reset-password flow on its 204 redirect
 * (US-033-f). The AuthView shows a dismissable banner above the switcher
 * confirming the password change. Anything else in `reset=` is ignored.
 */
export default async function AuthPage({ searchParams }: Props) {
  const { mode, reset } = await searchParams;
  const initialMode = mode === 'signup' ? 'signup' : 'signin';
  const resetSuccess = reset === 'success';
  return <AuthView initialMode={initialMode} resetSuccess={resetSuccess} />;
}
