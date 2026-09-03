import App from '@src/App';
import { useSpeech } from '@src/editor/chat/speech';
import { ChannelProvider, useChannel } from '@src/studio/ChannelContext';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubChatHealth } from '../helpers/studio';

afterEach(() => {
  cleanup();
});

describe('App shell', () => {
  it('renders the 工坊', async () => {
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

describe('channel and speech hooks', () => {
  it('throws outside providers', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function ChannelProbe() {
      useChannel();
      return null;
    }
    function SpeechProbe() {
      useSpeech();
      return null;
    }
    expect(() => render(<ChannelProbe />)).toThrow(
      'useChannel must be used within ChannelProvider',
    );
    expect(() => render(<SpeechProbe />)).toThrow(
      'useSpeech must be used within SpeechProvider',
    );
    spy.mockRestore();
  });

  it('maps health env into the channel context', async () => {
    stubChatHealth({
      baseUrl: 'https://env.example',
      model: 'env-model',
      hasApiKey: true,
    });
    function Probe() {
      const channel = useChannel();
      return (
        <pre data-testid="env">
          {channel.env.baseUrl}:{channel.env.model}:{channel.env.apiKey}
        </pre>
      );
    }
    render(
      <ChannelProvider>
        <Probe />
      </ChannelProvider>,
    );
    expect(await screen.findByText('https://env.example:env-model:set')).toBeTruthy();
  });

  it('defaults missing health env fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true, env: {} }), { status: 200 })),
    );
    function Probe() {
      const channel = useChannel();
      return (
        <pre data-testid="env-empty">
          {channel.env.baseUrl}|{channel.env.model}|{channel.env.apiKey}
        </pre>
      );
    }
    render(
      <ChannelProvider>
        <Probe />
      </ChannelProvider>,
    );
    expect(await screen.findByText('||')).toBeTruthy();
  });
});
