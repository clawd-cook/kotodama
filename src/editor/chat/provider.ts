import { OpenAIChatProvider } from '@ant-design/x-sdk';
import type { XModelMessage, XModelParams } from '@ant-design/x-sdk';
import type { XRequestOptions } from '@ant-design/x-sdk';

export class EditorChatProvider extends OpenAIChatProvider {
  constructor(
    config: ConstructorParameters<typeof OpenAIChatProvider>[0],
    private getSystemPrompt: () => string,
  ) {
    super(config);
  }

  transformParams(
    requestParams: Partial<XModelParams>,
    options: XRequestOptions<XModelParams>,
  ): XModelParams {
    const params = super.transformParams(requestParams, options);
    const history = (params.messages ?? []).filter((item) => item.role !== 'system');
    return {
      ...params,
      messages: [{ role: 'system', content: this.getSystemPrompt() }, ...history],
    };
  }
}

export function textOf(content: XModelMessage['content'] | undefined): string {
  if (typeof content === 'string') {
    return content;
  }
  if (content && typeof content === 'object' && 'text' in content) {
    return String(content.text ?? '');
  }
  return '';
}
