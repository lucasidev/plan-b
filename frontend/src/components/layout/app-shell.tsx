import { AvatarMenu } from './avatar-menu';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

type Props = {
  /** Logged-in user email, comes from the session read in the RSC layout. */
  email: string;
  children: React.ReactNode;
};

/**
 * Chrome for the `(member)` area: sidebar (with AvatarMenu in the footer) + topbar +
 * scrollable content area.
 *
 * Server component (no `'use client'`): only receives the session email and composes
 * the three blocks. Interactivity lives in the children (Sidebar, Topbar, AvatarMenu
 * each mark `'use client'` where needed).
 *
 * Layout: two-column grid (240px fixed sidebar + 1fr main). Mobile keeps the sidebar
 * visible for now; when we add a collapsable drawer, this component decides whether
 * to render the desktop or mobile shell based on the breakpoint via CSS, not JS.
 *
 * Per `docs/design/reference/styles.css::.app`.
 */
export function AppShell({ email, children }: Props) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: '240px 1fr',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Sidebar footer={<AvatarMenu email={email} />} />
      <div className="flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-bg">{children}</main>
      </div>
    </div>
  );
}
