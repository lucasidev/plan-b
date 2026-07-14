import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() })),
}));

vi.mock('../actions', () => ({
  approveCareerPlanAction: vi.fn(),
}));

import type { CareerPlanImportPayload } from '../types';
import { CareerPlanPreviewTable } from './preview-table';

const PAYLOAD: CareerPlanImportPayload = {
  items: [
    {
      index: 0,
      rawRow: 'Análisis I - MAT101',
      detectedCode: 'MAT101',
      detectedName: 'Análisis I',
      detectedYearInPlan: 1,
      detectedTermInYear: 1,
      detectedTermKind: 'Cuatrimestral',
      confidence: 'High',
      issues: [],
    },
    {
      index: 1,
      rawRow: 'Física II - texto raro',
      detectedCode: 'FIS201',
      detectedName: 'Física II',
      detectedYearInPlan: 2,
      detectedTermInYear: 2,
      detectedTermKind: 'Cuatrimestral',
      confidence: 'Low',
      issues: ['Nombre ambiguo'],
    },
    {
      index: 2,
      rawRow: 'línea sin código detectable',
      detectedCode: null,
      detectedName: null,
      detectedYearInPlan: null,
      detectedTermInYear: null,
      detectedTermKind: null,
      confidence: 'Medium',
      issues: ['Sin código'],
    },
  ],
  summary: { totalDetected: 3, highConfidence: 1, mediumConfidence: 1, lowConfidence: 1 },
};

function renderTable() {
  return render(
    <CareerPlanPreviewTable
      importId="import-1"
      universityId="uni-1"
      careerName="Ingeniería en Sistemas"
      planYear={2024}
      enrollmentYear={2024}
      payload={PAYLOAD}
    />,
  );
}

describe('CareerPlanPreviewTable', () => {
  it('preselecciona las filas según detectedCode + confidence', () => {
    renderTable();

    // code presente + confianza High -> arranca seleccionada.
    expect(screen.getByRole('checkbox', { name: 'Importar item 1' })).toBeChecked();
    // code presente pero confianza Low -> arranca deseleccionada.
    expect(screen.getByRole('checkbox', { name: 'Importar item 2' })).not.toBeChecked();
    // sin code detectado (aunque la confianza no sea Low) -> deseleccionada.
    expect(screen.getByRole('checkbox', { name: 'Importar item 3' })).not.toBeChecked();
  });

  it('permite togglear la selección de una fila', async () => {
    const user = userEvent.setup();
    renderTable();

    const row2Checkbox = screen.getByRole('checkbox', { name: 'Importar item 2' });
    expect(row2Checkbox).not.toBeChecked();

    await user.click(row2Checkbox);
    expect(row2Checkbox).toBeChecked();

    await user.click(row2Checkbox);
    expect(row2Checkbox).not.toBeChecked();
  });

  it('arma el payload de approve solo con las filas seleccionadas', async () => {
    const user = userEvent.setup();
    const { container } = renderTable();

    // Estado inicial: solo el item 1 (code + High) queda seleccionado.
    let hiddenInput = container.querySelector('input[name="items"]') as HTMLInputElement;
    expect(JSON.parse(hiddenInput.value)).toEqual([
      {
        code: 'MAT101',
        name: 'Análisis I',
        yearInPlan: 1,
        termInYear: 1,
        termKind: 'Cuatrimestral',
      },
    ]);

    // Selecciono también el item 2 (Low, pero con code + name válidos).
    await user.click(screen.getByRole('checkbox', { name: 'Importar item 2' }));

    hiddenInput = container.querySelector('input[name="items"]') as HTMLInputElement;
    expect(JSON.parse(hiddenInput.value)).toEqual([
      {
        code: 'MAT101',
        name: 'Análisis I',
        yearInPlan: 1,
        termInYear: 1,
        termKind: 'Cuatrimestral',
      },
      {
        code: 'FIS201',
        name: 'Física II',
        yearInPlan: 2,
        termInYear: 2,
        termKind: 'Cuatrimestral',
      },
    ]);

    expect(screen.getByRole('button', { name: /Crear plan con 2 materias/ })).toBeInTheDocument();
  });
});
