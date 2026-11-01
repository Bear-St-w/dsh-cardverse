# dsh-cardverse · CardVerse 卡片宇宙

> DeepSeek Harness（DSH）界面插件：把 DSH 的对话页变成可视化卡片工作区。
> 原作者：**Bear-St-w**

## 功能

- **卡片视图 Tab**：在 DSH 的「对话 / 轨迹」旁新增第三个视图 Tab「卡片」，点开即液态玻璃卡片宇宙。
- **首卡·群发大厅**：锁死在第一位。对接外部「悬赏/任务板」HTTP API（可选，需配置环境变量，详见下文）；大厅内置群聊消息流（300 条滚动，持久化），输入一句话群发到所有绑定了会话的工作区卡片。
- **工作区卡片**：每卡一个真实工作目录 + 一个绑定模型；卡内展示该工作区会话的实时轨迹（模型文本 + 工具调用）；文件浏览器（列目录 / 进子目录 / 文本预览）；会话下拉选择；模型 + 推理档位（Off/Low/High/Max）二级下拉选择。
- **自由摆放**：卡片绝对定位，拖标题栏到哪放哪；停止拖动 3 秒后批量保存全部卡片位置。
- **主题**：极光 / 翡翠 / 日落 / 兰花 / 海洋 / 玫瑰，色相切换，玻璃质感不变。
- **轨迹存档**：对话轨迹自动写入 HTML 分片（单片 10MB，9.4MB 滚动下一片），页面 `http://127.0.0.1:5002`。
- **AI 感知**：注册 `cards_list`（列出卡片）/ `cards_read`（读卡片轨迹与群聊）/ `card_post`（发消息进卡片，发大厅自动上群聊墙）三个 agent 工具，DSH 内所有会话原生可见。
- **微信镜像**：每轮模型回复完成后自动转发一份到微信（走 `dsh-wechat-send` 官方 CLI，自带窗口计数与排队）。
- **热更新**：配合 DSH 的 hmr（profile 补丁里 `root: ["<插件目录>"]`）实现免重启热加载；内置实例接管协议——新实例写旗标、旧实例 1.5 秒内自动退位，路由与端口零秒交接。

## 文件

| 文件 | 作用 |
|---|---|
| `index.js` | Host 半身：路由（`/.cardverse/*` 16 条）、agent 工具、轨迹分片、5002 静态服务、悬赏轮询、微信镜像、实例接管协议 |
| `client.js` | 浏览器半身：卡片宇宙 UI（React，经 `conversation.view` slot 注册为第三个 Tab） |
| `cordis.patch.yml` | 插件挂载声明 |
| `package.json` | 包声明（`dsh.client` 指定浏览器半身） |

## 安装

```sh
dsh plugin --profile desktop add /path/to/dsh-cardverse-plugin
```

或手工：在 profile 的 `package.json` 加 `"dsh-cardverse": "file:/path/to/dsh-cardverse-plugin"`，并把 `dsh-cardverse` 追加进 `dsh.profile.bundles`，重装依赖后重启 DSH。

## 配置

- 状态文件：`~/.dsh/dsh-cardverse/state.json`（卡片位置 / 主题 / 会话与模型绑定 / 群聊记录）。
- 日志：`~/.dsh/dsh-cardverse/boot.log`。
- 环境变量：
  - `DSH_HOME`：DSH 主目录。
  - `DSH_CARDVERSE_TRAIL_PORT`：轨迹页端口，默认 `5002`。
  - `DSH_CARDVERSE_WORKBENCH`：外部任务板（悬赏）服务地址。**不配置则悬赏功能整体禁用**，其余功能不受影响。
  - `DSH_CARDVERSE_BOUNTY_PATH`：悬赏查询路径，默认 `/api/bounty`。
  - `DSH_CARDVERSE_GRAB_PATH`：抢单提交路径，默认 `/bounty/grab`。
  - `DSH_CARDVERSE_GRAB_WHO`：抢单署名，默认 `agent`。
- 工作区卡片默认绑定进程工作目录（`.`），在卡片界面或 state.json 中改为任意目录。

## HTTP 路由（前缀 `/.cardverse`）

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | /state | 卡片全量状态 |
| POST | /theme | 切主题 |
| POST | /move | 卡片摆放（单卡 x/y/w/h 或批量 positions） |
| POST | /bind | 换模型（provider+model+label+effort） |
| POST | /title | 改卡片名 |
| POST | /session | 会话 list / use / drop |
| GET+POST | /hall | 群聊读 / 写 |
| POST | /broadcast | 群发（入群聊记录 + 真派发） |
| POST | /post | 单卡发消息 |
| POST | /trail | 轨迹上报（写 HTML 分片） |
| GET | /models | 模型目录（含推理档位） |
| GET | /bounty | 悬赏代理 |
| POST | /bounty/grab | 代配置身份抢单（需配置外部任务板） |
| GET | /events | SSE 事件流 |
| GET | /files | 列工作区目录 |
| GET | /file | 读工作区文件（256KB 截断） |

## 版本

- 0.8.3 · 2026-10-25

## License

MIT © Bear-St-w
