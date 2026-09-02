import { applyDocument } from './applyDocument';
import { createDemoSnapshot } from './demo';

const catalogId =
  'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';
const result = applyDocument(
  JSON.stringify([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'main',
        catalogId,
        sendDataModel: true,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'main',
        components: [
          { id: 'root', component: 'Column', children: ['row_modal'] },
          {
            id: 'row_modal',
            component: 'Modal',
            children: ['open_btn', 'modal_body'],
          },
          {
            id: 'open_btn',
            component: 'Button',
            children: ['btn_label'],
            variant: 'default',
          },
          { id: 'btn_label', component: 'Text', text: '查看序号' },
          {
            id: 'modal_body',
            component: 'Text',
            text: { path: '/rowIndex' },
            variant: 'body',
          },
        ],
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'main',
        path: '/',
        value: { rowIndex: '1' },
      },
    },
  ]),
  createDemoSnapshot(),
);

if (!result.ok) {
  console.error(result);
  process.exit(1);
}
const modal = result.snapshot.components.find((item) => item.id === 'row_modal');
const button = result.snapshot.components.find((item) => item.id === 'open_btn');
if (
  modal?.trigger !== 'open_btn' ||
  modal?.content !== 'modal_body' ||
  modal?.children !== undefined ||
  button?.child !== 'btn_label'
) {
  console.error({ modal, button });
  process.exit(1);
}
console.log('ok');
