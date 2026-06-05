import { AboutShell } from '@/features/about';

export const metadata = {
  title: 'Sobre plan-b · planb',
  description:
    'plan-b es una herramienta de planificación académica multi-universidad hecha por estudiantes. Proyecto Final UNSTA (Tecnicatura en Desarrollo y Calidad de Software).',
};

/**
 * /about (US-074). Public informational page with project manifesto, team, numbers
 * and open source. Accessible without auth from `(public)` and from the "Sobre plan-b"
 * item of the member sidebar (Otros section, configured in `lib/member-shell.ts`).
 *
 * No authenticated-area shell in MVP: when navigating from the member sidebar the
 * page stays in the public view (no sidebar). If later we want the shell to stick,
 * evaluate conditional shell or duplicating the route in (member). Meanwhile, this is
 * honest: the page is semantically public.
 *
 * 100% static: content lives in `features/about/data/content.ts`.
 */
export default function AboutPage() {
  return <AboutShell />;
}
