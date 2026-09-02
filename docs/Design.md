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
| **工坊** | 顶栏、说话轨、属性抽屉、源文件条 | 言灵种子，见下方 tokens |
| **纸页** | 中间预览里渲染出的界面 | Ant Design 默认 `defaultAlgorithm` / `darkAlgorithm`，不改 `colorPrimary` |

实现：外层 `ConfigProvider`（已有 `XProvider`）负责工坊。预览根节点再包一层 `ConfigProvider`，只传 Ant Design 默认算法和默认 seed，把工坊的 `colorPrimary` 隔开。

这样生成页在任何时候都长得像普通 Ant Design 后台，而不是「言灵皮肤的页面」。稳定来自目录和协议，观感来自 Ant Design 默认主题。

---

## Token plan

### Why this, not a template

不用暖奶油底 + 衬线标题 + 陶土强调（常见 AI 落地页）。不用近黑底 + 霓虹强调（常见 AI 控制台）。不用报纸细线通栏（常见「编辑感」模板）。不用青绿主色 + 大 Hero（常见 SaaS 营销页）。也不要用三栏 IDE 默认皮：等权按钮、大卡片提示、灰画布上漂一块白卡片。

言灵的材料是墨、纸、印。工坊是一张**书桌**：左边订着说话用的笔记本，中间落下这一页。唯一的色风险是字标旁的印泥，不用作按钮色。

### Color

工坊只改最小种子，其余交给 Ant Design 算法推导。

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `ink` | `#1F1F1F` | `rgba(255,255,255,0.88)` | 主文字。等同 Ant Design `on-surface` |
| `mist` | `#595959` | `rgba(255,255,255,0.65)` | 次要文字 |
| `paper` | `#E6EAEF` | `#121212` | 书桌。比 Ant Design `#F5F5F5` 更深更冷，让白纸页坐上去 |
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

4px 网格。间距只用 Ant Design 的 xs/sm/md/lg/xl（4 / 8 / 16 / 24 / 32 / 48）。顶栏高度 48px。整屏用 `100dvh`，并加 `env(safe-area-inset-*)`。

结构是书桌，不是 IDE。左边是订死的笔记本，中间是桌面，纸页落在桌心。属性和源文件是抽屉，默认不占桌面。

```
┌─ 书桌 ──────────────────────────────────────────────┐
│ 印 言灵          打开 下载 │ 撤销 重做 新建 │ 深色   │
├────────────┬────────────────────────────────────────┤
│ 笔记本     │  书桌（paper）                         │
│ 264px      │                                        │
│ 说话 / 组件│            ┌──纸页──┐                  │
│ 标题顶对齐 │            │  AntD  │                  │
│ 提示是行   │            └────────┘                  │
│ 输入贴底   │     选中：右侧抽屉「属性」              │
├────────────┴────────────────────────────────────────┤
│ 排字抽屉 40px：JSON · 数据 · 事件 · 错误  （默认收） │
└─────────────────────────────────────────────────────┘
```

区域职责：

| 区 | 宽度 / 高度 | 默认 | 角色 |
| --- | --- | --- | --- |
| 笔记本 | 264px，可拖 240–320 | 打开 | 白底，右边 1px `rule`。Tab **说话** 默认 |
| 书桌 | `minmax(0, 1fr)` | 打开 | 唯一 `<main>`。纸页在桌心（短页垂直居中） |
| 属性 | 抽屉 280px，无遮罩 | **关上** | 选中才滑出；覆盖，不挤桌 |
| 排字抽屉 | 收 40px / 开 200px | **收起** | 与书桌同色；展开后编辑器在内凹井里 |

纸页：最大宽度 840px，圆角 4px（纸，不是胖卡片），1px `rule`，阴影用两层（贴桌的 1px 边 + 16px 落影）。内边距 24px。生成页画在这张纸上，不要再套工坊底。

分栏拖拽条做成 1px `rule`，不要宽槽。

z-index 只用四档：`skip` 50 · `header` 20 · `drawer` 30 · `dock` 20。

持久化只记笔记本宽度、排字抽屉是否展开、展开高度。

### Signature

记住这一屏的，应是 **冷灰书桌上的一张白纸**，加上顶栏左侧的印与「言灵」。

生成成功时，纸页只做一次 200ms 落下：`translateY(8px) → 0`，`opacity 0.7 → 1`。尊重 `prefers-reduced-motion`：关掉位移，只换内容。

不要机器人头像、不要大提示卡片、不要给印做呼吸、不要 01 / 02 编号。

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

键盘用户第一个焦点是 **跳到纸页**（链到 `#sheet`）。未聚焦时视觉隐藏，聚焦时出现在顶栏上方。不要把它做成第三个主按钮。

### Header

顶栏与笔记本同色（`sheet` / `colorBgContainer`），底边 1px `rule`。不要用主色顶栏。

左：印在字前。印是 4×16 圆角 1px 的竖章，`seal` 色，`aria-hidden`。字标「言灵」是 `<h1>`，18px / 600 / 衬线 / 字距 0.16em，`translate="no"`。不要写成 Logo 图。

右：动作是 `Button type="text" size="small"`，不要描边按钮。三组之间用 `Divider` 竖线：

1. **打开**、**下载**
2. **撤销**、**重做**、**新建**
3. **深色** `Switch`（短标签在左）。`aria-label="深色"`。隐藏 file input：`aria-label="打开 JSON"`。

「新建」二次确认不变：**新建这一页？当前页会清掉。说话也会从头开始。** 确认「新建」，取消「留下」。

### Speech column（笔记本）

白底。Tab：**说话** | **组件**。激活态：主色文字 + 2px 下划线，无填充。内容**顶对齐**，不要在空栏里垂直居中。

空状态：

- 标题 `<h2>`：**说你想要的那一页**（16px / 600）
- 说明：**说完后，中间会换成一页。这一页可以留下、再打开。**
- 小标题：**可以说**
- 三个提示做成**一行一条**，不要大卡片。仍用 `Prompts`，用样式压成列表。文案：
  - 做一个登录表单
  - 做一个设置页
  - 做一个带筛选的列表

不要机器人 / 用户头像。不要写「AI 助手」「魔法」。

消息：用户右对齐、助手左对齐，Ant Design X `Bubble`，无头像。成功只显示 `summary`。失败只显示校验人话。进行中：**正在写下这一页…**

输入贴在笔记本底：上沿 1px `rule`。placeholder：**描述你想要的界面…**。发送是这一栏唯一的 primary。

组件 Tab：`Tree` / `Button` `size="small"`。插入区不要彩色积木。

### Sheet（书桌）

外层 `preview-canvas` 是 `<main id="sheet">`，铺 `paper`。短页时纸页垂直居中；长页从上往下滚。外边距 48px / 32px。`scroll-margin-top` 给跳转链留顶栏。

内层纸页：圆角 4px，1px `rule`，两层落影。选中 2px `colorPrimary` 实线，悬停 1px 虚线，圆角 4px。描边不进 JSON。点空白取消选中。

空预览：`Empty`，**没有可预览的页面**。不要插画。

### Inspector（抽屉）

Ant Design `Drawer` 右 280px，无遮罩，挂在书桌里。标题 **属性**。关闭 = 取消选中。

### Dock（排字抽屉）

与书桌同色。默认 40px 一条。点 Tab 展开到 200px（可拖，最小 160）。展开后编辑器放在内凹井里（`sheet` 底 + 1px `rule` + 圆角 4px），不要留一块空白。右上 **收起**。JSON 缓冲收起时仍保留。

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
| 跳过 | 跳到纸页 |
| 左 Tab | 说话 / 组件 |
| 欢迎标题 | 说你想要的那一页 |
| 提示小标题 | 可以说 |
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
| 源文件条 | 收起 |

不要道歉。不要「抱歉，AI 出错了」。原因来自校验，指向字段或规则。

---

## Motion

只保留三处，都用 Ant Design duration token：

| Moment | Token | What |
| --- | --- | --- |
| 纸页换稿 | `motionDurationMid` 0.2s，`motionEaseOut` | 落下一次（8px） |
| 控件悬停/焦点 | `motionDurationFast` 0.1s | 交给 Ant Design |
| 底栏 / 分栏拖拽 | 无动画 | 跟手 |
| 属性抽屉 | Ant Design Drawer 默认（只动 transform） | 选中滑出；`prefers-reduced-motion` 时交给组件默认减弱 |

不要加对话入场列表动画、不要给印做呼吸闪烁。

---

## Accessibility

- 焦点环用 Ant Design 默认，不要 `outline: none`。
- 印装饰 `aria-hidden`。字标仍是可读文本「言灵」，且是页面唯一的 `<h1>`。
- 第一个可聚焦控件是跳过链 **跳到纸页**。
- 「正在写下这一页…」对 `aria-live="polite"` 可见。
- 失败句同样进入 live region。
- 纸页选中不能只靠颜色：已有 2px 描边，保留。
- `prefers-reduced-motion: reduce` 时关掉纸页位移。
- 工坊深色用 `darkAlgorithm`，纸页内层同步算法、仍用默认 seed。不要手工反色。根节点设 `color-scheme`，让滚动条和系统控件跟主题走。
- 工坊根：`touch-action: manipulation`。说话轨、属性抽屉、源文件条：`overscroll-behavior: contain`。
- 主色与白字对比：Ant Design 已说明 `#1677FF` 上白字可能低于 WCAG AA。v1.0.0 不改 primary；严格无障碍时再通过 `ConfigProvider` 加深 `colorPrimary`，工坊和纸页一起加深，避免两套主色。

---

## Current UI gaps

已按书桌结构改 chrome。仍不要做的：

| Don't | Why |
| --- | --- |
| 给生成页套工坊衬线或印泥 | 两套表面必须分开 |
| 属性未选中时占一列 | 会挤纸页 |
| 源文件条默认展开 | 逃生舱不应和主路径抢高度 |
| 说话栏用机器人头像或大提示卡片 | 会变成聊天皮肤 |

---

## Do not

- 不要让生成页长出言灵衬线标题或印泥按钮。
- 不要两个 primary 并排（顶栏尤其不要）。
- 不要把 JSON 当作对话内容的一部分来「增强专业感」。
- 不要为工坊发明 Ant Design 预设盘以外的装饰色。印泥只用 `#CF1322` / `#FF4D4F`。
- 不要用魔法数字间距。现有 `.editor-header` 的 48px 和 16px 已在网格上，保留。

实现入口：`EditorApp` 的主题与 `color-scheme`、`EditorShell` 布局、`editor.css` 的工坊壳、`Inspector` 抽屉、`BottomDock` 收起、`ChatPanel` 文案与展示。纸页内部组件继续走 `@kotodama/antd-catalog`。
