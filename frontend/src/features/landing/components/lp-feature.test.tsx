import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LpFeature } from './lp-feature';

describe('LpFeature', () => {
  it('renderiza eyebrow, title, body y el demo pasado por props', () => {
    render(
      <LpFeature eyebrow="Reseñas" title="Un título" body="Un body" demo={<div>DEMO-NODE</div>} />,
    );

    expect(screen.getByText('Reseñas')).toBeInTheDocument();
    expect(screen.getByText('Un título')).toBeInTheDocument();
    expect(screen.getByText('Un body')).toBeInTheDocument();
    expect(screen.getByText('DEMO-NODE')).toBeInTheDocument();
  });
});
