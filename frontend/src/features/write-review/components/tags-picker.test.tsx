import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TagsPicker } from './tags-picker';

describe('TagsPicker', () => {
  it('renderea los chips de tags como checkboxes', () => {
    render(<TagsPicker selected={[]} onToggle={() => {}} fieldId="tags" />);
    expect(screen.getByRole('checkbox', { name: /claro explicando/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /TPs bien armados/i })).toBeInTheDocument();
  });

  it('llama onToggle con el tag clickeado', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TagsPicker selected={[]} onToggle={onToggle} fieldId="tags" />);
    await user.click(screen.getByRole('checkbox', { name: /parciales justos/i }));
    expect(onToggle).toHaveBeenCalledWith('parciales justos');
  });

  it('marca los tags seleccionados con checked y prefix ✓', () => {
    render(
      <TagsPicker
        selected={['claro explicando', 'parciales justos']}
        onToggle={() => {}}
        fieldId="tags"
      />,
    );
    const claro = screen.getByRole('checkbox', { name: /claro explicando/i });
    expect(claro).toBeChecked();
    // El label visible incluye "✓ " cuando el tag está on.
    expect(claro.closest('label')?.textContent).toContain('✓');
  });

  it('los tags no seleccionados no aparecen como checked', () => {
    render(<TagsPicker selected={['claro explicando']} onToggle={() => {}} fieldId="tags" />);
    expect(screen.getByRole('checkbox', { name: /responde tarde/i })).not.toBeChecked();
  });
});
