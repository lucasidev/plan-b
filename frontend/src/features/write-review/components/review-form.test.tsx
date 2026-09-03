import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentInstrument, SubjectOption, TermOption } from '../types';
import { ReviewForm } from './review-form';

/**
 * Component tests de la pantalla Reseñar (US-146, US-147, ficha SC-015), escritos desde las
 * stories y el contrato público (`types.ts`, `schema.ts`, la firma de `ReviewForm`), sin haber
 * leído antes el cuerpo del componente.
 *
 * El instrumento de fixture usa los textos y opciones reales del catálogo
 * (docs/product/phrases.md) para que lo que aparece en pantalla sea lo que una frase real diría.
 */

vi.mock('../actions', () => ({
  publishReviewAction: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { publishReviewAction } from '../actions';

const actionMock = vi.mocked(publishReviewAction);

const INSTRUMENT: CurrentInstrument = {
  code: 'course-review',
  version: 1,
  items: [
    // Capa de contexto (paso 3): no se publica, sirve para leer los números. Este código es el
    // real del catálogo (COURSE_OUTCOME, no uno inventado): el componente lo verifica puntual
    // para saber si se respondió cómo terminó (US-146 N1).
    {
      code: 'COURSE_OUTCOME',
      text: '¿Cómo terminó?',
      help: null,
      layer: 'Context',
      origin: 'Seed',
      options: [
        { value: 1, label: 'La aprobé' },
        { value: 2, label: 'Me quedó regular' },
        { value: 3, label: 'La recursé' },
        { value: 4, label: 'La dejé' },
      ],
    },
    {
      code: 'attempts-count',
      text: '¿Cuántas veces la cursaste, contando esta?',
      help: null,
      layer: 'Context',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Una' },
        { value: 2, label: 'Dos' },
        { value: 3, label: 'Tres o más' },
      ],
    },
    // Qué hizo la cátedra (paso 4): conducta observable.
    {
      code: 'answered-in-class',
      text: '¿Contestaba las preguntas que le hacían en clase?',
      help: null,
      layer: 'ChairConduct',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Siempre' },
        { value: 2, label: 'A veces' },
        { value: 3, label: 'Casi nunca' },
        { value: 4, label: 'Nadie preguntaba' },
      ],
    },
    {
      code: 'classes-held',
      text: '¿Se dictaron las clases?',
      help: null,
      layer: 'ChairConduct',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Casi todas' },
        { value: 2, label: 'Faltaron algunas' },
        { value: 3, label: 'Faltaron muchas' },
      ],
    },
    {
      code: 'practice-matched-theory',
      text: '¿El práctico daba lo mismo que el teórico?',
      help: null,
      layer: 'ChairConduct',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Sí' },
        { value: 2, label: 'Había diferencias' },
        { value: 3, label: 'Eran dos materias distintas' },
      ],
    },
    {
      code: 'answered-outside-class',
      text: '¿Respondía consultas fuera de clase?',
      help: null,
      layer: 'ChairConduct',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Sí' },
        { value: 2, label: 'A veces' },
        { value: 3, label: 'No había forma' },
      ],
    },
    {
      code: 'midterm-notice',
      text: '¿Avisó la fecha del parcial con anticipación?',
      help: null,
      layer: 'ChairConduct',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Más de 2 semanas' },
        { value: 2, label: '1 a 2 semanas' },
        { value: 3, label: 'Menos de una semana' },
        { value: 4, label: 'Nos enteramos de casualidad' },
      ],
    },
    {
      code: 'syllabus-delivered',
      text: '¿Entregó el programa al inicio?',
      help: null,
      layer: 'ChairConduct',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Sí' },
        { value: 2, label: 'Tarde' },
        { value: 3, label: 'Nunca lo vi' },
      ],
    },
    {
      code: 'off-syllabus-topics',
      text: '¿Tomó temas que no estaban en el programa?',
      help: null,
      layer: 'ChairConduct',
      origin: 'Seed',
      options: [
        { value: 1, label: 'No' },
        { value: 2, label: 'Alguno' },
        { value: 3, label: 'Varios' },
      ],
    },
    // Qué te pasó a vos (paso 5): vivencia.
    {
      code: 'understood-in-class',
      text: '¿Salías de la clase entendiendo el tema?',
      help: null,
      layer: 'StudentExperience',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Casi siempre' },
        { value: 2, label: 'A veces' },
        { value: 3, label: 'Casi nunca' },
      ],
    },
    {
      code: 'material-was-enough',
      text: '¿El material alcanzaba para preparar el parcial?',
      help: null,
      layer: 'StudentExperience',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Sí' },
        { value: 2, label: 'Había que buscar por afuera' },
        { value: 3, label: 'No servía' },
      ],
    },
    {
      code: 'kept-pace',
      text: '¿Pudiste seguir el ritmo?',
      help: null,
      layer: 'StudentExperience',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Sí' },
        { value: 2, label: 'Con esfuerzo' },
        { value: 3, label: 'Me quedé atrás' },
      ],
    },
    {
      code: 'could-ask-without-shame',
      text: '¿Sentías que podías preguntar sin quedar mal?',
      help: null,
      layer: 'StudentExperience',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Sí' },
        { value: 2, label: 'Depende del día' },
        { value: 3, label: 'No' },
      ],
    },
  ],
};

const SUBJECTS: readonly SubjectOption[] = [
  { id: 'subj-databases', code: 'BD101', name: 'Bases de Datos', yearInPlan: 2 },
  { id: 'subj-analysis-2', code: 'AM201', name: 'Análisis Matemático II', yearInPlan: 2 },
  { id: 'subj-programming-1', code: 'PR101', name: 'Programación I', yearInPlan: 1 },
];

const TERMS: readonly TermOption[] = [{ id: 'term-2026-c1', label: '2026-C1' }];

/** Stubea el fetch de cátedras que dispara el efecto al elegir materia (no pega a un backend real). */
function stubChairsFetch(chairs: readonly { id: string; name: string }[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => chairs,
    }),
  );
}

function keptPaceGroup() {
  return screen.getByRole('group', { name: '¿Pudiste seguir el ritmo?' });
}

async function answerKeptPaceYes(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(keptPaceGroup()).getByRole('button', { name: 'Sí' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  stubChairsFetch([]);
});

describe('US-146: reseñar en menos de dos minutos', () => {
  /**
   * US-146 E1: responde "la aprobé" en cómo terminó, elige "No sé" en cátedra, responde una sola
   * frase del paso 5 (pudo seguir el ritmo) y deja el resto sin contestar; la reseña se envía igual.
   */
  it('publica la reseña con solo opciones cerradas, sin escribir nada obligatorio', async () => {
    stubChairsFetch([{ id: 'chair-1', name: 'Cátedra Pérez' }]);
    actionMock.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

    await user.click(screen.getByRole('button', { name: /análisis matemático ii/i }));
    await user.click(screen.getByRole('button', { name: '2026-C1' }));
    await user.click(await screen.findByRole('button', { name: /no me acuerdo/i }));
    await user.click(
      within(screen.getByRole('group', { name: '¿Cómo terminó?' })).getByRole('button', {
        name: 'La aprobé',
      }),
    );
    await answerKeptPaceYes(user);

    const submit = screen.getByRole('button', { name: /enviar la reseña/i });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(actionMock).toHaveBeenCalledTimes(1);
    const [, formData] = actionMock.mock.calls[0] as [unknown, FormData];
    const payload = JSON.parse(formData.get('payload') as string);
    expect(payload).toMatchObject({
      subjectId: 'subj-analysis-2',
      termId: 'term-2026-c1',
      chairId: null,
      answers: { COURSE_OUTCOME: 1, 'kept-pace': 1 },
    });
    expect(payload.freeText).toBeFalsy();
  });

  describe('materia, período y cómo terminó son los únicos obligatorios (US-146)', () => {
    /** US-146 N1: sin elegir materia, el sistema no deja enviar. */
    it('no deja enviar si no se eligió la materia', async () => {
      const user = userEvent.setup();
      render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

      await user.click(screen.getByRole('button', { name: '2026-C1' }));
      await answerKeptPaceYes(user);

      expect(screen.getByRole('button', { name: /enviar la reseña/i })).toBeDisabled();
    });

    /** US-146 N1: sin elegir período, el sistema no deja enviar. */
    it('no deja enviar si no se eligió el período', async () => {
      const user = userEvent.setup();
      render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

      await user.click(screen.getByRole('button', { name: /análisis matemático ii/i }));
      await answerKeptPaceYes(user);

      expect(screen.getByRole('button', { name: /enviar la reseña/i })).toBeDisabled();
    });

    /** US-146 N1: sin responder cómo terminó la cursada, el sistema no deja enviar. */
    it('no deja enviar si no se respondió cómo terminó la cursada', async () => {
      const user = userEvent.setup();
      render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

      await user.click(screen.getByRole('button', { name: /análisis matemático ii/i }));
      await user.click(screen.getByRole('button', { name: '2026-C1' }));
      await answerKeptPaceYes(user);

      expect(screen.getByRole('button', { name: /enviar la reseña/i })).toBeDisabled();
    });
  });

  /**
   * US-146 X: doble click en "Enviar la reseña" dispara una sola llamada a la action.
   *
   * La action queda en vuelo (promesa sin resolver) mientras dura el doble click, tal como pasa
   * contra un backend real: con `mockResolvedValue` (resuelve en el mismo tick) el botón se
   * reabilita entre uno y otro click y el caso deja de ser un doble click sobre un envío pendiente.
   * El conteo de llamadas ya lo protege React (una transición de acción en curso ignora un
   * segundo submit del mismo form); la aserción de `disabled` cubre la parte que es responsabilidad
   * del componente: avisar visualmente que el envío ya está en camino.
   */
  it('el doble click en Enviar la reseña no genera dos llamadas a la action', async () => {
    let resolveAction: (value: { status: 'idle' }) => void = () => {};
    actionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

    await user.click(screen.getByRole('button', { name: /análisis matemático ii/i }));
    await user.click(screen.getByRole('button', { name: '2026-C1' }));
    await user.click(
      within(screen.getByRole('group', { name: '¿Cómo terminó?' })).getByRole('button', {
        name: 'La aprobé',
      }),
    );
    await answerKeptPaceYes(user);

    const submit = screen.getByRole('button', { name: /enviar la reseña/i });
    await user.dblClick(submit);

    expect(actionMock).toHaveBeenCalledTimes(1);
    expect(submit).toBeDisabled();

    await act(async () => {
      resolveAction({ status: 'idle' });
    });
  });

  /** US-146 X: el campo libre no permite escribir más de 2000 caracteres (el tope de schema.ts). */
  it('el campo libre no deja escribir más de 2000 caracteres', async () => {
    const user = userEvent.setup();
    render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

    const freeText = screen.getByLabelText(/algo que no te preguntamos/i);
    await user.click(freeText);
    await user.paste('a'.repeat(2001));

    expect((freeText as HTMLTextAreaElement).value.length).toBe(2000);
  });
});

describe('US-147: reseñar una materia sola', () => {
  /** US-147 E1: el paso 1 arranca con un buscador y ofrece las materias sueltas, no un checklist. */
  it('el paso 1 ofrece un buscador y ninguna casilla para tildar varias materias', () => {
    render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bases de datos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /análisis matemático ii/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /programación i/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  /** US-147 N1: elegir una segunda materia reemplaza la primera, nunca se tildan las dos juntas. */
  it('elegir una segunda materia reemplaza la elección, no las suma', async () => {
    const user = userEvent.setup();
    render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

    const databases = screen.getByRole('button', { name: /bases de datos/i });
    const programming = screen.getByRole('button', { name: /programación i/i });

    await user.click(databases);
    expect(databases).toHaveAttribute('aria-pressed', 'true');

    await user.click(programming);
    expect(programming).toHaveAttribute('aria-pressed', 'true');
    expect(databases).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('SC-015: estados que dependen de props', () => {
  it('sin materias en el plan, el paso 1 no ofrece ninguna opción', () => {
    render(<ReviewForm instrument={INSTRUMENT} subjects={[]} terms={TERMS} />);

    expect(screen.getByText(/ninguna materia de tu plan coincide con eso/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /año$/i })).toHaveLength(0);
  });

  it('sin períodos disponibles, no hay ninguno para elegir y el envío queda bloqueado', async () => {
    const user = userEvent.setup();
    render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={[]} />);

    await user.click(screen.getByRole('button', { name: /análisis matemático ii/i }));
    await answerKeptPaceYes(user);

    expect(screen.getByText('¿Cuándo la cursaste?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar la reseña/i })).toBeDisabled();
  });

  it('si el instrumento no trae frases de conducta observable, el paso no se ofrece', () => {
    const withoutChairConduct: CurrentInstrument = {
      ...INSTRUMENT,
      items: INSTRUMENT.items.filter((item) => item.layer !== 'ChairConduct'),
    };
    render(<ReviewForm instrument={withoutChairConduct} subjects={SUBJECTS} terms={TERMS} />);

    expect(screen.queryByText(/qué hizo la cátedra/i)).not.toBeInTheDocument();
  });
});

describe('SC-015: estado "Sin cátedra"', () => {
  /**
   * Ficha SC-015, estado "Sin cátedra": sin cátedra elegida, el paso "Qué hizo la cátedra" no se
   * ofrece, y lo que se hubiera contestado ahí mientras hubo una cátedra elegida no viaja: no hay
   * a quién atribuirle esa conducta.
   */
  it('con la cátedra en "No me acuerdo", el paso no se muestra y sus respuestas no viajan', async () => {
    stubChairsFetch([{ id: 'chair-1', name: 'Cátedra Pérez' }]);
    actionMock.mockResolvedValue({ status: 'idle' });
    const user = userEvent.setup();
    render(<ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />);

    await user.click(screen.getByRole('button', { name: /análisis matemático ii/i }));
    await user.click(screen.getByRole('button', { name: '2026-C1' }));
    await user.click(await screen.findByRole('button', { name: /cátedra pérez/i }));
    await user.click(
      within(screen.getByRole('group', { name: '¿Se dictaron las clases?' })).getByRole('button', {
        name: 'Casi todas',
      }),
    );

    await user.click(screen.getByRole('button', { name: /no me acuerdo/i }));
    expect(screen.queryByText(/qué hizo la cátedra/i)).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole('group', { name: '¿Cómo terminó?' })).getByRole('button', {
        name: 'La aprobé',
      }),
    );
    await user.click(screen.getByRole('button', { name: /enviar la reseña/i }));

    expect(actionMock).toHaveBeenCalledTimes(1);
    const [, formData] = actionMock.mock.calls[0] as [unknown, FormData];
    const payload = JSON.parse(formData.get('payload') as string);
    expect(payload.chairId).toBeNull();
    expect(payload.answers).toEqual({ COURSE_OUTCOME: 1 });
  });
});

describe('SC-015: lo que no muestra nunca', () => {
  /** Ficha SC-015 "Lo que no muestra nunca": ningún puntaje, promedio ni estrella en ningún paso. */
  it('no muestra puntaje, promedio ni estrellas en ningún paso', async () => {
    stubChairsFetch([{ id: 'chair-1', name: 'Cátedra Pérez' }]);
    const user = userEvent.setup();
    const { container } = render(
      <ReviewForm instrument={INSTRUMENT} subjects={SUBJECTS} terms={TERMS} />,
    );

    await user.click(screen.getByRole('button', { name: /análisis matemático ii/i }));
    await screen.findByRole('button', { name: /no me acuerdo/i });

    expect(container.textContent).not.toMatch(/★|puntaje|promedio|\/\s*5|\/\s*10/i);
  });
});
