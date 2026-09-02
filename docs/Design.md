# 言灵 Design

**产品：** 言灵（kotodama） v1.0.0  
**对应需求：** [PRD](./PRD.md) · [TRD](./TRD.md)  
**画布规范：** [Ant Design v6 默认主题](./ant-design/design.md)  
**验收用例：** [TEST v1.0.0](./TEST.md)

这份文档决定编辑器长什么样、字怎么写、主次怎么分。实现时改 chrome，不要改生成页的 Ant Design 语义。

---

## Subject

言灵：把说出来的话收成一页稳定的界面。

- **谁用：** 先说话的人；必要时才打开树、属性和 JSON 的人。
- **这一屏的唯一工作：** 让人看见「我说了 → 这一页定了」。
- **材料：** 话、纸页、印。不是聊天机器人皮肤，也不是 IDE 皮肤。

预览里的页面必须是 Ant Design 的页面：Natural、Certain、Meaningful、Growing。编辑器是托住这张纸的工坊。工坊可以有自己的印记；纸页上不能出现工坊的装饰。

---

## Two surfaces

v1.0.0 用两套主题，不要混成一套。

| Surface | Job | Theme |
| --- | --- | --- |
| **工坊** | 顶栏、对话、组件树、属性、底栏 | 言灵种子，见下方 tokens |
| **纸页** | 中间预览里渲染出的界面 | Ant Design 默认 `defaultAlgorithm` / `darkAlgorithm`，不改 `colorPrimary` |

实现：外层 `ConfigProvider`（已有 `XProvider`）负责工坊。预览根节点再包一层 `ConfigProvider`，只传 Ant Design 默认算法和默认 seed，把工坊的 `colorPrimary` 隔开。

这样生成页在任何时候都长得像普通 Ant Design 后台，而不是「言灵皮肤的页面」。稳定来自目录和协议，观感来自 Ant Design 默认主题。

---

## Token plan

### Why this, not a template

不用暖奶油底 + 衬线标题 + 陶土强调（常见 AI 落地页）。不用近黑底 + 霓虹强调（常见 AI 控制台）。不用报纸细线通栏（常见「编辑感」模板）。

言灵的材料是墨和纸。工坊用冷灰宣纸色托住一张白页；唯一的色风险是顶栏「言灵」旁的一枚印泥，不用作按钮色。

### Color

工坊只改最小种子，其余交给 Ant Design 算法推导。

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `ink` | `#1F1F1F` | `rgba(255,255,255,0.88)` | 主文字。等同 Ant Design `on-surface` |
| `mist` | `#595959` | `rgba(255,255,255,0.65)` | 次要文字 |
| `paper` | `#F0F2F5` | `#141414` | 工坊底。比默认 `#F5F5F5` 略冷，让白纸页跳出来 |
| `sheet` | `#FFFFFF` | `#1F1F1F` | 纸页表面。预览内层用 Ant Design `colorBgContainer` |
| `rule` | `#D9D9D9` | `#424242` | 分割。用 token，不写死 hex |
| `seal` | `#CF1322` | `#FF4D4F` | **仅**字标旁 8×8 印。Ant Design `red-7` / `error`，不作 primary |

工坊 `colorPrimary` 保持 `#1677FF`。对话发送、焦点环、选中描边都走它。不要把印泥红做成主按钮。

纸页内层：不覆盖 `colorPrimary`、状态色、圆角、字号。完整数值以 [Ant Design design.md](./ant-design/design.md) 为准。

### Type

Ant Design 界面只用 400 和 600，14px 正文。工坊控件遵守这条。

| Role | Face | Use |
| --- | --- | --- |
| Display | `"Noto Serif SC", "Source Han Serif SC", "Songti SC", serif` | **只用于**顶栏两个字「言灵」。字重 600，字号 18px，字距 0.12em |
| Body | Ant Design 系统栈（`-apple-system`, `Segoe UI`, `PingFang SC`, …） | 对话、按钮、属性、欢迎文案 |
| Code | `"SFMono-Regular", Consolas, Menlo, monospace` | 底栏 JSON / 数据 / 日志。13px / 20px |

不要给标题、Tab、按钮套衬线。衬线一旦离开字标，工坊会变成模板杂志。

### Layout

4px 网格。间距只用 Ant Design 的 xs/sm/md/lg/xl（4 / 8 / 16 / 24 / 32）。顶栏高度 48px（12×4），已有。

结构表示信息：左栏是说话；中栏是落下的那一页；右栏和底栏是核对用的逃生舱，视觉权重低于前两者。

```
┌─ 工坊 ─────────────────────────────────────────────┐
│ 言灵印   打开  下载     撤销 重做 新建     深色     │
├──────────┬────────────────────┬───────────────────┤
│ 说话     │                    │ 属性              │
│ · 欢迎   │     ┌──纸页──┐     │ 安静、无主色块    │
│ · 一句   │     │ AntD   │     │                   │
│ · 输入   │     │ 页面   │     │                   │
│ ──组件── │     └────────┘     │                   │
├──────────┴────────────────────┴───────────────────┤
│ 源文件 JSON · 数据 · 事件 · 错误   （默认收矮）     │
└───────────────────────────────────────────────────┘
```

左栏默认 Tab 是 **说话**（现文案「对话」改为「说话」）。「组件」是逃生舱，不要做成第二个主 Tab 的视觉。

中栏不是铺满的灰画布。纸页是一块 `sheet` 表面：最大宽度 840px，水平居中，外边距 24px，圆角 8px（Ant Design 卡片），阴影用 `boxShadowTertiary`。纸页内部 padding 24px。生成页画在这张纸上，不要再给生成页套一层品牌底。

底栏默认约 200–280px，可拖。打开时也不要用主色。它是源文件抽屉，不是第二舞台。

### Signature

记住这一屏的，应是 **冷灰工坊里的一张白纸**，加上顶栏「言灵」与一枚印。

生成成功时，纸页只做一次 200ms（`motionDurationMid`）的落下：`translateY(6px) → 0`，`opacity 0.72 → 1`。尊重 `prefers-reduced-motion`：关掉位移，只换内容。

不要在纸页上盖水印、不要给对话加打字光标动画、不要用 01 / 02 编号装饰流程。

---

## Ant Design values in this product

| Value | 言灵里怎么落地 |
| --- | --- |
| Natural | 控件用 Ant Design 默认形态。发送、输入、Tab、树、表单都不自造。 |
| Certain | 校验失败时旧纸页不动；说话栏给出原因。发送中纸页不闪半份 JSON。 |
| Meaningful | 主色只给「发送」。顶栏没有第二个 primary。逃生舱不用主色填充。 |
| Growing | 同一套纸页既能画登录表单也能画列表。目录变大时只升版本，不换皮肤。 |

Ant Design 的 Do/Don't 全部适用于纸页。工坊额外遵守：印泥红不是 primary；不要给相邻控件混用 16px 圆角。

---

## Chrome specs

### Header

左：字标「言灵」+ 印。印是 8×8 圆角 2px 的 `seal` 色块，贴在字标右侧 8px，`aria-hidden`。不要写成 Logo 图。

右：动作分组，中间用 16px 空隙，不要用主色。

1. **打开**、**下载**（`Button` default，`size="small"`）。这是源文件动作，放最前。
2. **撤销**、**重做**（disabled 时用 Ant Design 默认 disabled，不自调透明度）。
3. **新建**（default，不是 primary，也不是 danger）。
4. **深色** `Switch`。当前文案「暗色」改为「深色」。Switch 在右，短标签在左。

顶栏背景用 `colorBgContainer`，底边 1px `colorSplit`。不要用主色顶栏。

「新建」会清空页面和说话记录。按钮不要改名成 Reset。危险结果用二次确认：**新建这一页？当前页会清掉。说话也会从头开始。** 确认键用 default 或 primary 二选一，不要两个 primary。建议确认用 primary「新建」，取消用 default「留下」。

### Speech column（左）

Tab：**说话** | **组件**。激活态用 Ant Design Tabs：主色文字 + 2px 下划线，无背景填充。

空状态（无消息时）：

- 标题：**说你想要的那一页**
- 说明：**说完后，中间会换成一页。这一页可以留下、再打开。**
- 三个提示，用 `Prompts` 即可，文案保持产品已有的用户话：
  - 做一个登录表单
  - 做一个设置页
  - 做一个带筛选的列表

不要写「用自然语言生成界面」「AI 助手」「魔法」。

消息：

- 用户：右对齐，Ant Design X `Bubble`。内容就是用户说的话。
- 助手：左对齐。成功只显示一句 `summary`，例如 **已改成带验证码的登录表单。** 失败只显示校验人话，例如 **页面没改。组件 `password` 用了未允许的属性 `placeholder`。**
- 进行中：只显示 **正在写下这一页…**（替换现有「正在生成界面…」）。不要把模型 token 或 JSON 流进气泡。

输入框 placeholder：**描述你想要的界面** 可保留。发送是这一栏唯一的 primary（Sender 自带）。停止沿用 Sender 的取消。

组件 Tab：树、插入、复制、删除保持 Ant Design `Tree` / `Button` `size="small"`。插入区不要做成彩色积木。组件名可保留英文（与协议一致），旁边不要再加图标套件。

### Sheet（中）

外层 `preview-canvas` 铺 `paper`（`colorBgLayout` 工坊值）。

内层纸页：

- 点击选中、悬停描边留在编辑器包装上（已有 `.a2ui-selectable`）。选中 2px `colorPrimary` 实线，悬停 1px 虚线。圆角 4px。
- 描边是工坊工具，不进下载的 JSON。
- 纸页点空白处取消选中（已有）。

空预览（校验后仍无 surface）：Ant Design `Empty`，说明 **没有可预览的页面**。不要插插画。

试填、试点：纸页内控件就是 Ant Design 控件。不要在预览里加「演示模式」黄条。事件只进底栏「事件」。

### Inspector（右）

标题用 `title-md`（14px / 600）：**属性**。未选中时：`Empty`，**点纸页上的一块，或在组件树里选中。**

表单用 Ant Design Form，密度 `small`。不要在右侧放「应用到画布」主按钮——改完即走同一套校验；失败用 `Alert` error，文案与说话栏失败句同一套规则。

### Dock（底）

Tab 文案：

| 现在 | v1.0.0 |
| --- | --- |
| JSON | **JSON**（逃生舱，保留协议名） |
| Data Model | **数据** |
| Events | **事件** |
| Errors | **错误** |

错误条用 `Alert` error，不要只靠红色文字。JSON 校验失败时预览仍显示旧纸页；编辑器里可以留着坏文本（TRD 已定）。

---

## Flows

### 说成一页

1. 用户说或点提示。
2. 说话栏出现「正在写下这一页…」。纸页保持上一版，不闪空。
3. 通过校验：气泡换成一句确认；纸页换新内容并做一次落下。
4. 未通过：气泡换成失败句；纸页完全不动。

### 再改一版

同一说话线程。不要新开「会话卡片」。顶栏「新建」才清空说话。

### 试

在纸页里填、点。结构不变。要改布局，回到说话，或打开逃生舱。

### 带走

**下载** 当前已通过校验的纸页源文件。成功无 toast 也可以；若做反馈，用 `message.success`：**已下载 kotodama.json。**

**打开** 失败：纸页不动，`Alert` 或「错误」Tab 指出原因。不要用浏览器原生 `alert()`。

---

## Copy

从屏幕这边的人出发。动词固定，成功/失败沿用同一词。

| Place | Copy |
| --- | --- |
| 字标 | 言灵 |
| 左 Tab | 说话 / 组件 |
| 欢迎标题 | 说你想要的那一页 |
| 发送中 | 正在写下这一页… |
| 失败句式 | 页面没改。{原因}。 |
| 顶栏 | 打开、下载、撤销、重做、新建、深色 |
| 新建确认 | 新建这一页？当前页会清掉。说话也会从头开始。 / 留下 / 新建 |
| 下载成功 | 已下载 kotodama.json。 |
| 打开失败 | 没有打开。{原因}。 |
| 无预览 | 没有可预览的页面 |
| 未选中 | 点纸页上的一块，或在组件树里选中。 |
| 无事件 | 还没有事件。在纸页上点一下就会出现。 |
| 无错误 | 没有错误。 |

不要道歉。不要「抱歉，AI 出错了」。原因来自校验，指向字段或规则。

---

## Motion

只保留三处，都用 Ant Design duration token：

| Moment | Token | What |
| --- | --- | --- |
| 纸页换稿 | `motionDurationMid` 0.2s，`motionEaseOut` | 落下一次 |
| 控件悬停/焦点 | `motionDurationFast` 0.1s | 交给 Ant Design |
| 底栏 / 分栏拖拽 | 无动画 | 跟手 |

不要加对话入场列表动画、不要给印做呼吸闪烁。

---

## Accessibility

- 焦点环用 Ant Design 默认，不要 `outline: none`。
- 印装饰 `aria-hidden`。字标仍是可读文本「言灵」。
- 「正在写下这一页…」对 `aria-live="polite"` 可见。
- 失败句同样进入 live region。
- 纸页选中不能只靠颜色：已有 2px 描边，保留。
- `prefers-reduced-motion: reduce` 时关掉纸页位移。
- 工坊深色用 `darkAlgorithm`，纸页内层同步算法、仍用默认 seed。不要手工反色。
- 主色与白字对比：Ant Design 已说明 `#1677FF` 上白字可能低于 WCAG AA。v1.0.0 不改 primary；严格无障碍时再通过 `ConfigProvider` 加深 `colorPrimary`，工坊和纸页一起加深，避免两套主色。

---

## Current UI gaps

相对 `src/editor/editor.css` 与 `EditorShell.tsx`：

| Now | Design |
| --- | --- |
| 单层主题，预览跟着工坊走 | 预览内层默认 Ant Design seed |
| 预览铺满 padding 24px | 居中纸页，最大宽度 840px，三级阴影 |
| 顶栏无打开/下载；有「暗色」 | 打开、下载；「深色」 |
| 欢迎「用自然语言生成界面」 | 「说你想要的那一页」 |
| 气泡渲染模型 JSON | 只渲染一句人话 |
| 底栏英文 Data Model / Events / Errors | 数据 / 事件 / 错误 |
| 选中描边已有 | 保留；不要加填充蒙层 |

---

## Do not

- 不要让生成页长出言灵衬线标题或印泥按钮。
- 不要两个 primary 并排（顶栏尤其不要）。
- 不要把 JSON 当作对话内容的一部分来「增强专业感」。
- 不要为工坊发明 Ant Design 预设盘以外的装饰色。印泥只用 `#CF1322` / `#FF4D4F`。
- 不要用魔法数字间距。现有 `.editor-header` 的 48px 和 16px 已在网格上，保留。

实现入口：`EditorApp` 的主题、`EditorShell` 顶栏、`editor.css` 的预览壳、`ChatPanel` 文案与展示。纸页内部组件继续走 `@kotodama/antd-catalog`。
