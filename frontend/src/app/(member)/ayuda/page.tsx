import { HelpShell } from '@/features/help';

export const metadata = {
  title: 'Ayuda · planb',
};

/**
 * /ayuda (US-073). Centro de ayuda con FAQ y canal de contacto. Server component (la única
 * parte cliente es el accordion del FAQ que mantiene state local). Sin backend en MVP: el
 * "chat de soporte" del mockup es un mailto al support email. Cuando aterrice Notifications
 * BC se suma el form con `POST /api/support/contact` y este shell renderea ambos.
 */
export default function AyudaPage() {
  return <HelpShell />;
}
