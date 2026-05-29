import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StarRatingInput } from './star-rating-input';

describe('StarRatingInput', () => {
  it('renderea 5 radios de estrella accesibles', () => {
    render(<StarRatingInput value={0} onChange={() => {}} fieldId="rating" />);
    // 5 radios; cada uno tiene su sr-only label "N estrella(s)"
    expect(screen.getByRole('radio', { name: /1 estrella$/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /2 estrellas/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /5 estrellas/ })).toBeInTheDocument();
  });

  it('llama onChange con el valor de la estrella clickeada', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StarRatingInput value={0} onChange={onChange} fieldId="rating" />);
    await user.click(screen.getByRole('radio', { name: /4 estrellas/ }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marca la estrella seleccionada con checked y muestra la label semantica', () => {
    render(<StarRatingInput value={3} onChange={() => {}} fieldId="rating" />);
    const third = screen.getByRole('radio', { name: /3 estrellas/ });
    expect(third).toBeChecked();
    expect(screen.getByText('aceptable')).toBeInTheDocument();
  });

  it('no muestra label semantica cuando value es 0 (sentinel no elegido)', () => {
    render(<StarRatingInput value={0} onChange={() => {}} fieldId="rating" />);
    // Las 5 labels posibles no deberian estar
    expect(screen.queryByText('mala')).not.toBeInTheDocument();
    expect(screen.queryByText('excelente')).not.toBeInTheDocument();
  });
});
