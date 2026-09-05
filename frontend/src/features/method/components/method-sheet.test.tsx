import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CurrentInstrument } from '@/components/instrument/types';
import { MethodSheet } from './method-sheet';

/** Un cuestionario mínimo con una pregunta por capa, para poder afirmar sobre las tres. */
const INSTRUMENT: CurrentInstrument = {
  code: 'TEST',
  version: 1,
  items: [
    {
      code: 'GROUP_SIZE',
      text: '¿Cuántos eran en la comisión?',
      help: null,
      layer: 'Context',
      origin: 'Seed',
      options: [
        { value: 1, label: 'Menos de 20' },
        { value: 2, label: 'Más de 20' },
      ],
    },
    {
      code: 'CLASSES_HELD',
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
      code: 'COURSE_OUTCOME',
      text: '¿Cómo terminaste la cursada?',
      help: null,
      layer: 'StudentExperience',
      origin: 'Seed',
      options: [{ value: 1, label: 'La aprobé' }],
    },
  ],
};

/**
 * Método existe para que un número se pueda rastrear hasta la regla que lo calculó. Los pisos, que
 * son los únicos números de la pantalla, salen del backend y no están escritos acá.
 *
 * De eso se desprenden las dos cosas que se prueban: que la pantalla derive bien el número que
 * muestra a partir del piso que le dan, y que cuando no le dan ninguno **no invente uno**. Un piso
 * inventado es peor que ausente, porque suena a método.
 *
 * Los pisos de acá no son los de producto (esos se pinean en `PublishingRulesTests`, del lado del
 * backend): son valores cualesquiera, elegidos distintos entre sí para que ningún assert pase por
 * coincidencia con el número real.
 */
describe('MethodSheet', () => {
  it('deriva del piso el número de reseñas con el que una cátedra todavía no publica', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(
      screen.getByRole('heading', { name: 'Por qué una cátedra con 6 reseñas no publica' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/desde las 7 reseñas/)).toBeInTheDocument();
  });

  it('publica el piso del par de materias, que es otro y protege otra cosa', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(screen.getByText(/su propio piso, de 4 por par y período/)).toBeInTheDocument();
  });

  it('sin piso no inventa un número: lo dice y deja el resto legible', () => {
    render(<MethodSheet instrument={null} chairFloor={null} pairFloor={null} />);

    expect(
      screen.getByRole('heading', { name: 'Por qué una cátedra con pocas reseñas no publica' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no pudimos leer el mínimo vigente/i)).toBeInTheDocument();

    // La razón del piso no depende del número, así que sigue publicada.
    expect(screen.getByText(/privacidad de quien reseña/)).toBeInTheDocument();

    // Y el resto de Método, que no tiene números, queda entero.
    expect(screen.getByRole('heading', { name: 'Cómo se arma un conteo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Qué sesgos tiene esto' })).toBeInTheDocument();
  });

  it('sin cuestionario publicado lo dice, en vez de mostrar un catálogo vacío', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(screen.getByText(/todavía no hay un cuestionario publicado/i)).toBeInTheDocument();
  });

  it('US-130 E1: publica cómo se arma un conteo, para que se pueda reproducir sin pedir nada', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    // La moda es la opción literal más marcada, y la distribución que la sostiene es el resto del
    // dato: sin las dos, un porcentaje suelto no se puede reproducir.
    expect(screen.getByText(/más elegida/)).toBeInTheDocument();
    expect(screen.getByText(/distribución completa/)).toBeInTheDocument();
    expect(screen.getByText(/con los ceros incluidos/)).toBeInTheDocument();
  });

  it('US-130 E2: la convergencia se sostiene con sus preguntas a la vista, nunca con un promedio', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(
      screen.getByText(/varias preguntas distintas apuntan al mismo lado/),
    ).toBeInTheDocument();
    expect(screen.getByText(/con las preguntas a la vista/)).toBeInTheDocument();
    expect(screen.getByText(/Nada se promedia/)).toBeInTheDocument();
  });

  it('US-130 E3: la comparación se explica entera, incluido que una cátedra sola no se compara', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(screen.getByText(/intervalo de Wilson/)).toBeInTheDocument();
    expect(screen.getByText(/si los intervalos de las dos cátedras se tocan/i)).toBeInTheDocument();

    // El caso que faltaba: sin hermanas no hay contra qué comparar.
    expect(screen.getByText(/la única de su materia/)).toBeInTheDocument();
  });

  it('US-130 E4: cada pregunta se lista con su capa y con todas sus opciones', () => {
    render(<MethodSheet instrument={INSTRUMENT} chairFloor={7} pairFloor={4} />);

    // Las tres capas, cada una nombrada y con lo suyo.
    expect(screen.getByText('Contexto de la cursada')).toBeInTheDocument();
    expect(screen.getByText('Qué hizo la cátedra')).toBeInTheDocument();
    expect(screen.getByText('Qué te pasó a vos')).toBeInTheDocument();

    // Y el catálogo entero, no una muestra: las tres opciones de la frase de conducta, completas.
    expect(screen.getByText('¿Se dictaron las clases?')).toBeInTheDocument();
    expect(screen.getByText(/Casi todas · Faltaron algunas · Faltaron muchas/)).toBeInTheDocument();
  });

  it('US-130 E5: los datos oficiales citan su fuente y el período que relevan', () => {
    render(<MethodSheet instrument={null} chairFloor={7} pairFloor={4} />);

    expect(screen.getByText(/la fuente y el período relevado/)).toBeInTheDocument();
  });

  it('sin ninguna destilada todavía, lo dice en vez de callarlo', () => {
    render(<MethodSheet instrument={INSTRUMENT} chairFloor={7} pairFloor={4} />);

    expect(screen.getByText(/semilla/)).toBeInTheDocument();
    expect(screen.getByText(/todavía no hay ninguna/i)).toBeInTheDocument();
  });

  it('la pregunta que salió del campo libre va marcada, y Método las cuenta', () => {
    const withDistilled = {
      ...INSTRUMENT,
      items: [
        ...INSTRUMENT.items,
        {
          code: 'CHAIR_EXAM_SCOPE',
          text: '¿Sabías con qué se rendía el final?',
          help: null,
          layer: 'ChairConduct',
          origin: 'Distilled',
          options: [
            { value: 1, label: 'Sí' },
            { value: 2, label: 'No' },
          ],
        },
      ],
    } satisfies CurrentInstrument;

    render(<MethodSheet instrument={withDistilled} chairFloor={7} pairFloor={4} />);

    // La marca va al lado de su pregunta, que es donde sirve para auditar ese número. Se busca
    // dentro del párrafo de la frase: la palabra también aparece en la explicación de arriba.
    const question = screen.getByText(/sabías con qué se rendía el final/i);
    expect(question).toHaveTextContent('destilada');

    // Y el conteo, que es lo que deja ver cuánto evolucionó el instrumento desde lo cualitativo.
    expect(screen.getByText(/hay una\./)).toBeInTheDocument();
    expect(screen.queryByText(/todavía no hay ninguna/i)).not.toBeInTheDocument();
  });
});
