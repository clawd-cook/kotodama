import App from '@src/App';
import { ChannelProvider, useChannel } from '@src/studio/ChannelContext';
import {
  StudioSessionProvider,
  useStudioSession,
} from '@src/studio/StudioSession';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubChatHealth } from '../helpers/studio';

afterEach(() => {
  cleanup();
});

describe('App shell', () => {
  it('renders through BrowserRouter', async () => {
    stubChatHealth();
    render(<App />);
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
  });

  it('swallows a failed health fetch', async () => {
    stubChatHealth(false);
    render(<App />);
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
  });
});

describe('session and channel hooks', () => {
  it('throws outside providers', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function ChannelProbe() {
      useChannel();
      return null;
    }
    function SessionProbe() {
      useStudioSession();
      return null;
    }
    expect(() => render(<ChannelProbe />)).toThrow(
      'useChannel must be used within ChannelProvider',
    );
    expect(() => render(<SessionProbe />)).toThrow(
      'useStudioSession must be used within StudioSessionProvider',
    );
    spy.mockRestore();
  });

  it('stores and clears landing payloads', async () => {
    const user = userEvent.setup();
    function Probe() {
      const session = useStudioSession();
      return (
        <div>
          <pre data-testid="landing">{JSON.stringify(session.landing)}</pre>
          <pre data-testid="visited">{String(session.visitedWorkshop)}</pre>
          <button
            type="button"
            onClick={() => session.setLanding({ prefill: 'hi' })}
          >
            set
          </button>
          <button type="button" onClick={() => session.clearLanding()}>
            clear
          </button>
        </div>
      );
    }
    render(
      <StudioSessionProvider>
        <Probe />
      </StudioSessionProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'set' }));
    expect(screen.getByTestId('landing').textContent).toContain('prefill');
    expect(screen.getByTestId('visited').textContent).toBe('true');
    await user.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.getByTestId('landing').textContent).toBe('null');
  });

  it('exposes the channel context', async () => {
    stubChatHealth();
    function Probe() {
      const channel = useChannel();
      return <pre data-testid="ready">{String(channel.resolved.ready)}</pre>;
    }
    render(
      <ChannelProvider>
        <Probe />
      </ChannelProvider>,
    );
    expect(await screen.findByTestId('ready')).toBeTruthy();
  });
});
