import Link from 'next/link';
import { Logo } from '@/components/ui';
import { cn } from '@/lib/utils';

type Props = {
  /** True cuando hay sesión activa: cambia los CTAs anónimos por "Ir a mi inicio". */
  isLoggedIn: boolean;
};

// Compartida por los 3 links del nav interno: mismo look, se repite literal.
const NAV_LINK_CLASSES = cn(
  'text-inherit no-underline hover:underline',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm',
);

/**
 * Topbar de la landing pública (US-054-f). Port del `<header>` de `Landing`
 * (docs/design/reference/canvas-mocks/landing.jsx, líneas 338-358). Sticky,
 * con nav interno a anclas reales (#features, #data, #faq) en vez del
 * `onClick preventDefault` del mock.
 *
 * `isLoggedIn` decide los CTAs: anónimo ve "Ingresar" / "Crear cuenta"; con
 * sesión ve un único "Ir a mi inicio →" hacia /home. La landing nunca
 * redirige sola a los usuarios logueados (ver US-054-f, notas de
 * implementación): este topbar es la única adaptación por sesión.
 */
export function LpTopbar({ isLoggedIn }: Props) {
  return (
    <header
      className="sticky top-0 z-[5] flex items-center bg-bg border-b border-line"
      style={{ padding: '18px 48px', gap: 18 }}
    >
      <Logo size={16} />
      <span className="flex-1" />
      <nav className="flex items-center text-ink-2" style={{ gap: 24, fontSize: 13 }}>
        <a href="#features" className={NAV_LINK_CLASSES}>
          Cómo funciona
        </a>
        <a href="#data" className={NAV_LINK_CLASSES}>
          Datos
        </a>
        <a href="#faq" className={NAV_LINK_CLASSES}>
          Preguntas
        </a>
      </nav>
      {isLoggedIn ? (
        <Link
          href="/home"
          prefetch
          className={cn(
            'inline-flex items-center justify-center font-medium rounded-pill shadow-card transition-colors',
            'bg-accent text-white border border-accent hover:bg-accent-hover',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
          )}
          style={{ padding: '9px 16px', fontSize: 13.5 }}
        >
          Ir a mi inicio →
        </Link>
      ) : (
        <>
          <Link
            href="/sign-in"
            prefetch
            className={cn(
              'inline-flex items-center justify-center font-medium rounded-pill transition-colors',
              'bg-transparent text-ink-2 border border-transparent hover:bg-line-2 hover:text-ink',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
            )}
            style={{ padding: '9px 16px', fontSize: 13.5 }}
          >
            Ingresar
          </Link>
          <Link
            href="/sign-up"
            prefetch
            className={cn(
              'inline-flex items-center justify-center font-medium rounded-pill shadow-card transition-colors',
              'bg-ink text-white border border-ink hover:bg-[#1a110a]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
            )}
            style={{ padding: '9px 16px', fontSize: 13.5 }}
          >
            Crear cuenta
          </Link>
        </>
      )}
    </header>
  );
}
