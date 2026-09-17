/**
 * Header of the Help page (US-073). Eyebrow + h1 + lede. No image, no actions; the
 * main content (FAQ + sidebar with contact/resources) goes below.
 */

export function HelpHero() {
  return (
    <header className="max-w-2xl">
      <p className="pb-eyebrow">Ayuda</p>
      <h1 className="font-serif text-ink">¿Cómo te ayudamos?</h1>
      <p className="pb-h-sub">Tutoriales rápidos, atajos y un canal directo si te trabaste.</p>
    </header>
  );
}
