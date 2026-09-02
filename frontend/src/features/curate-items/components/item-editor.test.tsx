import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CatalogItem } from '../types';
import { ItemEditor } from './item-editor';

// Los Server Actions no corren en jsdom: lo que se prueba acá es la declaración y su aviso, que es
// lo que pasa ANTES de mandar nada. Que el corte se aplique bien es de los tests de integración.
vi.mock('../actions', () => ({
  editItemAction: vi.fn(),
  supersedeItemAction: vi.fn(),
}));

/**
 * La declaración de qué se está cambiando (US-198, E2 y N1).
 *
 * Lo que estos tests protegen es que el corte de serie no pueda pasar por accidente: hay que
 * declararlo, el aviso dice qué consecuencia tiene sobre lo ya respondido, y hasta que no se
 * confirme no se manda nada.
 */
describe('ItemEditor', () => {
  const item: CatalogItem = {
    id: '00000000-0000-0000-0000-000000000007',
    code: 'CHAIR_CLASSES_HELD',
    text: '¿Se dictaron las clases?',
    help: null,
    layer: 'ChairConduct',
    subject: 'Chair',
    origin: 'Seed',
    isActive: true,
    supersedesCode: null,
    supersededByCode: null,
    answerCount: 112,
    updatedAt: '2026-08-21T00:00:00Z',
    retiredAt: null,
    lastChangedBy: 'equipo@planb.test',
    options: [
      { value: 1, order: 1, label: 'Casi todas', valence: 'Positive' },
      { value: 2, order: 2, label: 'Faltaron muchas', valence: 'Negative' },
    ],
  };

  it('arranca preguntando qué se está cambiando, sin formulario todavía', () => {
    render(<ItemEditor item={item} onDone={vi.fn()} />);

    expect(screen.getByText('¿Qué estás cambiando?')).toBeInTheDocument();
    expect(screen.queryByLabelText('La pregunta')).not.toBeInTheDocument();
    expect(screen.queryByText('Esto corta la serie')).not.toBeInTheDocument();
  });

  /** Edge de US-198: corregir la redacción no dispara el aviso, porque el significado no cambió. */
  it('declarar que cambia la redacción abre el form sin aviso de corte', async () => {
    const user = userEvent.setup();
    render(<ItemEditor item={item} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Cómo está escrito/ }));

    expect(screen.getByLabelText('La pregunta')).toHaveValue('¿Se dictaron las clases?');
    expect(screen.queryByText('Esto corta la serie')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar el cambio' })).toBeInTheDocument();
  });

  /**
   * US-198 E2: el aviso llega ANTES de confirmar, y nombra la consecuencia con su código y sus
   * respuestas. "Esta acción es irreversible" no le diría a nadie qué pasa con lo ya respondido.
   */
  it('declarar que cambia lo que se pregunta levanta el aviso con su consecuencia concreta', async () => {
    const user = userEvent.setup();
    render(<ItemEditor item={item} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Lo que pregunta/ }));

    const warning = screen.getByText('Esto corta la serie').parentElement;
    expect(warning).toHaveTextContent('CHAIR_CLASSES_HELD_B');
    expect(warning).toHaveTextContent('112 respuestas');
    expect(warning).toHaveTextContent('no se borran');
    expect(warning).toHaveTextContent('los dos tramos separados');
  });

  it('el código nuevo se propone y se puede cambiar antes de confirmar', async () => {
    const user = userEvent.setup();
    render(<ItemEditor item={item} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Lo que pregunta/ }));
    const code = screen.getByLabelText('El código nuevo');
    expect(code).toHaveValue('CHAIR_CLASSES_HELD_B');

    await user.clear(code);
    await user.type(code, 'CHAIR_SCHEDULE_HELD');

    expect(screen.getByText('Esto corta la serie').parentElement).toHaveTextContent(
      'CHAIR_SCHEDULE_HELD',
    );
  });

  /**
   * US-198 N1: cambiar de opinión y volver a la redacción deja todo como estaba. No hay nada que
   * cancelar porque no se mandó nada: el corte solo existe cuando se confirma.
   */
  it('volver a la redacción baja el aviso y deja la frase intacta', async () => {
    const user = userEvent.setup();
    render(<ItemEditor item={item} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Lo que pregunta/ }));
    await user.click(screen.getByRole('button', { name: /Cómo está escrito/ }));

    expect(screen.queryByText('Esto corta la serie')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('El código nuevo')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar el cambio' })).toBeInTheDocument();
  });

  it('registra quién hizo el último cambio y cuándo', () => {
    render(<ItemEditor item={item} onDone={vi.fn()} />);

    expect(screen.getByText(/último cambio: equipo@planb.test/)).toBeInTheDocument();
  });

  /**
   * Una frase retirada se lee y no se edita: su texto es el enunciado bajo el que ya se respondió, y
   * la ficha lo muestra al lado de esos conteos.
   */
  it('una frase retirada no ofrece edición, y dice qué pasó con sus respuestas', () => {
    const retired: CatalogItem = {
      ...item,
      isActive: false,
      retiredAt: '2026-08-21T00:00:00Z',
      supersededByCode: 'CHAIR_CLASSES_HELD_B',
    };

    render(<ItemEditor item={retired} onDone={vi.fn()} />);

    expect(screen.queryByText('¿Qué estás cambiando?')).not.toBeInTheDocument();
    expect(screen.getByText(/Conserva sus 112 respuestas/)).toBeInTheDocument();
    expect(screen.getByText(/CHAIR_CLASSES_HELD_B/)).toBeInTheDocument();
  });
});
