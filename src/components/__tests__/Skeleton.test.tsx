/**
 * Skeleton Component Tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Skeleton, SkeletonCard, SkeletonStatCard } from '../Skeleton';

describe('Skeleton Component', () => {
  it('renders with default variant', () => {
    render(<Skeleton testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
    expect(skeleton).toHaveAccessibilityRole('progressbar');
    expect(skeleton).toHaveAccessibilityLabel('Loading content');
  });

  it('renders text variant', () => {
    render(<Skeleton variant="text" testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('renders title variant', () => {
    render(<Skeleton variant="title" testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('renders card variant', () => {
    render(<Skeleton variant="card" testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('renders circle variant', () => {
    render(<Skeleton variant="circle" testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('renders rectangle variant', () => {
    render(<Skeleton variant="rectangle" testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('applies custom width and height', () => {
    render(<Skeleton width={100} height={50} testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('can disable animation', () => {
    render(<Skeleton animate={false} testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeTruthy();
  });
});

describe('SkeletonCard Component', () => {
  it('renders skeleton card layout', () => {
    render(<SkeletonCard testID="skeleton-card" />);
    const skeletonCard = screen.getByTestId('skeleton-card');
    expect(skeletonCard).toBeTruthy();
  });

  it('applies custom className', () => {
    render(<SkeletonCard className="custom-class" testID="skeleton-card" />);
    const skeletonCard = screen.getByTestId('skeleton-card');
    expect(skeletonCard).toBeTruthy();
  });
});

describe('SkeletonStatCard Component', () => {
  it('renders skeleton stat card layout', () => {
    render(<SkeletonStatCard testID="skeleton-stat-card" />);
    const skeletonStatCard = screen.getByTestId('skeleton-stat-card');
    expect(skeletonStatCard).toBeTruthy();
  });

  it('applies custom className', () => {
    render(<SkeletonStatCard className="custom-class" testID="skeleton-stat-card" />);
    const skeletonStatCard = screen.getByTestId('skeleton-stat-card');
    expect(skeletonStatCard).toBeTruthy();
  });
});