# Kotodama 言灵

> [!CAUTION]
> **已废弃，不再继续开发。**
>
> 停在「复杂函数」这一关上：A2UI 基础目录的 Function 只能在渲染器本地做校验、比较、格式化和 `openUrl`；本产品里按钮动作只记入事件日志，不回传模型，也不调用真实业务接口。远端注册、Agent Tool、需要后端的调用，都不在这套协议和产品边界里，无法靠扩目录或改工坊解决。

言灵曾经是一个 A2UI v0.9 工作室：用自然语言生成一份可校验的界面 JSON，再用 Ant Design 把同一份 JSON 画成一页。源文件是 A2UI 消息数组，不是 React 树，也不是 antd 组件配置。

静态站点在 [clawd-cook.github.io/kotodama](https://clawd-cook.github.io/kotodama/)。不要把它当现行产品。

## 做过什么

打开 `/` 就是工坊：左边说话，中间预览，右边源文件。模型只改 JSON；渲染器只画基础目录里允许的组件。同一份 JSON，打开多少次都一样。校验不过，当前页保持原样。

四个房间：

| 路径 | 房间 | 做什么 |
| --- | --- | --- |
| `/` | 开始创建 | 对话生成页面；预览、树、属性、JSON、撤销 |
| `/catalog/:component` | 基础组件 | 18 个基础组件的只读图鉴：预览、JSON、属性名 |
| `/examples/:id` | 精选案例 | 登录表单、设置页、带筛选的列表；可「用这一页」装进工坊 |
| `/settings` | 设置 | 在浏览器里填 Base URL、API Key、模型名，覆盖进程环境变量 |

工坊还支持打开 / 下载 `kotodama.json`、本地草稿、深色模式。预览可以改本地 `dataModel`、记下 `action`。

产品说明、实现边界和验收用例仍在 `docs/PRD.md`、`docs/TRD.md`、`docs/Design.md`、`docs/TEST.md`。那些文档记录的是当时的范围，不是后续路线。

## 为什么废弃

A2UI 把「画什么」和「真正干什么」拆开：

- **Catalog Function** 在客户端执行。基础目录里是算术、比较、字符串判断、校验（`required` / `regex` / `email` 等）、格式化和 `openUrl`。
- **业务函数** 不在 A2UI 里。协议只约定按钮发什么 `event`、带什么 `context`；真正的查询、提交、落库要由 Agent / 后端 Tool 处理，再发新的 UI 消息。

言灵停在第一层。校验白名单、对话提示词、预览事件日志都按「只生成稳定的一页」来做，没有把动作送回模型，也没有接真实接口（见 [`docs/PRD.md`](docs/PRD.md) 第 8 节）。复杂函数既不能写进 Catalog Function，也不能在本仓库里注册给 Agent 调用，所以这条路走不通。

## 仓库结构

```text
src/                    工作室与工坊
  editor/               Snapshot、校验、对话、预览
  pages/                工坊、图鉴、案例、设置
  studio/               对话通道（界面覆盖环境变量）
packages/antd-catalog   Ant Design 实现的 A2UI 基础目录
server/chat-proxy.ts    开发时转发 OpenAI 兼容的 /v1/chat/completions
docs/                   当时的 PRD / TRD / Design / TEST
```

协议版本固定为 A2UI v0.9。`catalogId` 为：

```text
https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json
```

允许的组件：Column、Row、List、Card、Tabs、Modal、Divider、Text、Image、Icon、Video、AudioPlayer、Button、TextField、CheckBox、ChoicePicker、Slider、DateTimeInput。

## 本地查阅

需要 Node.js 和 [pnpm](https://pnpm.io/)。不要用这个仓库做新功能。

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`.env` 里的 `OPENAI_BASE_URL`、`OPENAI_API_KEY`、`OPENAI_MODEL` 给对话通道用。设置页里填的三项只存在这台浏览器，会覆盖环境变量。空着则用环境变量。三项都空时，说话入口不可用。

```bash
pnpm test          # 全部测试
pnpm test:unit
pnpm test:snapshot
pnpm test:e2e
pnpm build
```

`pnpm build` 的静态资源基路径是 `/kotodama/`，对应 GitHub Pages 项目站点。
