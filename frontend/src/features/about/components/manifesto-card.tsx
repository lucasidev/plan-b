/**
 * Manifiesto: bloque principal de copy en la página Sobre. Render diferenciado por kind:
 * los párrafos normales van en texto ink-2 default, el último (disclaimer) en itálica + ink-3
 * para suavizar la voz autoritaria del proyecto sobre algo que es voluntario.
 */

import { ABOUT_MANIFESTO } from '../data/content';
import { Card, EyebrowLabel } from './shared';

export function ManifestoCard() {
  return (
    <Card>
      <EyebrowLabel>Manifiesto</EyebrowLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        {ABOUT_MANIFESTO.map((block) => (
          <p
            key={block.text.slice(0, 24)}
            className={block.kind === 'disclaimer' ? 'text-ink-3' : 'text-ink-2'}
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              fontStyle: block.kind === 'disclaimer' ? 'italic' : 'normal',
              margin: 0,
            }}
          >
            {block.text}
          </p>
        ))}
      </div>
    </Card>
  );
}
