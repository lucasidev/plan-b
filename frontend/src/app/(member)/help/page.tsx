import { HelpShell } from '@/features/help';

export const metadata = {
  title: 'Ayuda · planb',
};

/**
 * /help (US-073). Help center with FAQ and contact channel. Server component (the only
 * client part is the FAQ accordion that keeps local state). No backend in MVP: the
 * mockup's "chat de soporte" is a mailto to the support email. When Notifications BC
 * lands the contact form with `POST /api/support/contact` is added and this shell
 * renders both.
 */
export default function HelpPage() {
  return <HelpShell />;
}
