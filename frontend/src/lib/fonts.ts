import { Geist, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google';

/**
 * Font stacks for plan-b. The mockup uses:
 *   - Geist for display + UI (one family doing two duties)
 *   - Instrument Serif italic for the <em> emphasis inside h-display
 *   - IBM Plex Mono for metadata, eyebrows, code-ish bits
 *
 * Each one exposes a CSS variable consumed by globals.css through the
 * --font-* @theme tokens. The body-level family is set in globals.css; what
 * we do here is hand the variables to the root <html> via className.
 */

export const fontDisplay = Geist({
  subsets: ['latin'],
  variable: '--next-font-display',
  display: 'swap',
});

// Same family but a separate variable so future swaps (e.g. Instrument Sans
// for UI) don't require touching every consumer.
export const fontUi = Geist({
  subsets: ['latin'],
  variable: '--next-font-ui',
  display: 'swap',
});

export const fontSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--next-font-serif',
  display: 'swap',
});

export const fontMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--next-font-mono',
  display: 'swap',
});

export const fontVariables = [
  fontDisplay.variable,
  fontUi.variable,
  fontSerif.variable,
  fontMono.variable,
].join(' ');
