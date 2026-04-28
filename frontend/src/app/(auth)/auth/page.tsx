import { AuthView } from '@/components/layout/auth-view';

type Props = {
  searchParams: Promise<{ mode?: string }>;
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
 */
export default async function AuthPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const initialMode = mode === 'signup' ? 'signup' : 'signin';
  return <AuthView initialMode={initialMode} />;
}
