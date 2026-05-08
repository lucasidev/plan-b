import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  function getFill(container: HTMLElement) {
    const fill = container.querySelector('i');
    if (!fill) throw new Error('expected fill element');
    return fill;
  }

  it('renderea el fill al porcentaje correcto (50%)', () => {
    const { container } = render(<ProgressBar value={8} max={16} />);
    expect(getFill(container).style.width).toBe('50%');
  });

  it('clampa a 100% cuando value > max', () => {
    const { container } = render(<ProgressBar value={20} max={16} />);
    expect(getFill(container).style.width).toBe('100%');
  });

  it('clampa a 0% cuando value es negativo', () => {
    const { container } = render(<ProgressBar value={-5} max={16} />);
    expect(getFill(container).style.width).toBe('0%');
  });

  it('renderea 0% sin crash cuando max=0 (caso defensivo)', () => {
    const { container } = render(<ProgressBar value={5} max={0} />);
    expect(getFill(container).style.width).toBe('0%');
  });

  it('aplica color neutral por default', () => {
    const { container } = render(<ProgressBar value={5} max={10} />);
    expect(getFill(container).className).toContain('bg-ink');
  });

  it('aplica color warm cuando tone="warm"', () => {
    const { container } = render(<ProgressBar value={5} max={10} tone="warm" />);
    expect(getFill(container).className).toContain('bg-accent');
  });
});
