# 言灵 TRD

**产品：** 言灵（kotodama）  
**对应需求：** [PRD](./PRD.md) · [Design](./Design.md)  
**文档版本：** v1.0.1  
**读者：** 实现工作室外壳、图鉴、案例装入和通道覆盖的工程师；工坊闸门按本文「已有」契约回归，不要改白名单

相对 v1.0.0：工坊写入闸门、信封对话、文件往返已经在仓库里。v1.0.1 不改协议、不扩目录、不换渲染器。要补的是屋子：路由、落地页自动发送、18 份图鉴夹具、三个案例装入、设置页对 `.env` 的覆盖。

打开产品时，无可用当前稿则落到「开始创建」落地页；有通过校验的当前稿则进工坊。落地页提交后进入工坊并自动发送。图鉴和案例只展示同一套 A2UI 消息数组。设置里的通道只存在浏览器本地，不进 `Snapshot`、不进下载文件。

---

## Boundaries

### In scope

- A2UI v0.9 消息数组作为源文件。目录版本仍是 [Catalog v1.0.0](#catalog-v100)。
- `@kotodama/antd-catalog` 用 Ant Design 绘制 A2UI 基础目录。工坊、图鉴、案例共用这一份渲染器。
- 整份替换写入 `Snapshot`。写入入口仍是 `applyDocument`（对话、底部 JSON、打开文件、**用这一页**）。
- 浏览器 `localStorage` 草稿，以及 JSON 文件下载 / 打开。
- 预览可改本地 `dataModel`、记录 `action`；不把动作送回模型。
- 工作室四个房间的可刷新地址：开始创建、基础组件、精选案例、设置。
- 图鉴 18 份最小合法文档；精选案例复用现有黄金夹具。
- 对话通道：界面三项覆盖进程 `.env`；本地代理按请求合并后再转发。

### Out of scope

PRD 第 8 节列出的后续项均不在本 TRD 实现范围内，包括：目录 v2、增量补丁、流式上画、动作回传模型、真实接口、多 surface、文档柜、云同步、发布上线、卡片市场、渲染器切换、图鉴移动端 / PC 切换、设置页「测试连接」。

外壳路由不是应用多页：产品仍然是「一页一份 JSON」。`/catalog` 和 `/settings` 是工作室房间，不是生成页里的路由。

### Runtime the editor already uses

| Piece | Location | Role |
| --- | --- | --- |
| Editor state | `src/editor/EditorState.tsx` | `Snapshot`、撤销栈、`applyJson` / `openJson` / `reset` |
| Write gate | `src/editor/applyDocument.ts` | parse → fold → `validateSnapshot` |
| Fold / serialize | `src/editor/snapshot.ts` | `foldMessages`、`toMessages`、`SURFACE_ID` |
| Preview | `src/editor/Preview.tsx` | `MessageProcessor` + `A2uiSurface`；纸页内层默认 seed |
| Catalog | `packages/antd-catalog` | Ant Design 实现；`BASIC_CATALOG_ID` |
| Chat | `src/editor/chat/` | 信封解析、`presentAssistant`、成功后走闸门 |
| Chat proxy | `server/chat-proxy.ts`、`rsbuild.config.ts` | `/api/chat/health`；`/api/chat/completions` 目前只认进程 `.env` |
| Draft / chrome | `src/editor/storage.ts` | `kotodama.draft`、`kotodama.theme`、`kotodama.chrome` |
| Golden fixtures | `src/editor/fixtures/` | `login.json`、`settings.json`、`filtered-list.json` |

v1.0.1 不更换模型供应商，不换 OpenAI 兼容协议。缺口是：静态 `server.proxy` 的 `target` 和 `Authorization` 在启动时写死，界面里的 Base URL / Key **无法**覆盖。见 [Channel](#channel)。

---

## Document model

源文件是 A2UI v0.9 **消息数组**，不是 React 树，也不是 antd 组件配置。v1.0.1 不改这个模型。

运行时真相是 `Snapshot`（`src/editor/types.ts`）：

```ts
type Snapshot = {
  surfaceId: string;
  catalogId: string;
  sendDataModel: boolean;
  components: A2uiComponent[];
  dataModel: unknown;
};
```

序列化必须走已有的 `toMessages(snapshot)`，得到三条消息，顺序固定：

1. `createSurface`
2. `updateComponents`（扁平邻接表；有页面时含 `id: "root"`）
3. `updateDataModel`（`path: "/"`，值为整个 `dataModel`）

每条消息的 `version` 为 `"v0.9"`。`surfaceId` 为 `main`（`SURFACE_ID`）。`catalogId` 为：

```text
https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json
```

该 URL 来自 `@kotodama/antd-catalog` 的 `BASIC_CATALOG_ID`。源文件、底部 JSON 编辑器、下载文件、图鉴 JSON、案例 JSON 都使用这个消息数组。对话信封（`summary` + `messages`）只出现在模型输出里，不写入文件。通道配置不是文档的一部分。

产品目录版本 **1.0.0** 等于下面三者同时成立，不另写文件头字段：

- 协议：A2UI v0.9
- `catalogId`：`BASIC_CATALOG_ID`
- 组件名白名单：见 [Catalog v1.0.0](#catalog-v100)

v1.0.1 运行时继续拒绝白名单之外的组件名。以后扩展组件时必须升目录版本（新产品版本或新 `catalogId`）。

`deleteSurface` 不出现在 `toMessages` 输出中。写入路径若解析到 `deleteSurface`，校验失败。

### Empty page

工坊允许一份 **空稿**：`components: []`，`dataModel: {}`，`surfaceId` / `catalogId` 仍为约定值。空稿不是合法源文件：`validateSnapshot` 对它失败（`Non-empty`）。它只由「无草稿的首次打开」和顶栏「新建」写入，不经过 `applyDocument`。

| 状态 | 预览 | 下载 | 刷新「开始创建」 |
| --- | --- | --- | --- |
| 空稿 | `Empty`：**没有可预览的页面**。不要为此 `logError` | **下载** 不可用（没有可带走的合法源文件） | 落地页 |
| 通过 `validateSnapshot` 的稿 | 纸页 | 下载 `toMessages(snapshot)` | 工坊 |

`createDemoSnapshot()` 只留给测试（例如 C-01「任务管理」）。它不再是首次打开或「新建」的默认页。

`loadDraft()`：没有 key 或解析失败时，返回空稿，不要回退成 demo。读到的对象若通不过 `validateSnapshot`，也当成空稿（非法草稿本来就不能当当前页；随后的 `saveDraft` 可以覆盖该 key）。已通过校验的旧草稿（包括用户以前生成的页）照常恢复。

判断「已有当前页」用 `validateSnapshot(snapshot, toMessages(snapshot)) === null`，不要只看 `localStorage` 里有没有 key。

---

## Write pipeline

所有会盖掉工坊纸页的入口共用 `applyDocument`（对话、底部 JSON、打开文件、「用这一页」）。图鉴浏览、复制 JSON、设置保存 **不得** 调用它。

```text
text
  → JSON.parse
  → 解析对话信封或裸消息数组（仅对话入口需要拆 summary）
  → foldMessages
  → validateSnapshot
  → commit(snapshot)   // 写入撤销栈
```

任一步失败：

- 不调用 `commit`。
- 当前 `Snapshot`、预览、自动草稿保持失败前的值。
- 返回结构化错误（至少 `code` + 人话 `message`）。
- `source` 按入口记为 `json`、`chat` 或 `protocol`。「用这一页」失败记 `json`。

不要在流式过程中调用该管道。只在助手消息 `status === 'success'`、用户完成编辑 / 选中文件、或确认「换上」之后执行。

手改 JSON 仍可在输入过程中显示解析错误，但只有 `validateSnapshot` 通过后才能成为当前预览。未通过校验的编辑缓冲可以留在底部编辑器里，不要当成草稿真相。

v1.0.1 不要改 `validateSnapshot` 的规则表，也不要恢复 `ensureRootId` 自动改名。

---

## Catalog v1.0.0

### Allowed component names

与 `src/editor/validate.ts` 的 `ALLOWED_COMPONENTS` 以及 `src/editor/chat/prompt.ts` 中的列表一致：

`Column`、`Row`、`List`、`Card`、`Tabs`、`Modal`、`Divider`、`Text`、`Image`、`Icon`、`Video`、`AudioPlayer`、`Button`、`TextField`、`CheckBox`、`ChoicePicker`、`Slider`、`DateTimeInput`

渲染实现已在 `packages/antd-catalog/src/catalog.ts` 注册上述组件。v1.0.1 **不新增** 组件。图鉴索引不得出现白名单之外的名字。

分组只用于图鉴导航，不改变校验：

| 组 | 组件 |
| --- | --- |
| 布局 | `Column`、`Row`、`List`、`Card`、`Tabs`、`Modal` |
| 内容 | `Text`、`Image`、`Icon`、`Video`、`AudioPlayer`、`Divider` |
| 输入 | `Button`、`TextField`、`CheckBox`、`ChoicePicker`、`Slider`、`DateTimeInput` |

### Property source of truth

每个组件的允许属性以 `@a2ui/web_core/v0_9/basic_catalog` 里对应 `*Api.schema` 为准（这些 schema 是 `.strict()` 的）。校验必须使用 **strict schema**，不能使用渲染侧经过 `antdApi()` 的 `.passthrough()` 副本。

图鉴属性表的 **属性名** 也来自这份 strict schema，不要编造 antd / HTML 属性（例如 `placeholder`、`className`）。一句中文说明是文案表，不是 schema 的一部分；缺说明可以留空，不能多一行不存在的字段。

`packages/antd-catalog/src/api.ts` 的 `passthrough()` 只影响运行时是否忽略多余字段。写入闸门必须拒绝多余字段。

组件对象上的 `id` 和 `component` 不属于 `*Api.schema`。校验单独要求：

- `id`：非空字符串，文档内唯一。
- `component`：落在白名单中。
- 其余字段：交给对应 `*Api.schema` 做 `.strict()` 解析。

子节点只能是 id 引用：

- `children`：字符串 id 数组，或 A2UI 目录允许的 `{ componentId, path }` 模板。禁止内联组件对象。
- `child`、`trigger`、`content`：字符串 id。
- `tabs[].child`：字符串 id。

引用的 id 必须在同一 `Snapshot.components` 中存在。

### Renderer

预览继续用 `MessageProcessor` + `A2uiSurface`。把「纸页预览」抽成可复用组件（名称自定，例如 `PaperPreview`）：

| 调用方 | 目录包装 | 选中 / 悬停 | 数据绑定 / 事件 |
| --- | --- | --- | --- |
| 工坊 | `editorCatalog`（`src/editor/wrapCatalog.tsx`） | 要 | 与今天相同：写本地 `dataModel`，`logEvent` |
| 图鉴 | `antdCatalog`，不要 `editorCatalog` | 不要 | 不要求可试填；不要 `syncDataModelFromPreview` 写进工坊稿 |
| 案例列表缩略 | `antdCatalog` | 不要 | 不可试填；高度裁切由 CSS 处理 |
| 案例详情 | `antdCatalog` | 不要 | 可试填、可记事件；事件留在案例页本地，不进工坊 `events` |

纸页内层再包一层 `ConfigProvider`，只传 Ant Design 默认算法和 `defaultSeed`，把工作室 `colorPrimary` 隔开。工坊、图鉴、案例走同一层，不要第三套主题。

同一份通过校验的 `Snapshot`，在同一目录版本下必须画出同一棵组件树。不要按模型输出的 antd 组件名去动态 `import` 组件。

写入闸门拒绝多个 `surfaceId`。预览不应再收到多 surface 快照。

---

## Validation

`validateSnapshot(snapshot, messages)` 已存在（`src/editor/validate.ts`）。`foldMessages` 只负责把消息折叠成快照，不再修复协议错误。v1.0.1 保持该分工。

### Document checks

| Rule | Fail if |
| --- | --- |
| Message version | 任一条消息缺少 `version: "v0.9"` |
| Surface count | 出现多个不同的 `surfaceId`，或出现 `deleteSurface` |
| `surfaceId` | 不是 `main` |
| `catalogId` | 不是 `BASIC_CATALOG_ID` |
| Root | 不存在 `id === "root"` 的组件 |
| Unique ids | 两个组件共用一个 `id` |
| Dangling refs | `child` / `children` / `trigger` / `content` / `tabs[].child` 指向不存在的 id |
| Non-empty | `components.length === 0` |

缺少 `root` 就是校验失败，不要自动改名。

### Component checks

| Rule | Fail if |
| --- | --- |
| Name | `component` 不在白名单（包括 `Table`、`Form`、`Menu` 等 antd 名） |
| Props | `*Api.schema` strict 解析失败 |
| Inline tree | `children` 里出现组件对象而不是 id |

错误信息必须能直接展示给用户，例如：「组件 `login_btn` 使用了未允许的属性 `placeholder`」。

校验失败时，底部 Errors 面板仍记录条目（沿用 `EditorError`）。对话入口把同一句话写进气泡。案例装入失败用 `message.error` 或错误条展示同一句人话，工坊稿不动。

---

## Studio shell

`src/App.tsx` 今天直接挂 `EditorApp`。v1.0.1 在外面加一层工作室壳。`EditorProvider` 包住整间屋子，这样切到图鉴 / 设置时工坊稿还在。

依赖：增加 `react-router`。使用 `BrowserRouter`。Rsbuild 保持默认 `htmlFallback: 'index'`，刷新深层路径仍回到 SPA。

### Routes

| Path | 房间 | 主区 |
| --- | --- | --- |
| `/` | 开始创建 | 落地页 **或** 工坊，见下方判定 |
| `/catalog` | 基础组件 | 重定向到 `/catalog/Column` |
| `/catalog/:component` | 基础组件 | 图鉴详情。`:component` 必须是白名单协议名 |
| `/examples` | 精选案例 | 三张纸列表 |
| `/examples/:id` | 精选案例 | 详情。`:id` 为 `login` / `settings` / `filtered-list` |
| `/settings` | 设置 | 三项通道 |

未知 `:component`：重定向到 `/catalog/Column`。未知 `:id`：重定向到 `/examples`。其他路径：重定向到 `/`。

左轨 `Menu` 的 `key` 对应房间，不对应落地页 / 工坊这一层。工坊打开时「开始创建」保持选中。字标链到 `/`，走与左轨「开始创建」相同的判定。

顶栏 **打开 / 下载 / 撤销 / 重做 / 新建** 只在工坊可见时渲染。深色 `Switch` 始终在。

### Create room: landing vs workshop

`/` 是同一个房间的两屏，不要做成 `/workshop` 第二条产品路由。

**刷新或首次进入 `/`：**

1. 当前 `Snapshot` 能通过 `validateSnapshot` → 工坊。
2. 否则 → 落地页。

**会话内从基础组件 / 精选案例 / 设置点「开始创建」或字标：**

1. 本会话已经进过工坊（落地页提交过，或「用这一页」成功过），或当前稿能通过校验 → 工坊。
2. 否则 → 落地页。

「已经进过工坊」是会话内存，不写 `localStorage`。刷新后只认当前稿是否可校验。

已在工坊时，再点「开始创建」留在工坊，不要退回落地页。

顶栏「新建」：`commit` 空稿、递增对话 `resetCount`、**留在工坊**。不要退回落地页。二次确认文案仍是 Design 的「新建这一页？…」。

### Landing submit

落地页与工坊空状态共用 `PROMPT_ITEMS`（做一个登录表单 / 做一个设置页 / 做一个带筛选的列表）和同一套 `Sender`。

提交（回车、发送、点提示）后：

1. 进入工坊（`/` 切到工坊屏，标记本会话已进工坊）。
2. 把这句话交给说话栏。

通道已配齐：立刻 `onRequest`，等同工坊里按发送。不要停在空输入里等人再点一次。进行中文案仍是 **正在写下这一页…**。纸页在校验通过前保持 Empty，不闪半份 JSON。

通道没配齐：仍进入工坊，把这句话预填进 `Sender`，显示通道 `Alert`，**不要** 调用 `/api/chat/completions`。不要在落地页另做诊断卡。

自动发送用 router `location.state`（例如 `{ autoSend: string }` 或 `{ prefill: string }`），提交后立刻 `replace` 清掉 state，避免刷新重复发送。不要把这句话写进 URL query。

### Layout ownership

| 区 | 谁渲染 |
| --- | --- |
| 顶栏、左轨 | 工作室壳，四个房间都在 |
| 笔记本、纸页、属性抽屉、排字抽屉 | 只在工坊屏。沿用 `EditorShell`，嵌在左轨右侧 |
| 图鉴索引列 | 图鉴房间，宽度 200px，不要写进左轨 |

跳过链目标随房间变：落地页 `#prompt`，工坊 / 图鉴 / 案例详情 `#sheet`，设置 `#channel-form`。

---

## Catalog gallery

只读。浏览、复制都不得 `commit` 工坊 `Snapshot`。

每个组件一份最小合法文档，作为仓库夹具（建议 `src/studio/catalog/fixtures/<Name>.json`）。内容必须是 `createSurface` + `updateComponents` + `updateDataModel`。每份都能 `applyDocument` 成功，且文档里出现的组件名 ⊆ `ALLOWED_COMPONENTS`。夹具不是当前稿。

详情四块，不要 Tab：

1. 协议名 + Design 里的一句中文（文案表，不要写进组件实现）。
2. `PaperPreview`，同一套纸页规格，无移动端 / PC 切换。
3. 该夹具源文件。可复制；成功 `message.success`：**已复制 JSON。**
4. 属性表：两列，属性名来自对应 `*Api.schema`。

默认路由 `/catalog/Column`。没有搜索、没有「插入当前页」。

图鉴预览不要挂 `SelectionProvider`，不要把选中描边写进夹具。

---

## Examples

第一批三个案例与 KR1 黄金任务同一份真源，不要再抄一份额外 JSON：

| `:id` | 文件 | 必须能看出 |
| --- | --- | --- |
| `login` | `src/editor/fixtures/login.json` | `TextField` 含 `obscured`、主按钮、绑定数据 |
| `settings` | `src/editor/fixtures/settings.json` | 多项输入 + `Column` / `Card` 分组 |
| `filtered-list` | `src/editor/fixtures/filtered-list.json` | `ChoicePicker`（或等价筛选）+ `List` |

`login-otp.json` 仍是「再改一版」测试夹具，不进精选案例列表。

**用这一页：**

1. 若当前稿能通过校验，先确认：**换上这一页？当前页会被盖掉。** 确认「换上」，取消「留下」。空稿不必确认。
2. 对案例文件文本调用 `applyDocument`。成功则 `commit`，递增对话 `resetCount`（新稿，避免旧聊天改到装入的页上），标记已进工坊，导航到 `/` 工坊屏。
3. 失败则不 `commit`，工坊稿与对话都不动，并用 `message.error` 或错误条说明原因。夹具本身必须能通过；失败只应出现在回归。

装入后的纸页必须与该夹具 `foldMessages` 结果一致（按 id 的组件与 `dataModel`）。

---

## Channel

可配三项，与现有环境变量同名含义：

| 项 | 对应 |
| --- | --- |
| Base URL | `OPENAI_BASE_URL` |
| API Key | `OPENAI_API_KEY` |
| 模型名 | `OPENAI_MODEL` |

### Resolve

抽出纯函数（名称自定，例如 `resolveChannel(ui, env)`），测试只认这个合并结果：

```ts
type ChannelFields = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

type ResolvedChannel = ChannelFields & { ready: boolean };
```

规则：

- 界面某项 trim 后非空 → 用界面这项。
- 界面这项为空 → 用 `env` 对应项。
- 三项都空 → 与 v1.0.0 相同，只认 `.env`。
- 界面有值但缺某一项时，缺的那一项仍从 `.env` 补。
- `ready === true` 当且仅当合并后三项都非空。

空字符串、只含空白，都当空。

设置页三项分开标注 **当前用界面** / **当前用环境变量**。来源按项计算，不要只在页脚写一句。`env` 是否有 Key 只暴露布尔值，见 health。

`ready === false` 时：工坊（含落地页进来之后）输入上方 `Alert` warning：**通道没配好。去设置里填 Base URL、API Key 和模型名。** 发送按钮 `disabled`，原因保持可见。不要静默失败成空白。

### Storage

- `localStorage` key：`kotodama.channel:v1`。
- 值是 `{ baseUrl, apiKey, model }` 三个字符串。不要存进 `Snapshot`，不要进 `toMessages`，不要进仓库。
- 保存后立刻对后续对话生效，不需要重启 `rsbuild` 进程。
- 保存后再打开，Key 仍是密码框掩码。内存里可以持有明文以便发送；不要把明文写进 DOM value 的回看（用 `Input.Password`）。
- 三项都清空并保存：删除或写入空对象，下次 `resolveChannel` 只认 `.env`。

下载当前页时，文件文本不得包含已保存的 API Key 字符串，也不得出现 `OPENAI_API_KEY` 这个键。

### Proxy

今天的实现不能完成覆盖：

- `rsbuild.config.ts` 仅在进程 `OPENAI_BASE_URL` 非空时注册 `server.proxy`，`target` 和 `Authorization` 启动时固定。
- `createChatProxy` 读完 body 后 `next()`，由该静态代理转发；并把 `payload.model` 写成进程模型。

v1.0.1 必须改成：**`/api/chat/completions` 由本地中间件自己 `fetch` 上游**，不要依赖写死的 `target`。没有 `.env`、只有界面配置时，对话仍能发出。

请求约定：

1. 浏览器 POST `/api/chat/completions`，body 仍是 OpenAI 兼容 chat 请求（`messages`、`stream` 等）。
2. 另带通道覆盖。推荐 body 字段 `kotodamaChannel?: { baseUrl?: string; apiKey?: string; model?: string }`，只含界面里的非空项。不要把该对象转发给上游。
3. 中间件：`resolved = resolveChannel(kotodamaChannel, env)`。`ready === false` 则 **503**，JSON `{ error: { message } }`，人话与设置页同一句通道未配。不要把半份请求送到任意主机。
4. 从发给上游的 JSON 里删除 `kotodamaChannel`。`Authorization: Bearer <resolved.apiKey>`。`model` 用 `resolved.model`。URL 为 `resolved.baseUrl` 去掉尾斜杠后拼接 `/v1/chat/completions`。
5. 把上游响应（含 `text/event-stream`）原样 pipe 回浏览器。超时仍按现有 300s 量级处理。

不要把界面 Key 写进 query。不要在 health 或错误 JSON 里回显 Key。

### Health

`GET /api/chat/health` 继续给设置页和说话栏算来源。不要返回 Key 明文。

```ts
type ChatHealth = {
  ok: true;
  env: {
    baseUrl: string;
    model: string;
    hasApiKey: boolean;
  };
};
```

`configured` 若仍保留，其含义改为「仅 `.env` 三项是否齐全」，不能表示界面覆盖后的 `ready`。说话栏以 `resolveChannel(loadChannel(), health.env)` 为准。

保存通道后不必刷新页面：后续 `useMemo` 依赖已保存的界面三项，下一句请求带上新的 `kotodamaChannel`。

---

## Chat apply

### Shipped behavior

- `EditorChatProvider` 每次请求把 `buildSystemPrompt(currentJson)` 插成唯一 system 消息。
- 模型输出优先解析 `{ summary, messages }`，否则退回裸数组 / 围栏 JSON；此时 `summary` 为 **已更新界面。**
- 展示层只把 `presentAssistant` 的结果交给 `Bubble.List`。成功是 `summary`；失败是「页面没改。{原因}。」；流式过程只显示 **正在写下这一页…**。
- 落地走 `applyDocument`。失败不 `commit`，`logError` 的 `source` 为 `'chat'`。
- 快捷提示三项与落地页相同。
- 「新建」递增 `resetCount` 并清空对话。

### v1.0.1 additions

- 落地页自动发送 / 预填，见 [Landing submit](#landing-submit)。
- `useXChat` 的 request 必须能带上当前 `kotodamaChannel`。通道变更后要换 provider 或 request 闭包，不要继续用旧 Key。
- `ready === false` 时不发请求。`requestFallback` 仍不修改快照。
- 「用这一页」成功后必须换新的 `conversationKey`（同一套 `resetCount`），不要让装入前的聊天继续当上下文去改新页。发给模型的当前页 JSON 以装入后的 `toMessages` 为准。

Prompt 白名单、信封、禁止 antd/HTML 属性：保持现状。v1.0.1 不要为图鉴去改模型可写的组件集合。

---

## Preview and actions

工坊预览保持：

- 输入组件通过数据绑定写本地 `dataModel`。该同步 **不** 走 `commit`，填表不进入撤销栈。
- `MessageProcessor` 的 action 回调只调用 `logEvent`。不要把 payload 再发给 `/api/chat/completions`。
- JSON 里允许保留 `action`。v1.0.1 只记录，不执行网络请求。

组件树点击选中、悬停描边是工坊包装，不属于源文件。下载的 JSON 不得包含 `className` 或 `data-a2ui-id`。

图鉴预览不得写入工坊 `dataModel` / `events`。案例详情的试填若需要本地 `dataModel`，用案例页自己的 state，确认「换上」之前不要 `commit`。

---

## Persistence

| Key | 谁读写 | 内容 |
| --- | --- | --- |
| `kotodama.draft` | 工坊 | 当前 `Snapshot`。空稿也保存，以便刷新知道没有可校验页 |
| `kotodama.theme` | 屋子 | `light` / `dark` |
| `kotodama.chrome` | 工坊 | 笔记本宽度、排字抽屉是否展开、展开高度。不要存左轨宽度或落地页滚动位置 |
| `kotodama.channel:v1` | 设置 | 界面三项。与草稿分开 |

写入闸门失败时不得把坏快照写进 `kotodama.draft`（只在 `snapshot` 变化时保存，只要不 `commit` 就不会保存坏稿）。

**下载 / 打开** 仍在工坊顶栏，行为与 v1.0.0 相同：下载已通过校验的 `toMessages`；打开走 `applyDocument`。打开成功覆盖当前稿并进入撤销栈。失败文案：**没有打开。{原因}。** 空稿时不提供下载。

KR3 的判定不变：对同一份通过校验的快照，下载 → 打开 之后组件与 `dataModel` 与打开前一致。增加一条：该文件里没有通道字段、没有 API Key。

---

## Escape hatches

组件树、属性面板、底部四栏（JSON / 数据 / 事件 / 错误）和撤销 / 重做只出现在工坊。图鉴、案例、设置不放逃生舱。

它们与对话、「用这一页」写入同一份 `Snapshot`，并共用 `validateSnapshot`。

| Entry | Behavior |
| --- | --- |
| 底部 JSON `applyJson` | `applyDocument`；失败不 `commit` |
| 属性面板 | 提交前同一套组件 schema；失败不 `commit` |
| 插入 / 复制 / 删除 | 结果仍须能通过 `validateSnapshot` |
| 撤销 / 重做 | 对话落地、打开文件、合法手改、「用这一页」都走 `commit` |
| 左侧默认 Tab | 「说话」。不要改成默认打开组件树 |

---

## Failure modes

| Symptom | Check | Next action |
| --- | --- | --- |
| 对话结束后画布没变，气泡出现错误句 | Errors 面板 `source: 'chat'`；是否未知组件、缺 `root`、多余属性 | 保留旧页；用户改口再发。不要手工把坏 JSON 贴进画布 |
| 底部 JSON 有红条，预览仍是旧页 | `jsonError` 或校验信息 | 修到通过校验才会 `commit` |
| 打开文件后页面与预期不符 | 文件是否为 `toMessages` 数组；`catalogId` / `surfaceId` 是否为约定值 | 校验失败则不应覆盖；成功则对比 `toMessages` |
| 预览空白「没有可预览的页面」 | 是否空稿；`source: 'preview'` 是否被空稿误记 | 空稿不应写 Errors；预览错误不得反过来清空已提交快照 |
| 发送按钮灰掉，上方警告通道 | `resolveChannel` 是否 `ready`；health `env` 与界面三项 | 去设置补齐；不要绕过 disabled 直接 `fetch` |
| 设置了界面 Base URL 仍打到旧主机 | 中间件是否自己 `fetch`；是否还在用启动时写死的 `server.proxy` target | 以请求内 `kotodamaChannel` 合并结果为准 |
| 气泡里出现完整 JSON | 展示层是否仍绑定模型原文 | 改为只渲染 `summary` 或错误句 |
| 点「用这一页」后纸页没变 | `applyDocument` 返回；夹具是否被改坏 | 工坊不动；夹具必须先能通过 F-01…F-03 |
| 浏览图鉴后工坊纸页变了 | 图鉴是否误调 `commit` / `applyJson` | 图鉴只读夹具；复制只走剪贴板 |
| 刷新落到落地页，稿不见了 | `loadDraft` 是否把合法草稿判失败，或空稿覆盖了 demo 判定 | 能通过校验的草稿必须进工坊 |
| 下载文件里出现 Key | `toMessages` / 下载 blob 是否串了 `kotodama.channel:v1` | 通道存储与源文件隔离 |

---

## Gap list

按 PRD 验收顺序排列。工坊闸门已在仓库中；下表是相对当前代码的差。不要借这些项去改白名单或 `validateSnapshot` 规则。

| Order | Gap | Current code | Required |
| --- | --- | --- | --- |
| 1 | 屋子与路由 | `App` 只挂 `EditorApp`；无左轨、无房间地址 | 四房间 `BrowserRouter`；刷新不丢房间；图鉴组件名与案例 id 进路径 |
| 2 | 落地页与空稿 | 首次打开 / `reset` 使用 `createDemoSnapshot()`；一进门就是工坊 | 无合法草稿 → 落地页；「新建」→ 空稿并留在工坊；提交后自动发送或预填 |
| 3 | 图鉴 18 | 无图鉴房间；组件名只在 prompt / `ALLOWED_COMPONENTS` | 每组件预览 + 能过闸门的 JSON + schema 属性表；浏览不改稿 |
| 4 | 精选案例装入 | 夹具已有，只给测试用 | 列表 / 详情预览；「用这一页」走 `applyDocument` + 新对话线程 |
| 5 | 通道覆盖 | 代理只认进程 `.env`；无界面存储 | `kotodama.channel:v1`；`resolveChannel`；中间件按请求 `fetch`；Key 不进 JSON |
| 6 | 回归 | 闸门、信封、往返测试已存在 | KR1～KR4 继续绿；坏 JSON 仍不能成为当前页 |

目录版本没有独立文件字段。用白名单 + `BASIC_CATALOG_ID` + 本 TRD 的 1.0.0 约定作为版本。不要在 v1.0.1 另造私有 JSON 头。

---

## Acceptance

v1.0.0 用例仍见 [TEST](./TEST.md)。v1.0.1 要在 TEST 补外壳、图鉴、案例、设置切片；未补之前，以本节为工程验收。能写成确定性测试的必须有测试；依赖模型与点击确认的标为人工。

系统边界才允许 mock：上游模型 HTTP。不要 mock `foldMessages` / `validateSnapshot`。图鉴夹具和黄金夹具是手写真源，不要用生成器再产出一份 expected。

### KR2 / KR3 / KR4 — 回归

现有 W / C / P / F 测试继续通过。额外：

- 对黄金夹具 `JSON.stringify(toMessages(snapshot))` 不得包含设置里保存的 API Key。
- 「用这一页」失败时，调用前后 `Snapshot` 引用或深比较相同。

### KR5 — 落地页一句话能进工坊

确定性：

- 无合法草稿时，`/` 的第一屏是落地页，不是 `EditorShell`。
- 提交后进入工坊屏，并把文案交给说话栏（自动发送或预填，由 `ready` 决定）。
- 三个提示文案与 `PROMPT_ITEMS` 相同。

人工：通道配齐时，点「做一个登录表单」后说话栏出现「正在写下这一页…」；通过校验则纸页更新。

### KR6 — 18 个基础组件都能在图鉴里看懂

对每个 `ALLOWED_COMPONENTS` 名称：

1. 存在对应夹具 JSON。
2. `applyDocument` 成功。
3. 夹具用到的组件名没有白名单之外的值。
4. 属性表列名 ⊆ 该组件 `*Api.schema` 字段。不要出现 `id`、`component`、`placeholder`、`className`。名称已经是这一页的 `<h1>`。

图鉴测试不要 `commit` 到一份共享的工坊 `current` 上断言稿被改写——浏览路径根本不应调用写入管道。

### KR7 — 三个精选案例能预览，并能装进工坊

- 列表三个 id 指向 `login.json` / `settings.json` / `filtered-list.json`，不是新文件。
- 对空稿调用装入：`applyDocument` 成功后的快照与直接 fold 该夹具一致。
- 对已有合法当前页，未确认前不 `commit`（可用纯函数：`shouldConfirmReplace(current)`）。

人工：确认「换上」后进入工坊，对话是空的欢迎态，纸页与案例预览一致。

### KR8 — 设置页能改通道，且覆盖关系正确

对 `resolveChannel` 的固定字面量：

| ui | env | ready | 用谁 |
| --- | --- | --- | --- |
| 三项都空 | 三项都有 | true | 全 env |
| 只有 model | 三项都有 | true | model 用界面，其余 env |
| 三项都有 | 任意 | true | 全界面 |
| 只有 baseUrl | env 无 key | false | 不得发请求 |
| 三项都空 | 三项都空 | false | 不得发请求 |

中间件：在测试里用假 `env` + 请求 body 断言发给上游的 URL、`Authorization`、`model`，以及 body **没有** `kotodamaChannel`。不要把真实 Key 写进测试文件；用 `test-key` 这类字面量。

Health JSON 不得包含 `apiKey` 字段或 env 里的 Key 字符串。

---

## Implementation notes

建议改动面（名称可调整，职责不能拆散）：

| Area | Change |
| --- | --- |
| `src/App.tsx` / `src/studio/` | 屋子壳、路由、落地页、图鉴、案例、设置 |
| `src/editor/EditorApp.tsx` / `EditorShell.tsx` | 嵌进 `/` 的工坊屏；顶栏动作仅工坊；字标不再是 `<h1>` |
| `src/editor/storage.ts` / `EditorState.tsx` | 空稿；`reset` 不再 `createDemoSnapshot()`；`loadDraft` 不回退 demo |
| `src/editor/Preview.tsx` | 抽出 `PaperPreview`；空稿不 `logError` |
| `src/editor/chat/ChatPanel.tsx` | `autoSend` / `prefill`；通道 `Alert`；请求带 `kotodamaChannel` |
| `src/studio/channel.ts` | `resolveChannel`、`kotodama.channel:v1` |
| `server/chat-proxy.ts`、`rsbuild.config.ts` | 取消对写死 `server.proxy` target 的依赖；中间件自己转发 |
| `src/studio/catalog/fixtures/` | 18 份最小文档 |
| `src/editor/fixtures/` | 案例真源，不复制一份 |

不要为了校验去关掉渲染层 `passthrough()`，除非有独立 bug。闸门与渲染解耦：闸门 strict，渲染仍可忽略未知字段以免历史脏数据把预览打崩——但历史脏数据 **不得** 通过写入管道进入新快照。

不要把 18 个组件写进左轨。不要给图鉴做插入当前页。不要在设置页做渲染器切换或连接诊断。

PRD 假设「落地页提交后立刻自动发送，用户不会因为少一次确认而觉得失控」。若该假设不成立，再改成只预填、不自动发送；那是产品变更，不要在实现时自行改掉。通道没配齐时的预填不是推翻这条假设，而是避免禁用发送后把那句话丢掉。
