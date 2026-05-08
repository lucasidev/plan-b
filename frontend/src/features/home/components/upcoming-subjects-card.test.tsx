import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ActiveSubject } from '../data/active-subjects';
import { UpcomingSubjectsCard } from './upcoming-subjects-card';

const futura: ActiveSubject = {
  code: 'QUI201',
  name: 'Química General',
  mod: '2c',
  com: 'A',
  prof: 'Méndez',
  diff: 3,
  week: 0,
  weeks: 16,
  next: 'arranca el 5 ago',
  attendance: null,
  note: null,
};

describe('UpcomingSubjectsCard', () => {
  it('renderea code + name + next para cada item', () => {
    render(<UpcomingSubjectsCard subjects={[futura]} />);
    expect(screen.getByText('QUI201')).toBeInTheDocument();
    expect(screen.getByText('Química General')).toBeInTheDocument();
    expect(screen.getByText('arranca el 5 ago')).toBeInTheDocument();
  });

  it('renderea null cuando no hay materias futuras (no aparece el bloque)', () => {
    const { container } = render(<UpcomingSubjectsCard subjects={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderea múltiples items con separadores', () => {
    const second: ActiveSubject = { ...futura, code: 'BIO201', name: 'Biología' };
    render(<UpcomingSubjectsCard subjects={[futura, second]} />);
    expect(screen.getByText('Química General')).toBeInTheDocument();
    expect(screen.getByText('Biología')).toBeInTheDocument();
  });
});
