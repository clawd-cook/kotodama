# 言灵 TRD

**产品：** 言灵（kotodama）  
**对应需求：** [PRD v1.0.0](./PRD.md)  
**文档版本：** v1.0.0  
**读者：** 实现对话落地、校验、渲染和文件往返的工程师

v1.0.0 的技术目标：每一条写入画布的路径（对话、底部 JSON、打开文件）都经过同一道目录校验。通过则整份替换 `Snapshot`；失败则保留旧快照。对话气泡只展示一句人话。下载的 JSON 再打开后，组件树和数据模型与下载前一致。

本文区分 **已有行为** 和 **v1.0.0 必须补齐的行为**。未标明「已有」的要求都是待实现。

---

## Boundaries

### In scope

- A2UI v0.9 消息数组作为源文件。
- `@kotodama/antd-catalog` 用 Ant Design 绘制 A2UI 基础目录。
- 整份替换写入 `Snapshot`。
- 浏览器 `localStorage` 草稿，以及 JSON 文件下载 / 打开。
- 预览可改本地 `dataModel`、记录 `action`；不把动作送回模型。

### Out of scope

PRD 第 8 节列出的后续项均不在本 TRD 实现范围内，包括：目录 v2、增量补丁、流式上画、动作回传模型、真实接口、多 surface、文档柜、云同步、发布上线。

### Runtime the editor already uses

| Piece | Location | Role |
| --- | --- | --- |
| Editor state | `src/editor/EditorState.tsx` | `Snapshot`、撤销栈、`applyJson` |
| Fold / serialize | `src/editor/snapshot.ts` | `foldMessages`、`toMessages`、`SURFACE_ID` |
| Preview | `src/editor/Preview.tsx` | `MessageProcessor` + `A2uiSurface` |
| Catalog | `packages/antd-catalog` | Ant Design 实现；`BASIC_CATALOG_ID` |
| Chat | `src/editor/chat/` | 系统提示、解析、成功后调用 `applyJson` |
| Chat proxy | `server/chat-proxy.ts`、`rsbuild.config.ts` | `/api/chat/completions` → OpenAI 兼容 `/v1/chat/completions` |
| Draft | `src/editor/storage.ts` | `localStorage` key `kotodama.draft` |

v1.0.0 不更换模型供应商。继续使用现有代理与环境变量 `OPENAI_BASE_URL`、`OPENAI_API_KEY`、`OPENAI_MODEL`。

---

## Document model

源文件是 A2UI v0.9 **消息数组**，不是 React 树，也不是 antd 组件配置。

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
2. `updateComponents`（扁平邻接表，含 `id: "root"`）
3. `updateDataModel`（`path: "/"`，值为整个 `dataModel`）

每条消息的 `version` 为 `"v0.9"`。`surfaceId` 为 `main`（`SURFACE_ID`）。`catalogId` 为：

```text
https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json
```

该 URL 来自 `@kotodama/antd-catalog` 的 `BASIC_CATALOG_ID`，与 A2UI 基础目录一致。源文件、底部 JSON 编辑器和下载文件都使用这个消息数组。对话信封（`summary` + `messages`）只出现在模型输出里，不写入文件。

产品目录版本 **1.0.0** 等于下面三者同时成立，不另写文件头字段：

- 协议：A2UI v0.9
- `catalogId`：`BASIC_CATALOG_ID`
- 组件名白名单：见 [Catalog v1.0.0](#catalog-v100)

以后扩展组件时必须升目录版本（新产品版本或新 `catalogId`）。v1.0.0 运行时拒绝白名单之外的组件名。

`deleteSurface` 不出现在 `toMessages` 输出中。写入路径若解析到 `deleteSurface`，校验失败。

---

## Write pipeline

所有写入画布的入口共用一个函数（现有 `applyJson` 升级为该函数，或抽到新模块后由 `applyJson` 调用）。

```text
text
  → JSON.parse
  → 解析对话信封或裸消息数组（仅对话入口需要拆 summary）
  → foldMessages
  → validateSnapshot   // 新增硬闸
  → commit(snapshot)   // 写入撤销栈，与今天 commit 相同
```

任一步失败：

- 不调用 `commit`。
- 当前 `Snapshot`、预览、自动草稿保持失败前的值。
- 返回结构化错误（至少 `code` + 人话 `message`）。
- `source` 按入口记为 `json`、`chat` 或 `protocol`。

不要在流式过程中调用该管道。只在助手消息 `status === 'success'`（对话）或用户完成编辑 / 选中文件后执行。这与今天 `ChatPanel` 只在 success 时应用的时机一致；v1.0.0 保持该时机，并补上校验。

手改 JSON 仍可在输入过程中显示解析错误，但只有 `validateSnapshot` 通过后才能成为当前预览。今天 `applyJson` 在 `JSON.parse` 失败时已经不 `commit`；缺口是 `foldMessages` 会接受未知组件并提交。

---

## Catalog v1.0.0

### Allowed component names

与 `src/editor/chat/prompt.ts` 中的列表一致：

`Column`、`Row`、`List`、`Card`、`Tabs`、`Modal`、`Divider`、`Text`、`Image`、`Icon`、`Video`、`AudioPlayer`、`Button`、`TextField`、`CheckBox`、`ChoicePicker`、`Slider`、`DateTimeInput`

渲染实现已在 `packages/antd-catalog/src/catalog.ts` 注册上述组件。v1.0.0 不新增组件。

### Property source of truth

每个组件的允许属性以 `@a2ui/web_core/v0_9/basic_catalog` 里对应 `*Api.schema` 为准（这些 schema 是 `.strict()` 的）。校验必须使用 **strict schema**，不能使用渲染侧经过 `antdApi()` 的 `.passthrough()` 副本。

`packages/antd-catalog/src/api.ts` 的 `passthrough()` 只影响运行时是否忽略多余字段。写入闸门必须拒绝多余字段，否则模型仍可写入 `className`、`style`、`placeholder`、HTML `type` 等 antd/HTML 属性，页面会随模型漂移。

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

预览继续用 `MessageProcessor` + `A2uiSurface`（`src/editor/Preview.tsx`）。编辑器里的 `editorCatalog`（`src/editor/wrapCatalog.tsx`）只包一层选中/悬停，不改变组件语义。

同一份通过校验的 `Snapshot`，在同一目录版本下必须画出同一棵组件树。不要按模型输出的 antd 组件名去动态 `import` 组件。

v1.0.0 只接受一个 `surfaceId`。今天预览在多个 surface 时会打日志并只渲染第一个；写入闸门改为 **直接失败**，避免静默丢页。

---

## Validation

新增 `validateSnapshot(snapshot, messages)`（模块路径自定，例如 `src/editor/validate.ts`）。`foldMessages` 只负责把消息折叠成快照，不再修复协议错误。

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

今天 `foldMessages` 末尾的 `ensureRootId` 会在缺少 `root` 时把某个未被引用的节点改名为 `root`。v1.0.0 **删除该自动改名**。缺少 `root` 就是校验失败。

### Component checks

| Rule | Fail if |
| --- | --- |
| Name | `component` 不在白名单（包括 `Table`、`Form`、`Menu` 等 antd 名） |
| Props | `*Api.schema` strict 解析失败 |
| Inline tree | `children` 里出现组件对象而不是 id |

错误信息必须能直接展示给用户，例如：「组件 `login_btn` 使用了未允许的属性 `placeholder`」。不要只抛 `JSON.parse` 风格的原始异常。

校验失败时，底部 Errors 面板仍记录条目（沿用 `EditorError`）。对话入口必须把同一句话写进气泡，见 [Chat apply](#chat-apply)。

---

## Chat apply

### Current behavior

- `EditorChatProvider` 每次请求把 `buildSystemPrompt(currentJson)` 插成唯一 system 消息。
- `buildSystemPrompt` 要求模型 **只输出 JSON 数组**，不要解释。
- `ChatPanel` 在助手消息成功后用 `extractA2uiMessages` 抽出 JSON，再 `applyJson`。
- 气泡通过 `XMarkdown` 渲染模型原文，因此用户看到整份 JSON。
- `applyJson` 失败时 `logError(..., 'chat')`，气泡内容仍是模型原文。

### Required behavior

对话成功时气泡里只有一句确认。完整 JSON 只出现在画布、底部 JSON 编辑器和下载文件中。失败时气泡只说明为什么没改，画布不动。

#### Chat envelope

模型输出改为可拆开的两段。推荐解析顺序：

1. 对象 `{ "summary": string, "messages": A2uiMessage[] }`
2. 否则退回今天的裸数组 / 围栏 JSON（`extractA2uiMessages`）。此时 `summary` 使用固定句：「已更新界面。」

`summary` 必须是一句短中文，不含 JSON 数组或代码围栏。写入画布的是 `messages`，不是整个信封。下载文件仍然是 `toMessages(snapshot)`，不是信封。

流式过程中继续显示现有占位「正在生成界面…」。不要把 token 流进气泡。成功或失败后再换成 `summary` 或错误句。

实现时：在 `useXChat` 的展示列表里覆盖助手 `content`，不要把模型原文交给 `Bubble.List`。解析仍使用原始 `content`。

#### Prompt changes

`buildSystemPrompt` 必须：

- 继续嵌入当前页的 `toMessages` JSON，以支持「再改一版」。
- 继续列出组件白名单、`root`、`SURFACE_ID`、`BASIC_CATALOG_ID`、禁止 antd/HTML 属性。
- 改为要求输出信封（`summary` + `messages`），而不是「只输出 JSON、不要解释」。
- 说明 `messages` 必须是完整的 `createSurface` + `updateComponents` + `updateDataModel`，不是补丁。

快捷提示保持现有三项（`src/editor/chat/ChatPanel.tsx` 的 `PROMPT_ITEMS`）：登录表单、设置页、带筛选的列表。

「新建」继续递增 `resetCount` 并 `reset()` 到 `createDemoSnapshot()`，从而清空对话。不要让旧会话改到新稿上。

对话落地必须走带校验的写入管道。校验失败时：

- 不 `commit`。
- 气泡展示校验返回的人话。
- `logError` 的 `source` 为 `'chat'`。

---

## Preview and actions

保持现有行为，作为 v1.0.0 契约写下来：

- 输入组件通过数据绑定写本地 `dataModel`。`Preview.tsx` 订阅 `'/'` 后调用 `syncDataModelFromPreview`。该同步 **不** 走 `commit`，因此填表不进入撤销栈。
- `MessageProcessor` 的 action 回调只调用 `logEvent`。不要把 payload 再发给 `/api/chat/completions`。
- JSON 里允许保留 `action`（`ButtonApi` 等 schema 已包含）。v1.0.0 只记录，不执行网络请求。

组件树点击选中、悬停描边是编辑器包装，不属于源文件。下载的 JSON 不得包含 `className` 或 `data-a2ui-id`。

多个 surface 不再「渲染第一个」。写入阶段已拒绝，预览不应再收到多 surface 快照。

---

## Persistence

### Auto-save (already shipped)

`saveDraft` / `loadDraft` 使用 `kotodama.draft`。刷新后恢复当前 `Snapshot`。v1.0.0 保持该行为。写入闸门失败时不得把坏快照写进 `localStorage`（今天只在 `snapshot` 变化时保存，只要不 `commit` 就不会保存坏稿）。

底部 JSON 编辑中、尚未通过校验的文本可以留在编辑器里（今天用 `jsonError` 阻止用坏稿覆盖 `jsonText` 的反向同步）。不要把这份未通过校验的文本当成草稿真相。

### Download / open (required)

在编辑器顶栏（`src/editor/EditorShell.tsx` 的 `Layout.Header`）增加 **下载** 和 **打开**。

**下载**

1. 把 `toMessages(snapshot)` 格式化为带缩进的 JSON。
2. 触发浏览器下载，MIME 为 `application/json`，建议文件名 `kotodama.json`。
3. 下载当前已通过校验的快照，而不是底部可能未通过校验的编辑缓冲。

**打开**

1. 用文件选择器读取 `.json` 文本。
2. 走同一条写入管道（parse → fold → validate → commit）。
3. 失败则画布不动，并把错误写入 Errors（`source: 'json'`）。可用 `Alert` 或现有错误面板展示，不要求做成模态。

不做文档列表、重命名、云同步。打开文件即覆盖当前稿（成功后进入撤销栈，可用撤销回到打开前）。

KR3 的判定：对同一份通过校验的快照，`JSON.stringify(toMessages(snapshot))` 在「下载 → 打开」之后与打开前相等（对象键顺序以 `toMessages` 输出为准）。组件数组按 id 对比与 `dataModel` 深比较等价。

---

## Escape hatches

组件树、属性面板、底部四栏（JSON / Data Model / Events / Errors）和撤销 / 重做均已存在。v1.0.0 的技术约束是：**它们与对话写入同一份 `Snapshot`，并共用校验闸门。**

| Entry | Today | v1.0.0 |
| --- | --- | --- |
| 底部 JSON `applyJson` | parse + fold，未知组件可提交 | fold 后 `validateSnapshot` |
| 属性面板 `updateSelectedProps` | 直接改 props | 提交前用同一套组件 schema 校验；失败则不 `commit`，在面板或 Errors 提示 |
| 插入 / 复制 / 删除 | `src/editor/ops.ts` 构造的节点已在白名单内 | 保持；插入结果仍须能通过 `validateSnapshot` |
| 撤销 / 重做 | `commit` 写入 `past` | 对话落地、打开文件、合法手改都走 `commit`，因此可撤销 |

左侧默认 Tab 仍是「对话」（`Sidebar.tsx` `defaultActiveKey="chat"`）。不要改成默认打开组件树。

---

## Failure modes

| Symptom | Check | Next action |
| --- | --- | --- |
| 对话结束后画布没变，气泡出现错误句 | Errors 面板 `source: 'chat'`；是否未知组件、缺 `root`、多余属性 | 保留旧页；用户改口再发。不要手工把坏 JSON 贴进画布 |
| 底部 JSON 有红条，预览仍是旧页 | `jsonError` 或校验信息 | 修到通过校验才会 `commit` |
| 打开文件后页面与预期不符 | 文件是否为 `toMessages` 数组；`catalogId` / `surfaceId` 是否为约定值 | 校验失败则不应覆盖；成功则对比 `toMessages` |
| 预览空白「无法预览」 | `source: 'preview'`；组件树是否空 | 预览错误不得反过来清空已提交快照 |
| 对话请求失败 | `/api/chat/health` 的 `configured`；`.env` 中三项是否齐全 | 已有 `requestFallback`；不修改快照 |
| 气泡里出现完整 JSON | 展示层是否仍绑定模型原文 | 改为只渲染 `summary` 或错误句 |

---

## Gap list

按 PRD 验收顺序排列。每一项都是相对当前仓库的差。

| Order | Gap | Current code | Required |
| --- | --- | --- | --- |
| 1 | 校验硬闸 | `applyJson` 只检查能 parse、且 fold 后 `components.length > 0`；`ensureRootId` 会改名 | `validateSnapshot`；缺 `root` 失败；未知组件 / 多余属性失败 |
| 2 | 渲染稳定 | Ant Design 目录已能画白名单组件；多 surface 被静默忽略 | 写入期拒绝多 surface；同一 JSON 反复 `toMessages` → fold → 预览一致 |
| 3 | 对话主路径 | 气泡渲染模型 JSON；提示词禁止解释 | 信封 + 展示层只显示人话；失败人话来自校验 |
| 4 | 文件往返 | 仅 `localStorage` 草稿 | 顶栏下载 / 打开，格式为 `toMessages` |
| 5 | 逃生舱同闸 | 属性与 fold 可写入未校验 props | 手改与对话共用 `validateSnapshot` |

目录版本没有独立文件字段。用白名单 + `BASIC_CATALOG_ID` + 本 TRD 的 1.0.0 约定作为版本。不要在 v1.0.0 另造私有 JSON 头。

---

## Acceptance

对应 PRD Key Results。能写成确定性测试的必须有测试；依赖模型的标为人工 / 评测。

仓库根包当前没有测试脚本。v1.0.0 需要为闸门和往返补上可重复运行的测试（测试运行器自选，但必须能在仓库里执行）。

### KR2 — 坏输出不能毁掉当前页

用固定夹具调用写入管道。准备一页合法快照为「当前页」，再分别输入：

- 组件名为 `Table` 或 `Form`
- 缺少 `id: "root"`
- `TextField` 带 `placeholder` 或 `className`
- `children` 内联对象而不是 id
- 第二个 `surfaceId`
- 非 JSON 文本

每一次：返回失败；`Snapshot` 引用或深比较与输入前相同；错误信息为中文且指出规则。

### KR3 — 文件往返

对 demo 快照（`createDemoSnapshot`）以及三份黄金夹具：

1. `serialized = JSON.stringify(toMessages(snapshot), null, 2)`
2. `next = foldMessages(JSON.parse(serialized))` 后 `validateSnapshot` 通过
3. `toMessages(next)` 与原序列化语义相等（`surfaceId`、`catalogId`、按 id 索引的组件 props、`dataModel`）

黄金夹具放在仓库内（例如 `src/editor/fixtures/`），覆盖：

- 登录表单（`TextField` 含 `obscured`、主按钮、绑定 `/` 下字段）
- 设置页（多项输入 + 分组用 `Column` / `Card`）
- 带筛选的列表（`ChoicePicker` 或等价筛选 + `List`）

夹具必须能通过 `validateSnapshot`，且只用白名单组件。

### KR4 — 气泡不展示完整 JSON

成功路径：展示给 `Bubble.List` 的助手 `content` 等于 `summary`（或退回句「已更新界面。」），不得包含 `createSurface` 或 `updateComponents` 原文。

失败路径：展示内容等于校验人话，同样不含完整消息数组。

可用针对 parse + 展示映射的单元测试；不必起浏览器。

### KR1 — 三类黄金任务

确定性部分：三份夹具代表「生成结果」和「再改一版」后的合法 JSON，均通过校验并可被预览消费。

模型部分：用快捷提示跑通对话（需配置 `.env`）。成功标准：校验通过、预览非空、气泡无完整 JSON。模型失败时以 KR2 为准（旧页保留），不把偶发模型错误算作闸门缺陷。

---

## Implementation notes

建议改动面（名称可调整，职责不能拆散）：

| Area | Change |
| --- | --- |
| `src/editor/validate.ts` | 新建。文档规则 + strict `*Api.schema` |
| `src/editor/snapshot.ts` | 去掉 `ensureRootId` 自动改名；fold 保持折叠职责 |
| `src/editor/EditorState.tsx` | `applyJson` / 属性更新走校验；失败不 `commit` |
| `src/editor/chat/prompt.ts` | 改为信封协议 |
| `src/editor/chat/parseA2ui.ts` | 解析 `{ summary, messages }`，保留裸数组回退 |
| `src/editor/chat/ChatPanel.tsx` | 成功/失败后只展示人话 |
| `src/editor/EditorShell.tsx` | 下载、打开 |
| `src/editor/fixtures/` | 三份黄金 JSON |

不要为了校验去关掉渲染层 `passthrough()`，除非有独立 bug。闸门与渲染解耦：闸门 strict，渲染仍可忽略未知字段以免历史脏数据把预览打崩——但历史脏数据 **不得** 通过写入管道进入新快照。

PRD 假设「人话和 JSON 可以可靠拆开」。若信封成功率不足，先收紧提示词和解析回退（第一行中文 + 随后 JSON 数组），不要因此扩大组件目录。
