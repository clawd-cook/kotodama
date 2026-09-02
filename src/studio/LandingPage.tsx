import { Prompts, Sender } from '@ant-design/x';
import { Typography } from 'antd';
import { useNavigate } from 'react-router';
import { PROMPT_ITEMS, landingSubmit } from './landingSubmit';
import { useChannel } from './ChannelContext';
import { useStudioSession } from './StudioSession';

export function LandingPage() {
  const navigate = useNavigate();
  const { resolved } = useChannel();
  const { markVisitedWorkshop } = useStudioSession();

  const submit = (text: string) => {
    const content = text.trim();
    if (!content) {
      return;
    }
    markVisitedWorkshop();
    navigate('/', {
      replace: true,
      state: landingSubmit(content, resolved.ready),
    });
  };

  return (
    <main className="landing-desk">
      <div className="landing-copy">
        <h1 className="landing-title">从这里说出一页</h1>
        <Typography.Paragraph type="secondary" className="landing-desc">
          说完后进工坊。中间会换成一页，可以留下、再打开。
        </Typography.Paragraph>
        <div id="prompt">
          <Sender
            className="landing-sender"
            placeholder="描述你想要的界面…"
            onSubmit={submit}
          />
        </div>
        <div className="landing-prompts">
          <Typography.Text type="secondary" className="chat-prompts-label">
            可以说
          </Typography.Text>
          <Prompts
            className="chat-prompts"
            items={PROMPT_ITEMS}
            vertical
            onItemClick={(info) => submit(String(info.data.label ?? ''))}
          />
        </div>
      </div>
    </main>
  );
}
