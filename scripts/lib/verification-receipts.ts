import { randomUUID } from 'node:crypto';
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import type { Evidence } from './verification-policy.ts';

/** Cada ejecución conserva su resultado: otro proceso no puede pisar un fallo. */
export function receiptPath(folder: string, check: string): string {
  return resolve(folder, `${check}.${randomUUID()}.json`);
}

export function readEvidence(folder: string, check: string): Evidence[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((name) => name.startsWith(`${check}.`) && name.endsWith('.json'))
    .map((name) => {
      try {
        const evidence = JSON.parse(readFileSync(resolve(folder, name), 'utf8')) as Evidence;
        if (
          !evidence ||
          typeof evidence.fingerprint !== 'string' ||
          !Number.isFinite(evidence.completedAt)
        )
          throw new Error('Invalid evidence');
        return evidence;
      } catch {
        return {
          fingerprint: '*',
          outcome: 'incomplete',
          completedAt: statSync(resolve(folder, name)).mtimeMs,
          url: resolve(folder, name),
          durationMs: 0,
        };
      }
    });
}

export function writeEvidence(path: string, evidence: Evidence): void {
  const temp = `${path}.tmp`;
  writeFileSync(temp, JSON.stringify(evidence));
  renameSync(temp, path);
}
