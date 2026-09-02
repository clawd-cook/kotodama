# 言灵 TEST

**产品：** 言灵（kotodama） v1.0.0  
**依据：** [PRD](./PRD.md) · [TRD](./TRD.md) · [Design](./Design.md)

本文是 v1.0.0 的用例清单，不是测试实现。实现时按 **TDD 切片**：先写一条会失败的用例，再写刚好让它通过的代码。不要一次把全表写成空壳测试再补实现。

期望值来自本文件、夹具文件和 PRD/TRD/Design 的原文，不要用实现函数再算一遍当作 expected。

---

## Seams

只在这些公共边界上测行为。模块文件名可以改；测的能力不能改。不要测私有函数、不要 mock `foldMessages` / 校验器、不要断言内部调用次数。

| ID | Seam | Public interface | Observe |
| --- | --- | --- | --- |
| **W** | Write gate | `applyDocument(text, current): ApplyResult`（可由现有 `applyJson` 长成） | 成功得到新 `Snapshot`；失败 `ok: false`，`current` 原样，中文 `message` |
| **C** | Codec | `toMessages(snapshot)` / `foldMessages(messages)` | 源文件数组 ↔ 快照。往返后 `surfaceId`、`catalogId`、按 id 的组件、`dataModel` 与夹具一致 |
| **P** | Chat present | `presentAssistant(raw, applyResult)`（parse + 展示可同模块导出） | 给气泡的字符串；成功是 `summary` 或「已更新界面。」；失败是「页面没改。」开头；不含 `createSurface` / `updateComponents` |
| **F** | Fixtures | `src/editor/fixtures/*.json` 作为独立真源 | 夹具本身能 `applyDocument` 成功；字段是手写字面量 |
| **M** | Manual | 浏览器里的工坊 / 纸页 / 真模型 | 清单勾选，不进单元套件 |

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

按这个顺序做 red → green。前一条绿了再写下一条。

1. W-01 未知组件不能盖掉当前页  
2. W-02 合法 demo 可以写入  
3. C-01 demo 往返后标题仍是「欢迎使用言灵」  
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
14. M 清单（Design + KR1 真模型）

---

## Shared current page

除写明外，W 的 `current` 都是 `createDemoSnapshot()` 的语义，断言用这些字面量，不要对整个对象做模糊 snapshot：

| Field | Literal |
| --- | --- |
| `surfaceId` | `main` |
| `catalogId` | `https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json` |
| root | `id` 为 `root`，`component` 为 `Column` |
| `dataModel.title` | `欢迎使用言灵` |
| `dataModel.submitLabel` | `提交` |

失败用例的 Then 一律包括：`result.ok === false`；`current.dataModel.title` 仍为 `欢迎使用言灵`；`result.message` 为非空中文。

---

## W — Write gate (KR2)

合法输入：`JSON.stringify(toMessages(createDemoSnapshot()))` 只用于 W-02 的 *输入文本*。W-02 的 Then 仍断言字面量字段，不要 `expect(snapshot).toEqual(createDemoSnapshot())` 这种自己生成自己。

### W-01 · unknown component does not replace the page

- **Seam:** W  
- **Given:** 当前页为 demo。  
- **When:** 写入一份其它部分合法、但某组件 `"component": "Table"` 的消息数组。  
- **Then:** `ok` 为 false。`message` 含 `Table`。当前页 `dataModel.title` 仍为 `欢迎使用言灵`。

同条可再跑 `"component": "Form"`：`message` 含 `Form`。可作为 W-01b，同一切片。

### W-02 · valid demo document becomes the page

- **Seam:** W  
- **When:** 写入 `toMessages(createDemoSnapshot())` 的 JSON 文本。  
- **Then:** `ok` 为 true。`snapshot.surfaceId` 为 `main`。存在 `id === "root"`。`snapshot.dataModel.title` 为 `欢迎使用言灵`。

### W-03 · missing root does not rename another node

- **Seam:** W  
- **When:** 组件列表只有 `id: "title"` 的 `Text`，没有 `root`。  
- **Then:** `ok` 为 false。`message` 含 `root`。当前页仍是 demo（`submitLabel` 仍为 `提交`）。

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
- **Then:** `dataModel.title` 为 `欢迎使用言灵`。`dataModel.submitLabel` 为 `提交`。存在 `root`。`surfaceId` 为 `main`。

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

---

## Out of suite

不要为这些写单元测试：

- `ensureRootId`、zod 内部、`antdApi` 的 `passthrough`  
- `MessageProcessor` / `A2uiSurface` 像素  
- 纸页 840px、印 8px、落下 6px（M-02 / 目视）  
- 聊天代理如何改写 HTTP body  
- 模型是否总能产出合法信封（M-04）

---

## Mapping

| PRD | Cases |
| --- | --- |
| KR1 | F-01…F-04，M-04 |
| KR2 | W-01…W-09，P-02 |
| KR3 | C-01…C-04，M-03 |
| KR4 | P-01…P-05，M-04 气泡 |

首条 tracer：**W-01**。它一旦红，说明闸门还不存在；它一旦绿，坏 JSON 不能再毁掉 demo 页。
