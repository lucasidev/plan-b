import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LpFeature } from './lp-feature';

describe('LpFeature', () => {
  it('renderiza code, title, body y el demo pasado por props', () => {
    render(
      <LpFeature
        code="01 · Reseñas"
        title="Un título"
        body="Un body"
        demo={<div>DEMO-NODE</div>}
      />,
    );

    expect(screen.getByText('01 · Reseñas')).toBeInTheDocument();
    expect(screen.getByText('Un título')).toBeInTheDocument();
    expect(screen.getByText('Un body')).toBeInTheDocument();
    expect(screen.getByText('DEMO-NODE')).toBeInTheDocument();
  });
});
