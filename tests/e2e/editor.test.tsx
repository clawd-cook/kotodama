import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applyExamplePage,
  renderStudio,
  stubChatHealth,
} from '../helpers/studio';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  stubChatHealth();
});

describe('editor e2e', () => {
  it('loads an example into the workshop and inserts a Text node', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderStudio('/examples/login');
    await applyExamplePage(user);
    expect(await screen.findByText('账号')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: '组件' }));
    await user.click(screen.getByRole('button', { name: 'Text' }));
    await waitFor(() => {
      expect(screen.getByText(/Text\s+text-1/)).toBeTruthy();
    });
  });
});
