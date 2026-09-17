/**
 * Open-source card: invitation to contribute + link to the repo. Static until formal
 * issues / discussions show up in the repo.
 */

import Link from 'next/link';
import { ABOUT_REPO_URL } from '../data/content';
import { Card } from './shared';

export function OpenSourceCard() {
  return (
    <Card>
      <p className="text-ink-2" style={{ fontSize: 14, lineHeight: 1.55, margin: 0 }}>
        <span className="text-ink font-semibold">plan-b</span> es código abierto.
      </p>
      <Link
        href={ABOUT_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-ink underline underline-offset-4 hover:text-ink-2"
        style={{
          fontSize: 13.5,
          marginTop: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontWeight: 500,
        }}
      >
        github.com/lucasidev/plan-b →
      </Link>
    </Card>
  );
}
