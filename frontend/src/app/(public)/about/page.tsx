import { AboutShell } from '@/features/about';

export const metadata = {
  title: 'Sobre plan-b · planb',
  description:
    'plan-b es una herramienta de planificación académica multi-universidad hecha por estudiantes. Proyecto Final UNSTA (Tecnicatura en Desarrollo y Calidad de Software).',
};

/**
 * /about (US-074). Página informacional pública con manifiesto del proyecto, equipo, números
 * y open source. Accesible sin auth desde `(public)` y desde el ítem "Sobre plan-b" del
 * sidebar member (sección Otros, configurada en `lib/member-shell.ts`).
 *
 * Sin shell del área autenticada en MVP: al navegar desde el sidebar member la página queda
 * en la vista pública (sin sidebar). Si más adelante queremos que el shell se mantenga,
 * evaluamos shell condicional o duplicar la ruta en (member). Mientras, esto es honest:
 * la página es semánticamente pública.
 *
 * 100% estática: el contenido vive en `features/about/data/content.ts`.
 */
export default function SobrePage() {
  return <AboutShell />;
}
