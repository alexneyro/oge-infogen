import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionBanner, formatBannerTime } from '../SessionBanner';

describe('formatBannerTime', () => {
  it('formats time (< 1 hour) as MM:SS', () => {
    expect(formatBannerTime(0)).toBe('00:00');
    expect(formatBannerTime(5)).toBe('00:05');
    expect(formatBannerTime(45)).toBe('00:45');
    expect(formatBannerTime(60)).toBe('01:00');
    expect(formatBannerTime(65)).toBe('01:05');
    expect(formatBannerTime(90)).toBe('01:30');
    expect(formatBannerTime(125)).toBe('02:05');
    expect(formatBannerTime(3540)).toBe('59:00');
    expect(formatBannerTime(3599)).toBe('59:59');
  });

  it('formats time (>= 1 hour) as H:MM:SS', () => {
    expect(formatBannerTime(3600)).toBe('1:00:00');
    expect(formatBannerTime(3665)).toBe('1:01:05');
    expect(formatBannerTime(3725)).toBe('1:02:05');
    expect(formatBannerTime(7325)).toBe('2:02:05');
    expect(formatBannerTime(9000)).toBe('2:30:00');
  });
});

describe('SessionBanner Component', () => {
  it('renders title and badges in banner when provided', () => {
    render(
      <SessionBanner
        title="ВАРИАНТ OGE-TEST1"
        badges={<span data-testid="badge-count">16 заданий</span>}
        timerMode="countdown"
        seconds={150}
        isPaused={false}
      />
    );

    expect(screen.getByText('ВАРИАНТ OGE-TEST1')).toBeTruthy();
    expect(screen.getByTestId('badge-count')).toBeTruthy();
    expect(screen.getByText('02:30')).toBeTruthy();
  });

  it('renders without title and badges when title is omitted', () => {
    const { container } = render(
      <SessionBanner
        timerMode="countdown"
        seconds={150}
        isPaused={false}
        finishLabel="Завершить"
        onFinish={() => {}}
      />
    );

    expect(screen.queryByText('ВАРИАНТ')).toBeNull();
    expect(screen.getByText('02:30')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Завершить/i })).toBeTruthy();
    const banner = container.querySelector('#session-banner');
    expect(banner?.className).toContain('w-full');
    expect(banner?.className).toContain('sm:w-fit');
    expect(banner?.className).toContain('sm:ml-auto');
  });

  it('renders pause/play toggle and handles clicks', () => {
    const onTogglePause = vi.fn();
    const { rerender } = render(
      <SessionBanner
        title="ВАРИАНТ OGE-TEST1"
        timerMode="countdown"
        seconds={150}
        isPaused={false}
        onTogglePause={onTogglePause}
      />
    );

    const pauseBtn = screen.getByTitle('Пауза');
    fireEvent.click(pauseBtn);
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    rerender(
      <SessionBanner
        title="ВАРИАНТ OGE-TEST1"
        timerMode="countdown"
        seconds={150}
        isPaused={true}
        onTogglePause={onTogglePause}
      />
    );
    expect(screen.getByTitle('Продолжить')).toBeTruthy();
  });

  it('does not render pause button when onTogglePause is not provided', () => {
    render(
      <SessionBanner
        title="ВАРИАНТ OGE-TEST1"
        timerMode="countdown"
        seconds={150}
        isPaused={false}
      />
    );

    expect(screen.queryByTitle('Пауза')).toBeNull();
    expect(screen.queryByTitle('Продолжить')).toBeNull();
  });

  it('renders finish button and respects finishDisabled', () => {
    const onFinish = vi.fn();
    const { rerender } = render(
      <SessionBanner
        title="ВАРИАНТ OGE-TEST1"
        timerMode="countdown"
        seconds={150}
        isPaused={false}
        onFinish={onFinish}
        finishLabel="Завершить"
        finishDisabled={true}
      />
    );

    const finishBtn = screen.getByRole('button', { name: /Завершить/i }) as HTMLButtonElement;
    expect(finishBtn.disabled).toBe(true);
    fireEvent.click(finishBtn);
    expect(onFinish).not.toHaveBeenCalled();

    rerender(
      <SessionBanner
        title="ВАРИАНТ OGE-TEST1"
        timerMode="countdown"
        seconds={150}
        isPaused={false}
        onFinish={onFinish}
        finishLabel="Завершить"
        finishDisabled={false}
      />
    );
    const enabledFinishBtn = screen.getByRole('button', { name: /Завершить/i }) as HTMLButtonElement;
    expect(enabledFinishBtn.disabled).toBe(false);
    fireEvent.click(enabledFinishBtn);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('has max height 56px (h-14 / max-h-14)', () => {
    const { container } = render(
      <SessionBanner
        title="ВАРИАНТ OGE-TEST1"
        timerMode="countdown"
        seconds={9000}
        isPaused={false}
      />
    );

    const banner = container.querySelector('#session-banner');
    expect(banner?.className).toContain('h-14');
    expect(banner?.className).toContain('max-h-14');
  });

  it('respects custom lowTimeThreshold prop for warning style in countdown mode', () => {
    const { container: c1 } = render(
      <SessionBanner
        title="TEST"
        timerMode="countdown"
        seconds={120}
        isPaused={false}
        lowTimeThreshold={120}
      />
    );
    expect(c1.innerHTML).toContain('animate-pulse');

    const { container: c2 } = render(
      <SessionBanner
        title="TEST"
        timerMode="countdown"
        seconds={121}
        isPaused={false}
        lowTimeThreshold={120}
      />
    );
    expect(c2.innerHTML).not.toContain('animate-pulse');
  });
});
