/**
 * Hero of the About plan-b page (US-074). Eyebrow + display headline + lede. No image
 * or stats: those live in cards inside the main grid.
 */

import { ABOUT_HEADLINE, ABOUT_LEDE } from '../data/content';

export function AboutHero() {
  return (
    <header style={{ maxWidth: 720, marginBottom: 32 }}>
      <div
        className="text-accent"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Sobre plan-b
      </div>
      <h1
        className="text-ink-1"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        {ABOUT_HEADLINE}
      </h1>
      <p
        className="text-ink-3"
        style={{
          fontSize: 16,
          lineHeight: 1.55,
          marginTop: 12,
        }}
      >
        {ABOUT_LEDE}
      </p>
    </header>
  );
}
