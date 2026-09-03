import type { ReactNode } from 'react';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStudio, stubChatHealth } from '../helpers/studio';

vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>();
  function FakeSplitter({
    children,
    className,
    onResizeEnd,
  }: {
    children?: ReactNode;
    className?: string;
    onResizeEnd?: (sizes: (number | undefined)[]) => void;
  }) {
    return (
      <div className={className}>
        <button
          type="button"
          aria-label="结束分栏拖动"
          onClick={() => onResizeEnd?.([10, 480, 500])}
        />
        <button
          type="button"
          aria-label="结束分栏拖动-无效"
          onClick={() => onResizeEnd?.([undefined, 480, 40])}
        />
        {children}
      </div>
    );
  }
  FakeSplitter.Panel = function Panel({ children }: { children?: ReactNode }) {
    return <div>{children}</div>;
  };
  return { ...antd, Splitter: FakeSplitter };
});

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  stubChatHealth();
});

describe('editor splitter resize', () => {
  it('clamps panel sizes and ignores a closed or undersized source pane', async () => {
    const user = userEvent.setup();
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '结束分栏拖动' }));
    await user.click(screen.getByRole('button', { name: '结束分栏拖动-无效' }));
    const source = document.querySelector('.source-pane') as HTMLElement;
    await user.click(
      [...source.querySelectorAll('button')].find(
        (button) => button.textContent === '收起',
      ) as HTMLButtonElement,
    );
    await user.click(screen.getByRole('button', { name: '结束分栏拖动' }));
  });
});
