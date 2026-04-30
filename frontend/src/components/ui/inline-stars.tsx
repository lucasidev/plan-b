import { Star } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  /**
   * Texto que puede tener `★` como marker. Cada ocurrencia se reemplaza por
   * un icon `<Star />` de lucide. Ejemplo: `"Iturralde 3.4★ vs Sosa 4.1★"`.
   */
  children: string;
  /** Tamaño del icon en px. Por default 11, alineado al body de 13.5px. */
  size?: number;
  /** Tailwind classes para el icon. Por default usa el accent del producto. */
  iconClassName?: string;
};

/**
 * Renderiza texto inline con el marker `★` reemplazado por un Star icon
 * filled de lucide. Usado en bodies de DecisionCards y en testimoniales
 * donde la convención tipográfica de "rating de N★" se mantiene del mockup
 * pero el glyph Unicode generic queda reemplazado por el SVG del design
 * system.
 */
export function InlineStars({
  children,
  size = 11,
  iconClassName = 'text-accent fill-accent',
}: Props) {
  const parts = children.split('★');
  return (
    <>
      {parts.map((part, index) => {
        const key = `${part.slice(0, 8)}-${index}`;
        return (
          <Fragment key={key}>
            {part}
            {index < parts.length - 1 && (
              <Star
                size={size}
                strokeWidth={0}
                className={cn('inline-block align-baseline mx-0.5', iconClassName)}
                style={{ transform: 'translateY(1px)' }}
                aria-label="estrella"
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}
