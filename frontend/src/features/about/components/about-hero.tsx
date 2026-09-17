/**
 * Hero of the About plan-b page (US-074). Eyebrow + display headline + lede. No image
 * or stats: those live in cards inside the main grid.
 */

import { ABOUT_HEADLINE, ABOUT_LEDE } from '../data/content';

export function AboutHero() {
  return (
    <header className="max-w-2xl">
      <p className="pb-eyebrow">Sobre plan-b</p>
      <h1 className="font-serif text-ink">{ABOUT_HEADLINE}</h1>
      <p className="pb-h-sub">{ABOUT_LEDE}</p>
    </header>
  );
}
