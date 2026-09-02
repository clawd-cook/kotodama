# 言灵 TEST

**产品：** 言灵（kotodama） v1.0.1  
**依据：** [PRD](./PRD.md) · [TRD](./TRD.md) · [Design](./Design.md)

本文是用例清单，不是测试实现。v1.0.0 的 W / C / P / F / M 仍然有效。v1.0.1 补外壳、图鉴、案例、设置。实现时按 **TDD 切片**：先写一条会失败的用例，再写刚好让它通过的代码。不要一次把全表写成空壳测试再补实现。

期望值来自本文件、夹具文件和 PRD/TRD/Design 的原文，不要用实现函数再算一遍当作 expected。

---

## Seams

只在这些公共边界上测行为。模块文件名可以改；测的能力不能改。不要测私有函数、不要 mock `foldMessages` / 校验器、不要断言内部调用次数。

| ID | Seam | Public interface | Observe |
| --- | --- | --- | --- |
| **W** | Write gate | `applyDocument(text, current): ApplyResult` | 成功得到新 `Snapshot`；失败 `ok: false`，`current` 原样，中文 `message` |
| **C** | Codec | `toMessages(snapshot)` / `foldMessages(messages)` | 源文件数组 ↔ 快照。往返后 `surfaceId`、`catalogId`、按 id 的组件、`dataModel` 与夹具一致。下载文本不含 API Key |
| **P** | Chat present | `presentAssistant(raw, applyResult)` | 给气泡的字符串；成功是 `summary` 或「已更新界面。」；失败是「页面没改。」开头；不含 `createSurface` / `updateComponents` |
| **F** | Fixtures | `src/editor/fixtures/*.json` 作为独立真源 | 夹具本身能 `applyDocument` 成功；字段是手写字面量。精选案例与这三份黄金夹具是同一文件 |
| **D** | Draft | `emptySnapshot()` / `isCurrentPage(snapshot)` / `parseDraft(raw)` | 空稿不能当当前页。缺 key、坏 JSON、通不过校验都得到空稿，不是 demo。合法草稿按字段恢复 |
| **R** | Create room | `createScreen({ snapshot, visitedWorkshop })` | `'landing'` 或 `'workshop'`。刷新只认当前页；会话内进过工坊则打开工坊 |
| **L** | Landing submit | `PROMPT_ITEMS` / `landingSubmit(text, ready)` | 三个提示文案与 Design 原文相同。`ready` 则 `autoSend`；否则 `prefill`。不要发请求（那是调用方的事） |
| **G** | Gallery | `src/studio/catalog/fixtures/<Name>.json` + `catalogPropertyNames(name)` | 18 份夹具都能 `applyDocument`；组件名 ⊆ 白名单；属性名 ⊆ 对应 `*Api.schema`，没有 `id` / `component` / `placeholder` / `className`。浏览路径不调用 `applyDocument` 去改工坊稿 |
| **E** | Examples | `EXAMPLE_PAGES` + `shouldConfirmReplace(snapshot)` + `applyDocument` | 三个 id 指向黄金夹具。空稿装入后与 `foldMessages` 一致。已有合法当前页时，未确认前不 `commit`（由 `shouldConfirmReplace === true` 表达） |
| **H** | Channel | `resolveChannel(ui, env)` | `ready` 与各字段用谁，按下方字面量表。空字符串和空白都当空 |
| **X** | Chat proxy | `createChatProxy(env, fetchImpl)` 处理 health 与 completions | 发给上游的 URL / `Authorization` / `model`；body 没有 `kotodamaChannel`。`ready === false` 则 503。health JSON 没有 `apiKey` 字段，也不含 env 里的 Key 字符串 |
| **M** | Manual | 浏览器里的屋子 / 工坊 / 纸页 / 真模型 | 清单勾选，不进单元套件 |

`ApplyResult` 契约（实现须满足，测试只认这个形状）：

```ts
type ApplyResult =
  | { ok: true; snapshot: Snapshot }
  | { ok: false; code: string; message: string };
```

`source`（`json` / `chat` / `protocol`）由调用方写入错误列表，不是 W 的返回值。对话失败展示走 P；打开文件失败文案走 Design：**没有打开。{原因}。**

系统边界才允许 mock：对话模型 HTTP。不要 mock 自己的 fold / validate。

---

## Slice order

按这个顺序做 red → green。前一条绿了再写下一条。v1.0.0 闸门已经绿，v1.0.1 从 D-01 起切外壳。

**v1.0.0（已完成，回归必须继续绿）**

1. W-01 未知组件不能盖掉当前页  
2. W-02 合法 demo 可以写入  
3. C-01 demo 往返后标题仍是「任务管理」  
4. W-03 缺少 `root` 失败（不再自动改名）  
5. W-04 `placeholder` 失败  
6. W-05 内联 children 失败  
7. W-06 第二 surface 失败  
8. W-07 非 JSON 失败  
9. P-01 信封成功只展示 summary  
10. P-02 校验失败展示「页面没改。」且无协议原文  
11. P-03 裸数组回退句「已更新界面。」  
12. F-01…F-03 三份黄金夹具可写入  
13. C-02…C-04 三份黄金夹具往返  

**v1.0.1**

1. D-01 空稿不是当前页  
2. D-02 缺草稿 / 坏草稿得到空稿，不是 demo  
3. D-03 合法草稿按字面量恢复  
4. R-01 无当前页 → 落地页；有当前页 → 工坊  
5. R-02 本会话进过工坊 → 工坊（即使当前是空稿）  
6. L-01 通道就绪则自动发送；未就绪则预填  
7. L-02 三个提示文案与工坊空状态相同  
8. G-01 18 个图鉴夹具都能写入，且没有白名单外的组件名  
9. G-02 属性名来自 schema，不含 `placeholder` / `className` / `id` / `component`  
10. E-01 三个案例 id 指向黄金夹具文件  
11. E-02 空稿装入后与 fold 夹具一致  
12. E-03 已有合法当前页时 `shouldConfirmReplace` 为 true；空稿为 false  
13. H-01…H-05 `resolveChannel` 字面量表  
14. C-05 源文件文本不含已保存的 API Key  
15. X-01 中间件按合并结果 `fetch` 上游，body 无 `kotodamaChannel`  
16. X-02 未就绪返回 503 和通道未配那句话  
17. X-03 health 不含 Key  
18. M 清单（外壳 + Design + KR1 真模型）

---

## Shared current page

除写明外，W 的 `current` 都是 `createDemoSnapshot()` 的语义，断言用这些字面量，不要对整个对象做模糊 snapshot：

| Field | Literal |
| --- | --- |
| `surfaceId` | `main` |
| `catalogId` | `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json` |
| root | `id` 为 `root`，`component` 为 `Column` |
| `dataModel.title` | `任务管理` |
| `dataModel.queryLabel` | `查询` |

失败用例的 Then 一律包括：`result.ok === false`；`current.dataModel.title` 仍为 `任务管理`；`result.message` 为非空中文。

---

## W — Write gate (KR2)

合法输入：`JSON.stringify(toMessages(createDemoSnapshot()))` 只用于 W-02 的 *输入文本*。W-02 的 Then 仍断言字面量字段，不要 `expect(snapshot).toEqual(createDemoSnapshot())` 这种自己生成自己。

### W-01 · unknown component does not replace the page

- **Seam:** W  
- **Given:** 当前页为 demo。  
- **When:** 写入一份其它部分合法、但某组件 `"component": "Table"` 的消息数组。  
- **Then:** `ok` 为 false。`message` 含 `Table`。当前页 `dataModel.title` 仍为 `任务管理`。

同条可再跑 `"component": "Form"`：`message` 含 `Form`。可作为 W-01b，同一切片。

### W-02 · valid demo document becomes the page

- **Seam:** W  
- **When:** 写入 `toMessages(createDemoSnapshot())` 的 JSON 文本。  
- **Then:** `ok` 为 true。`snapshot.surfaceId` 为 `main`。存在 `id === "root"`。`snapshot.dataModel.title` 为 `任务管理`。

### W-03 · missing root does not rename another node

- **Seam:** W  
- **When:** 组件列表只有 `id: "title"` 的 `Text`，没有 `root`。  
- **Then:** `ok` 为 false。`message` 含 `root`。当前页仍是 demo（`queryLabel` 仍为 `查询`）。

### W-04 · extra TextField props are rejected

- **Seam:** W  
- **When:** 合法树中的 `TextField` 带 `"placeholder": "请输入"`。另测 `"className": "ant-input"`。  
- **Then:** `ok` 为 false。`message` 含被拒属性名（`placeholder` 或 `className`）。当前页仍是 demo。

### W-05 · inline children are rejected

- **Seam:** W  
- **When:** `Column` 的 `children` 为对象数组（内联组件），而不是 id 字符串。  
- **Then:** `ok` 为 false。当前页仍是 demo。

### W-06 · second surface is rejected

- **Seam:** W  
- **When:** 消息数组里两个不同 `surfaceId`（例如 `main` 与 `other`）。  
- **Then:** `ok` 为 false。当前页仍是 demo。

### W-07 · non-JSON is rejected

- **Seam:** W  
- **When:** 文本为 `这不是 JSON`。  
- **Then:** `ok` 为 false。当前页仍是 demo。

### W-08 · deleteSurface is rejected

- **Seam:** W  
- **When:** 消息含 `deleteSurface`。  
- **Then:** `ok` 为 false。当前页仍是 demo。

### W-09 · wrong catalogId is rejected

- **Seam:** W  
- **When:** `createSurface.catalogId` 为 `https://example.com/not-basic.json`。  
- **Then:** `ok` 为 false。`message` 能看出是目录 / `catalogId` 问题。当前页仍是 demo。

---

## C — Codec (KR3)

比较语义，不要依赖对象键被 `JSON.stringify` 排成同一字符串（除非实现保证 `toMessages` 字段顺序稳定——TRD 已规定三条消息顺序）。最低断言：

- `surfaceId === "main"`
- `catalogId` 等于上表 URL
- 每个夹具里出现的组件 `id` 仍在
- `dataModel` 中夹具写明的字段值不变

### C-01 · demo round-trip keeps copy

- **Seam:** C  
- **When:** `foldMessages(toMessages(createDemoSnapshot()))`。  
- **Then:** `dataModel.title` 为 `任务管理`。`dataModel.queryLabel` 为 `查询`。存在 `root`。`surfaceId` 为 `main`。

再经 `applyDocument(JSON.stringify(toMessages(that)))` 亦 `ok`。

### C-02 · login fixture round-trip

- **Seam:** C + F  
- **Given:** `fixtures/login.json`（见 F-01 字段）。  
- **When:** parse → fold → apply → `toMessages`。  
- **Then:** `dataModel` 仍含夹具中的 `title` / 密码绑定路径对应值。存在 `obscured` 的 `TextField`。存在 `variant: "primary"` 的 `Button`。

### C-03 · settings fixture round-trip

- **Seam:** C + F  
- **Given:** `fixtures/settings.json`。  
- **Then:** 夹具中的分组标题字符串（见 F-02）仍在 `dataModel` 或 `Text` 绑定里。存在 `Card` 或第二层 `Column`。

### C-04 · filtered-list fixture round-trip

- **Seam:** C + F  
- **Given:** `fixtures/filtered-list.json`。  
- **Then:** 存在 `ChoicePicker` 与 `List`。筛选相关 `dataModel` 字段与夹具字面量一致。

---

## P — Chat present (KR4)

输入是模型原始字符串 + 一次 `ApplyResult`。输出是气泡文案。不要渲染 React 再扒 DOM。

成功且尚未 apply 时：先 parse 出 `messages`，再 `applyDocument`；展示用 parse 到的 `summary`，不要用原始 `raw`。

### P-01 · envelope success shows only the summary

- **Seam:** P（parse + 展示）  
- **When:** raw 为：

```json
{"summary":"已改成带验证码的登录表单。","messages":[]}
```

`messages` 在测试里换成 W-02 能通过的合法数组。apply 成功。  
- **Then:** 展示文案 **精确等于** `已改成带验证码的登录表单。`  
- **And:** 展示文案不含 `createSurface`、`updateComponents`、`updateDataModel`。

### P-02 · apply failure shows the design failure sentence

- **Seam:** P + W  
- **When:** raw 信封的 `summary` 为 `已生成表格。`，`messages` 含 `Table`。apply 失败。  
- **Then:** 展示文案以 `页面没改。` 开头。含 `Table`。不含 `createSurface`。  
- **And:** 不展示 `已生成表格。`（失败以闸门为准，不以模型 summary 为准）。

### P-03 · bare array falls back to the fixed summary

- **Seam:** P  
- **When:** raw 是合法消息数组（无 `summary` 字段），apply 成功。  
- **Then:** 展示文案 **精确等于** `已更新界面。`  
- **And:** 不含 `createSurface`。

### P-04 · fenced JSON still applies and hides protocol

- **Seam:** P  
- **When:** raw 为 markdown 围栏包着合法数组（现有 `extractA2uiMessages` 能解的那种）。apply 成功。  
- **Then:** 展示为 `已更新界面。`（无 summary）。不含 ` ``` ` 围栏，不含 `createSurface`。

### P-05 · streaming placeholder is not protocol

- **Seam:** P 或 UI 约定  
- **Then:** 请求中的占位文案 **精确等于** `正在写下这一页…`（[Design](./Design.md)）。单元层可测常量；不要测 token 流。

---

## F — Golden fixtures (KR1 deterministic)

夹具是手写 JSON 文件，字段就是 expected。不要用脚本从 prompt 生成夹具再断言生成结果。

路径建议：`src/editor/fixtures/login.json`、`settings.json`、`filtered-list.json`。内容必须是 A2UI v0.9 **消息数组**（源文件格式），不是对话信封。

### F-01 · login fixture is a valid page

夹具必须能 `applyDocument` 成功，并含这些字面量：

| 要求 | Literal |
| --- | --- |
| 标题类文案 | `登录` 出现在 `dataModel` 或绑定文本中 |
| 密码框 | 至少一个 `TextField` 的 `variant` 为 `obscured` |
| 主按钮 | 至少一个 `Button` 的 `variant` 为 `primary` |
| 绑定 | 至少一处 `value: { "path": "/..." }` |

### F-02 · settings fixture is a valid page

| 要求 | Literal |
| --- | --- |
| 标题 | `设置` 出现在数据或文本中 |
| 结构 | 同时存在 `Column` 与 `Card`，或两层以上 `Column` |
| 输入 | 至少两个 `TextField` 或 `CheckBox` |

### F-03 · filtered-list fixture is a valid page

| 要求 | Literal |
| --- | --- |
| 筛选 | 存在 `ChoicePicker` |
| 列表 | 存在 `List` |
| 选项 | `ChoicePicker.options` 至少两项，其中一项 `label` 为手写中文（夹具写死，例如 `全部`） |

### F-04 · revised login still valid

「再改一版」的确定性部分：`fixtures/login-otp.json`（或 login 的第二份）。

| 要求 | Literal |
| --- | --- |
| 仍通过 apply | `ok` |
| 可见差异 | 出现与验证码相关的字面量，例如标签 `验证码` 或 path `/otp` |
| 仍是登录 | 仍有 `obscured` 的 `TextField` |

---

## M — Manual (Design + KR1 model)

不自动化。发 v1.0.0 前勾选。模型失败只证明 KR2，不证明闸门坏了。

### M-01 · speech-first chrome

打开编辑器。

- 左栏默认 Tab 文案是 **说话**（不是「对话」）。  
- 空说话栏标题是 **说你想要的那一页**。  
- 顶栏有 **打开**、**下载**、**撤销**、**重做**、**新建**、**深色**。  
- 顶栏没有第二个主色按钮（发送主色只在说话输入）。  
- 底栏 Tab 为 **JSON**、**数据**、**事件**、**错误**。

### M-02 · sheet is not the workshop

- 预览是居中白纸，不是铺满灰底的控件墙。  
- 生成页按钮 / 输入是 Ant Design 默认蓝，不是印泥红。  
- 字标「言灵」可读；印装饰不进无障碍名称。

### M-03 · download then open

1. 打开黄金夹具或生成一页合法页。  
2. **下载**，文件名为 `kotodama.json`。  
3. **新建** 确认后，再 **打开** 该文件。  
4. 纸页文案与下载前一致（对照夹具字面量）。  
5. 说话栏仍无完整 JSON。

下载成功若有反馈，文案为 **已下载 kotodama.json。** 打开失败为 **没有打开。{原因}。** 纸页不动。

### M-04 · live gold tasks

配置 `.env` 后分别发送三条提示：做一个登录表单 / 做一个设置页 / 做一个带筛选的列表。再各改一句。

通过：纸页非空；气泡无 `createSurface`；JSON 底栏能看到协议。失败：纸页仍是上一版；气泡以 **页面没改。** 开头。

### M-05 · try does not reshape

在纸页填表、点按钮。结构不变。**事件** 里出现记录。不要触发新的对话请求。

### M-06 · reduced motion

系统开启减少动效。换稿时纸页可以换内容，不应再有落下位移。

### M-07 · studio shell

无合法草稿时打开产品。

- 四个左轨文字可见：**开始创建**、**基础组件**、**精选案例**、**设置**。  
- 落地页标题是 **从这里说出一页**。输入 placeholder 是 **描述你想要的界面…**。  
- 落地页没有打开 / 下载 / 撤销 / 重做 / 新建。深色开关在。  
- 点「做一个登录表单」：进入工坊；通道配齐时说话栏出现 **正在写下这一页…**。  
- 基础组件默认是 `Column`。预览、JSON、属性表都在。复制成功文案 **已复制 JSON。** 工坊纸页不变。  
- 精选案例三张纸。详情 **用这一页** 后进入工坊，纸页与案例一致。已有当前页时确认框文案为 **换上这一页？当前页会被盖掉。** / **留下** / **换上**。  
- 设置三项有可见 label。保存文案 **已保存。后续对话用这组通道。** 清空保存 **已清空。下次对话用环境变量。** Key 是密码框。  
- 刷新深层路径（`/catalog/Row`、`/examples/login`、`/settings`）仍停在该房间。  
- 下载的 `kotodama.json` 里没有 API Key。

### M-08 · live gold tasks from landing

通道配齐后，从落地页点三个提示各走一遍。通过校验则纸页更新。与 M-04 相同的失败规则。

---

## D — Draft (KR5 foundation)

空稿字面量：`components` 为 `[]`，`dataModel` 为 `{}`，`surfaceId` 为 `main`，`catalogId` 为上表 URL。它不是合法源文件。

`isCurrentPage(snapshot)` 为真，当且仅当 `validateSnapshot(snapshot, toMessages(snapshot)) === null`。测试只认这个布尔结果，不要去读 `localStorage`。

### D-01 · empty snapshot is not a current page

- **Seam:** D  
- **When:** `emptySnapshot()`。  
- **Then:** `components` 长度为 0。`dataModel` 为 `{}`。`surfaceId` 为 `main`。`isCurrentPage` 为 false。

### D-02 · missing or invalid draft becomes empty, not demo

- **Seam:** D  
- **When:** `parseDraft(null)`；另测 `parseDraft("{")`；另测一份带 `components` 但缺少 `root` 的对象 JSON。  
- **Then:** 结果 `components` 长度为 0。`dataModel` 为 `{}`。结果里没有字面量 `任务管理`。

### D-03 · valid draft restores literal fields

- **Seam:** D  
- **Given:** `JSON.stringify` 一份已通过校验的黄金登录快照（先 `applyDocument` 登录夹具得到 snapshot，再序列化该 snapshot）。  
- **When:** `parseDraft` 这段文本。  
- **Then:** `isCurrentPage` 为 true。`dataModel.title` 为 `登录`。

---

## R — Create room (KR5)

`createScreen({ snapshot, visitedWorkshop })` 返回 `'landing'` 或 `'workshop'`。刷新后 `visitedWorkshop` 为 false。

### R-01 · empty page opens landing; valid page opens workshop

- **Seam:** R + D  
- **When:** `visitedWorkshop` 为 false，snapshot 为空稿。  
- **Then:** `'landing'`。  
- **When:** `visitedWorkshop` 为 false，snapshot 为合法登录页。  
- **Then:** `'workshop'`。

### R-02 · visited workshop stays in workshop even if the page is empty

- **Seam:** R  
- **When:** snapshot 为空稿，`visitedWorkshop` 为 true（落地页提交过，或「用这一页」成功过）。  
- **Then:** `'workshop'`。

---

## L — Landing submit (KR5)

`PROMPT_ITEMS` 的 `label` 必须精确等于：

- `做一个登录表单`
- `做一个设置页`
- `做一个带筛选的列表`

`landingSubmit(text, ready)`：

```ts
type LandingSubmit =
  | { autoSend: string }
  | { prefill: string };
```

不要在这个函数里发 HTTP。通道是否就绪由调用方传入。

### L-01 · ready auto-sends; not ready prefills

- **Seam:** L  
- **When:** `landingSubmit("做一个登录表单", true)`。  
- **Then:** 结果含 `autoSend`，值为 `做一个登录表单`。不含 `prefill`。  
- **When:** `landingSubmit("做一个登录表单", false)`。  
- **Then:** 结果含 `prefill`，值为 `做一个登录表单`。不含 `autoSend`。

### L-02 · landing prompts match workshop empty state

- **Seam:** L  
- **Then:** `PROMPT_ITEMS` 三个 `label` 精确等于上表三句。

---

## G — Catalog gallery (KR6)

夹具路径：`src/studio/catalog/fixtures/<Name>.json`，`<Name>` 为白名单协议名（`Column`、`TextField` 等）。内容是手写消息数组。

属性名来自 `@a2ui/web_core` 对应 `*Api.schema` 的字段，不是 antd。测试自己从 schema 取出字段集合当 expected。

### G-01 · every catalog fixture is a valid page

- **Seam:** G + W  
- **When:** 对 `ALLOWED_COMPONENTS` 每一个名字，读取对应夹具，`applyDocument` 到一份空稿（或 demo，结果不应依赖 current）。  
- **Then:** `ok` 为 true。夹具里出现的 `component` 值都在白名单内。文档里出现该协议名。

### G-02 · property names stay inside the catalog schema

- **Seam:** G  
- **When:** `catalogPropertyNames(name)`。  
- **Then:** 返回的名字 ⊆ 该组件 schema 字段。不含 `id`、`component`、`placeholder`、`className`。

图鉴浏览不得 `commit` 工坊稿。单元层不要拿一份共享 `current` 去断言浏览后稿被改写——浏览路径根本不应调用写入管道。

---

## E — Featured examples (KR7)

```ts
type ExampleId = 'login' | 'settings' | 'filtered-list';
```

`EXAMPLE_PAGES[id].messages` 必须是 `src/editor/fixtures/` 下对应文件，不要另抄一份 JSON。

`shouldConfirmReplace(snapshot)` 为 true，当且仅当 `isCurrentPage(snapshot)`。

### E-01 · example ids point at golden fixture files

- **Seam:** E + F  
- **Then:** `login` / `settings` / `filtered-list` 三份 messages 分别与 `fixtures/login.json`、`settings.json`、`filtered-list.json` 的解析结果一致（`JSON.stringify` 相等即可，因为是同一份真源）。

### E-02 · applying an example onto an empty page matches a fold

- **Seam:** E + W + C  
- **Given:** current 为空稿。  
- **When:** `applyDocument(JSON.stringify(EXAMPLE_PAGES.login.messages), current)`。  
- **Then:** `ok`。按 id 的组件与 `dataModel` 与 `foldMessages(login.json)` 一致。`dataModel.title` 为 `登录`。

同条可再跑 `settings`、`filtered-list`。

### E-03 · replacing a valid page requires confirmation

- **Seam:** E + D  
- **Then:** 空稿 `shouldConfirmReplace` 为 false。合法登录页 `shouldConfirmReplace` 为 true。

---

## H — Channel resolve (KR8)

```ts
type ChannelFields = { baseUrl: string; apiKey: string; model: string };
type ResolvedChannel = ChannelFields & { ready: boolean };
```

空字符串、只含空白，都当空。expected 是下表字面量，不要用实现再算一遍。

| ID | ui | env | ready | 字段 |
| --- | --- | --- | --- | --- |
| H-01 | 三项 `""` | `https://env.example` / `env-key` / `env-model` | true | 全 env |
| H-02 | `""` / `""` / `ui-model` | 同上三项都有 | true | `baseUrl`/`apiKey` 为 env，`model` 为 `ui-model` |
| H-03 | `https://ui.example` / `ui-key` / `ui-model` | 任意非空 | true | 全界面 |
| H-04 | `https://ui.example` / `""` / `""` | `https://env.example` / `""` / `env-model` | false | `baseUrl` 为界面，`apiKey` 为空，`model` 为 env |
| H-05 | 三项 `""` | 三项 `""` | false | 三项都空 |

不要把真实 Key 写进测试文件。用 `env-key` / `ui-key` / `test-key`。

---

## C-05 · downloaded source does not contain the API key

- **Seam:** C + H  
- **Given:** 一份合法登录快照；界面已保存 `apiKey: "test-key"`。  
- **When:** `JSON.stringify(toMessages(snapshot))`。  
- **Then:** 文本不含 `test-key`，不含 `OPENAI_API_KEY`。

---

## X — Chat proxy (KR8)

系统边界才允许 mock：注入 `fetchImpl`。不要 mock `resolveChannel`。

通道未配的人话（Design）：**通道没配好。去设置里填 Base URL、API Key 和模型名。**

### X-01 · proxy fetches upstream with the resolved channel

- **Seam:** X + H  
- **Given:** env 为 H-01 的 env。请求 body 含 `model: "ignored"`，以及 `kotodamaChannel: { baseUrl: "https://ui.example", apiKey: "ui-key", model: "ui-model" }`。  
- **When:** POST `/api/chat/completions`。  
- **Then:** `fetchImpl` 的 URL 为 `https://ui.example/v1/chat/completions`。`Authorization` 为 `Bearer ui-key`。发给上游的 JSON `model` 为 `ui-model`。发给上游的 JSON **没有** `kotodamaChannel`。

### X-02 · unready channel is 503 and does not fetch

- **Seam:** X  
- **Given:** env 三项都空。请求没有 `kotodamaChannel`。  
- **When:** POST `/api/chat/completions`。  
- **Then:** 状态码 503。JSON `error.message` 精确等于通道未配那句话。`fetchImpl` 未被调用。

### X-03 · health never echoes the key

- **Seam:** X  
- **Given:** env `OPENAI_API_KEY` 为 `secret-key`，另两项非空。  
- **When:** GET `/api/chat/health`。  
- **Then:** JSON 有 `ok: true` 和 `env.hasApiKey: true`。没有 `apiKey` 字段。响应文本不含 `secret-key`。

---

## Out of suite

不要为这些写单元测试：

- `ensureRootId`、zod 内部、`antdApi` 的 `passthrough`  
- `MessageProcessor` / `A2uiSurface` 像素  
- 纸页 840px、印 8px、落下 6px（M-02 / 目视）  
- 模型是否总能产出合法信封（M-04 / M-08）  
- React Router 是否调用了 `navigate`（测 R / L 的纯函数结果，不要测路由库）  
- 图鉴「复制」是否调用了 Clipboard API（M-07）

---

## Mapping

| PRD | Cases |
| --- | --- |
| KR1 | F-01…F-04，M-04 |
| KR2 | W-01…W-09，P-02 |
| KR3 | C-01…C-04，C-05，M-03 |
| KR4 | P-01…P-05，M-04 气泡 |
| KR5 | D-01…D-03，R-01…R-02，L-01…L-02，M-07 |
| KR6 | G-01…G-02，M-07 |
| KR7 | E-01…E-03，M-07 |
| KR8 | H-01…H-05，X-01…X-03，M-07 |

v1.0.0 首条 tracer：**W-01**。  
v1.0.1 首条 tracer：**D-01**。它一旦红，说明空稿还不存在；它一旦绿，进门不再落到 demo 任务管理页。
