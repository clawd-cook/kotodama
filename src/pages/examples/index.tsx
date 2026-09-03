import { antdCatalog } from '@kotodama/antd-catalog';
import { Button, Typography } from 'antd';
import { Link, Navigate, useParams } from 'react-router';
import { foldMessages } from '../../editor/snapshot';
import { JsonWell } from '../../paper/JsonWell';
import { PaperPreview } from '../../paper/PaperPreview';
import { useAdoptDraft } from '../workshop/adoptDraft';
import { EXAMPLES, EXAMPLE_ORDER, isExampleId } from './featured';
import { useStudioTheme } from '../../studio/Studio';

export function Examples() {
  const theme = useStudioTheme();
  return (
    <main className="examples-list" id="sheet">
      <h1 className="studio-title">精选案例</h1>
      <div className="examples-row">
        {EXAMPLE_ORDER.map((id) => {
          const card = EXAMPLES[id];
          const snapshot = foldMessages(card.messages);
          return (
            <Link
              key={id}
              className="example-paper"
              to={`/examples/${id}`}
            >
              <div className="example-thumb" aria-hidden>
                <PaperPreview
                  snapshot={snapshot}
                  theme={theme}
                  catalog={antdCatalog}
                />
              </div>
              <h2 className="example-card-title">{card.title}</h2>
              <Typography.Paragraph type="secondary">
                {card.blurb}
              </Typography.Paragraph>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export function ExampleDetail() {
  const theme = useStudioTheme();
  const { id = '' } = useParams();
  const adoptDraft = useAdoptDraft();

  if (!isExampleId(id)) {
    return <Navigate to="/examples" replace />;
  }

  const card = EXAMPLES[id];
  const messages = card.messages;
  const page = foldMessages(messages);
  const jsonText = `${JSON.stringify(messages, null, 2)}\n`;

  return (
    <main className="example-detail">
      <div className="example-detail-head">
        <h1 className="studio-title">{card.title}</h1>
        <Button type="primary" onClick={() => adoptDraft(messages)}>
          用这一页
        </Button>
      </div>
      <Typography.Paragraph type="secondary">{card.blurb}</Typography.Paragraph>
      <PaperPreview
        snapshot={page}
        theme={theme}
        catalog={antdCatalog}
        sheetId="sheet"
        onEvent={() => undefined}
        onDataModel={() => undefined}
      />
      <JsonWell text={jsonText} />
    </main>
  );
}
