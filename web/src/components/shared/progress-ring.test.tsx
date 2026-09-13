import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from '@/components/shared/progress-ring';

describe('ProgressRing', () => {
  it('renders an accessible progress bar with the expected percent', () => {
    render(<ProgressRing value={42} size={64} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps values outside 0..100', () => {
    render(<ProgressRing value={250} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('shows the percentage label', () => {
    render(<ProgressRing value={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('can hide the label', () => {
    render(<ProgressRing value={75} showLabel={false} />);
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });
});