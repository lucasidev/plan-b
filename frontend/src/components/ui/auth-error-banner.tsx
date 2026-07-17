import { cn } from '@/lib/utils';

type Props = {
  /** Contenido del error: el mensaje y, opcionalmente, una acción (ej. reenviar verificación). */
  children: React.ReactNode;
  className?: string;
};

/**
 * Banner de error inline para los forms de auth (US-059-f). Extrae el markup que
 * `SignInForm` y `SignUpForm` duplicaban (mismo contenedor role="alert" con borde
 * y fondo). Port de `AuthErrorBanner` del canvas v2
 * (docs/design/reference/canvas-mocks/auth.jsx): fondo rojizo suave + ⚠.
 *
 * El fondo/texto usan los tokens de estado `st-failed` (el mock los hardcodea en
 * oklch; acá van por token del design system, que es el mismo hue). `role="alert"`
 * para que el lector de pantalla lo anuncie al aparecer tras el submit; el ⚠ es
 * decorativo (`aria-hidden`), el texto ya comunica el error.
 */
export function AuthErrorBanner({ children, className }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded text-sm bg-st-failed-bg text-st-failed-fg',
        className,
      )}
      style={{ padding: 12, marginBottom: 14 }}
    >
      <span aria-hidden style={{ lineHeight: 1.45 }}>
        ⚠
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
