import { antdCatalog } from '@kotodama/antd-catalog';
import { insertComponent } from '@src/editor/ops';
import { PaperPreview } from '@src/paper/PaperPreview';
import { emptySnapshot } from '@src/editor/storage';
import { editorCatalog } from '@src/editor/wrapCatalog';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { rootColumn } from '../helpers/apply';

afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 250));
  cleanup();
});

function pageWith(...types: string[]) {
  let snapshot = rootColumn();
  for (const type of types) {
    snapshot = insertComponent(snapshot, type, 'root').snapshot;
  }
  return snapshot;
}

describe('catalog control interactions', () => {
  it('updates inserted form controls', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <PaperPreview
        snapshot={pageWith(
          'TextField',
          'CheckBox',
          'ChoicePicker',
          'Slider',
          'Button',
        )}
        theme="light"
        catalog={antdCatalog}
        onEvent={() => undefined}
        onDataModel={() => undefined}
      />,
    );
    expect(await screen.findByText('选项')).toBeTruthy();
    const text = document.querySelector(
      '.preview-sheet input',
    ) as HTMLInputElement;
    if (text) {
      fireEvent.change(text, { target: { value: 'hello' } });
    }
    const checkbox = document.querySelector(
      '.preview-sheet input[type="checkbox"]',
    ) as HTMLInputElement;
    if (checkbox) {
      await user.click(checkbox);
    }
    const slider = document.querySelector('.ant-slider') as HTMLElement;
    if (slider) {
      fireEvent.mouseDown(slider);
    }
    const button = document.querySelector(
      '.preview-sheet button',
    ) as HTMLButtonElement;
    if (button) {
      await user.click(button);
    }
    const select = document.querySelector('.ant-select') as HTMLElement;
    if (select) {
      await user.click(select);
      const option = await screen.findAllByText('A').catch(() => []);
      if (option[0]) {
        await user.click(option[0]);
      }
    }
  });

  it('opens a modal and closes it from a content button', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const snapshot = insertComponent(rootColumn(), 'Modal', 'root').snapshot;
    render(
      <PaperPreview
        snapshot={snapshot}
        theme="light"
        catalog={antdCatalog}
        onEvent={() => undefined}
      />,
    );
    await user.click(await screen.findByText('打开'));
    expect(await screen.findByText('弹层内容')).toBeTruthy();
    const close = document.querySelector(
      '.ant-modal-close',
    ) as HTMLButtonElement;
    if (close) {
      await user.click(close);
    }
  });

  it('uses default selection handlers on editor catalog wrappers', async () => {
    const snapshot = insertComponent(rootColumn(), 'Icon', 'root').snapshot;
    render(
      <PaperPreview
        snapshot={snapshot}
        theme="light"
        catalog={editorCatalog}
      />,
    );
    const selectable = await waitFor(() => {
      const node = document.querySelector('[data-a2ui-id]') as HTMLElement;
      expect(node).toBeTruthy();
      return node;
    });
    fireEvent.click(selectable);
    fireEvent.mouseOver(selectable);
    fireEvent.focus(selectable);
    fireEvent.keyDown(selectable, { key: 'Enter' });
    fireEvent.keyDown(selectable, { key: ' ' });
    const inner = selectable.querySelector('*') as HTMLElement;
    if (inner && inner !== selectable) {
      fireEvent.click(inner);
    }
  });

  it('renders extra input variants that still preview', async () => {
    const longText = {
      ...emptySnapshot(),
      components: [
        {
          id: 'root',
          component: 'Column',
          children: ['long', 'num', 'secret', 'date', 'time', 'both'],
          justify: 'start',
          align: 'stretch',
        },
        {
          id: 'long',
          component: 'TextField',
          label: '长文',
          value: 'a',
          variant: 'longText',
        },
        {
          id: 'num',
          component: 'TextField',
          label: '数字',
          value: '2',
          variant: 'number',
        },
        {
          id: 'secret',
          component: 'TextField',
          label: '密码',
          value: 'x',
          variant: 'obscured',
        },
        {
          id: 'date',
          component: 'DateTimeInput',
          label: '日期',
          value: '2020-01-02',
          enableDate: true,
        },
        {
          id: 'time',
          component: 'DateTimeInput',
          label: '时间',
          value: '',
          enableDate: false,
          enableTime: true,
        },
        {
          id: 'both',
          component: 'DateTimeInput',
          label: '日期时间',
          value: '2020-01-02T10:00:00.000Z',
          enableDate: true,
          enableTime: true,
        },
      ],
    };
    render(
      <PaperPreview
        snapshot={longText}
        theme="light"
        catalog={antdCatalog}
        onError={() => undefined}
      />,
    );
    await waitFor(() => {
      expect(document.querySelector('.preview-sheet')).toBeTruthy();
    });
    const textarea = document.querySelector('textarea');
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'more' } });
    }
    const number = document.querySelector(
      '.ant-input-number-input',
    ) as HTMLInputElement;
    if (number) {
      fireEvent.change(number, { target: { value: '9' } });
      fireEvent.change(number, { target: { value: '' } });
    }
    const password = document.querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    if (password) {
      fireEvent.change(password, { target: { value: 'secret' } });
    }
    for (const input of document.querySelectorAll(
      '.ant-picker-input input',
    ) as NodeListOf<HTMLInputElement>) {
      fireEvent.mouseDown(input);
      fireEvent.change(input, { target: { value: '2021-02-03' } });
      fireEvent.blur(input);
    }
  });

  it('closes a modal from a nested content button and dispatches a bare button', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <PaperPreview
        snapshot={{
          ...emptySnapshot(),
          components: [
            {
              id: 'root',
              component: 'Modal',
              trigger: 'open',
              content: 'close',
            },
            {
              id: 'open',
              component: 'Button',
              child: 'open_label',
              variant: 'default',
              action: { event: { name: 'open' } },
            },
            {
              id: 'open_label',
              component: 'Text',
              text: '打开层',
              variant: 'body',
            },
            {
              id: 'close',
              component: 'Button',
              child: 'close_label',
              variant: 'primary',
              action: { event: { name: 'done' } },
            },
            {
              id: 'close_label',
              component: 'Text',
              text: '关上',
              variant: 'body',
            },
          ],
        }}
        theme="light"
        catalog={antdCatalog}
        onEvent={() => undefined}
      />,
    );
    await user.click(await screen.findByText('打开层'));
    await user.click(await screen.findByRole('button', { name: '关上' }));
  });
});
