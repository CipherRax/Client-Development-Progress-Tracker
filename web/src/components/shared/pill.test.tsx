import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pill } from '@/components/shared/pill';
import { PROJECT_STATUS_META } from '@/lib/presentation';

describe('Pill', () => {
  it('renders a color + icon + label status pill', () => {
    const { container } = render(<Pill meta={PROJECT_STATUS_META.IN_PROGRESS} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('In Progress').closest('span')).toHaveClass(
      'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    );
  });
});