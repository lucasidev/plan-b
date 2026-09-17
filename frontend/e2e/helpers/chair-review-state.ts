import { expect, type Page } from '@playwright/test';

/** Lee el conteo de la cátedra visitada también cuando una reseña cruza el piso. */
export async function readChairReviewState(
  page: Page,
): Promise<{ count: number; missing: number }> {
  const emptyText = 'Todavía nadie reseñó cómo es cursar acá.';
  const countLine = page
    .getByText(/^Junta \d+ reseñas?: con \d+ más se publica\.$/)
    .or(page.locator('.pb-head .pb-h-meta').filter({ hasText: /^\d+ reseñas? de / }))
    .or(page.getByText(emptyText, { exact: true }));
  await expect(countLine).toBeVisible();
  const text = await countLine.innerText();
  if (text === emptyText) return { count: 0, missing: 10 };

  const belowFloor = text.match(/^Junta (\d+) reseñas?: con (\d+) más se publica\.$/);
  if (belowFloor) return { count: Number(belowFloor[1]), missing: Number(belowFloor[2]) };

  const published = text.match(/^(\d+) reseñas? de /);
  if (!published) throw new Error(`Unrecognized chair review count: "${text}"`);
  return { count: Number(published[1]), missing: 0 };
}
