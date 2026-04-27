import Link from 'next/link';
import { DisplayHeading, Lede } from '@/components/ui';
import { cn } from '@/lib/utils';
import { AuthSplit } from './auth-split';

export type AuthMode = 'signin' | 'signup';

type Props = {
  /** Which tab is active. Drives the heading on the right column and the tab styling. */
  mode: AuthMode;
  /** The form itself. The page passes a client component here. */
  children: React.ReactNode;
};

/**
 * Shared shell for `(auth)/sign-up` and `(auth)/sign-in`. Wraps the AuthSplit
 * marketing column with the same hero copy on both routes (heading + lede +
 * quote + stats from the design reference) and renders the tabs + form-side
 * heading on the right. The page is responsible only for the form itself.
 *
 * Why a single component instead of duplicating the layout per page: every
 * change to the marketing column (copy, stats, quote) would otherwise need
 * to land in two places and inevitably drift. AuthView keeps that surface
 * centralized.
 *
 * Differences from the mockup (intentional, see design/reference/README.md):
 * - No `@unsta.edu.ar` gate. Per US-010-f, anyone with a valid email format
 *   can register; the platform is multi-university (ADR-0001) and an
 *   institutional gate would contradict that.
 * - No "Continuar con Google" button. OAuth is out of MVP scope.
 * - No name field on sign-up; the backend's RegisterUser command takes only
 *   email + password. A display name belongs to StudentProfile, which lands
 *   later in F3.
 * - No "olvidé contraseña" link. The reset flow has no backend support yet.
 */
export function AuthView({ mode, children }: Props) {
  const formCopy = FORM_COPY[mode];
  return (
    <AuthSplit
      heading={
        <DisplayHeading>
          Antes de inscribirte,
          <br />
          mirá <em>quiénes ya pasaron</em>
          <br />
          por esa materia.
        </DisplayHeading>
      }
      description="plan-b es donde alumnos simulan su cuatrimestre, comparan comisiones y dejan reseñas verificadas. Sin nombres, sin filtros."
      quote={HERO_QUOTE}
      stats={HERO_STATS}
    >
      <div className="space-y-6">
        <Tabs mode={mode} />
        <header className="space-y-2">
          <DisplayHeading as="h2" size={28}>
            {formCopy.heading}
          </DisplayHeading>
          <Lede>{formCopy.subheading}</Lede>
        </header>
        {children}
      </div>
    </AuthSplit>
  );
}

const HERO_QUOTE = {
  text: '"Iba a anotarme en INT302 con el primero que tenía horario libre. Acá vi que había una comisión de 2c con 4.1 vs 3.4. Esperé un cuatri."',
  attribution: 'Anónimo · 4° año Sistemas',
};

const HERO_STATS: Array<{ label: string; value: string }> = [
  { label: 'alumnos verificados', value: '340' },
  { label: 'reseñas', value: '1.2k' },
  { label: 'carreras', value: '3' },
];

const FORM_COPY: Record<AuthMode, { heading: string; subheading: string }> = {
  signup: {
    heading: 'Empezá en 30 segundos',
    subheading: 'Registrate con tu email para empezar a leer reseñas y dejar las tuyas.',
  },
  signin: {
    heading: 'Buenas de nuevo',
    subheading: 'Ingresá con la cuenta que usaste para registrarte.',
  },
};

function Tabs({ mode }: { mode: AuthMode }) {
  return (
    <div className="flex gap-2" role="tablist" aria-label="Modo de autenticación">
      <Tab href="/sign-up" active={mode === 'signup'}>
        Crear cuenta
      </Tab>
      <Tab href="/sign-in" active={mode === 'signin'}>
        Ingresar
      </Tab>
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch
      role="tab"
      aria-selected={active}
      className={cn(
        'flex-1 text-center rounded-pill border px-4 py-2',
        'text-sm font-medium transition-colors',
        active
          ? 'bg-ink text-white border-ink'
          : 'bg-bg-card text-ink-2 border-line hover:bg-bg-elev hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}
