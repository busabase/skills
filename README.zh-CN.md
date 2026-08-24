# Busabase 技能与插件

[English](./README.md) | **简体中文** | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja.md)

适用于 [Busabase](https://busabase.com) 的智能体技能和插件。Busabase 是一个审批优先的知识库：
AI 提出变更，由人工审核，只有获批的变更才会被合并。

两个技能，五种安装方式，请选择你的智能体支持的方式。

## 安装

### `skills`（Claude Code、Cursor、Codex 等，持续更新）

```bash
npx skills add busabase/skills
```

### Agent Plugins v1（可移植插件包）

仓库根目录遵循 [Agent Plugins Specification v1.0.0](https://agent-plugins.org/)：
`plugin.json` 是可移植清单，`skills/` 包含 Agent Skills，`mcp.json` 使用标准格式声明
托管的 Streamable HTTP MCP 服务。任何支持 Agent Plugins 格式的客户端都可以安装或加载
此仓库根目录。

Agent Plugins v1 将 OAuth 和凭据管理交给客户端。现有 Claude Code 与 Codex 插件仍保留各自的
浏览器 OAuth 行为。兼容性映射与验证方式请参阅
[`docs/agent-plugins.md`](./docs/agent-plugins.md)。

### Claude Code 插件

```bash
claude plugin marketplace add https://github.com/busabase/skills.git
claude plugin install busabase@busabase
claude mcp login plugin:busabase:busabase
```

Claude Code 插件通过浏览器 OAuth 连接 `https://busabase.com/api/mcp`，内置服务器名称为
`plugin:busabase:busabase`。安装和登录后请开始新会话。完整流程请参阅
[`docs/claude-code-install.md`](./docs/claude-code-install.md)。

### Codex 插件

```bash
codex plugin marketplace add busabase/skills
codex plugin add busabase@busabase
codex mcp login busabase
```

Codex 插件会连接到 `https://busabase.com/api/mcp`，打开标准的浏览器 OAuth
流程，并提供一个包含 22 个工具的精简目录。无需配置 API 密钥。

插件安装与 MCP 授权是两个独立的状态。浏览器显示 `Authentication complete` 后，
请先验证已保存的连接，再开始 Busabase 任务：

```bash
codex mcp list
```

`busabase` 所在行的 `Auth` 应显示为 `OAuth`。如果仍显示 `Not logged in`，请再次运行
`codex mcp login busabase`，并在该命令仍在运行时，在新打开的浏览器标签页中完成授权。
登录成功后，请开始一个新的 Codex 任务，以便该任务加载已经过身份验证的工具目录。

### MCP（任何支持 MCP 的智能体）

将智能体指向你的工作区的 Streamable HTTP 端点：

- 桌面端/本地：`http://localhost:15419/api/mcp`（无需身份验证）
- 云端：`https://busabase.com/api/mcp`（发送 `Authorization: Bearer $BUSABASE_API_KEY`）

Codex 可以通过标准 OAuth 直接使用完整的云端 MCP 功能：

```bash
codex mcp add busabase --url https://busabase.com/api/mcp
codex mcp login busabase
```

可移植根目录 [`mcp.json`](./mcp.json) 使用 Agent Plugins v1 格式声明托管端点。原有根目录
[`.mcp.json`](./.mcp.json) 继续为通用 MCP 客户端配置本地端点。Claude 包使用独立的
托管 OAuth [MCP 配置](./claude/.mcp.json)；Codex 插件使用另一份远程
[MCP 配置](./plugins/busabase/.mcp.json)。

根目录下的 **busabase** 技能仍然是面向本地及通用智能体安装方式的完整 CLI/curl 指南。
Claude 和 Codex 内置技能都采用 MCP 优先方式：它们依赖 OAuth 和精选工具目录，而不是读取
`~/.busabase/.env`。

如需从头设置工作区，请先粘贴 Busabase 控制面板中 **Agent Skills** 按钮提供的新手引导提示词。
它会指导智能体完成连接、为第一个 Base 填充初始数据，然后运行上述任一安装命令。

## 技能

| 技能 | 功能 |
| --- | --- |
| [`busabase`](./skills/busabase/SKILL.md) | 通过 HTTP 操作 Busabase 工作区：列出 Base 和记录、提出 ChangeRequest，并合并已获批准的变更。 |
| [`busabase-app-creator`](./skills/busabase-app-creator/SKILL.md) | 将产品构想转化为完整的 Busabase 工作区应用，使用原生资源、受限数据访问和可审核的 AirApp。 |


> **在找可安装的模板？** 完整的应用——数据表、AirApp，以及 Agent 会读的操作手册——在
> [busabase/templates](https://github.com/busabase/templates)。分开放是为了让安装这两个
> skill 的人，不必连带下载每个模板的源码和截图。

## 仓库结构

这一个仓库支持上述所有安装方式：

```
plugin.json                           Agent Plugins v1 可移植清单
mcp.json                              Agent Plugins v1 托管 MCP 配置
skills/busabase/SKILL.md              面向本地及通用智能体的规范技能
skills/busabase-app-creator/SKILL.md  Busabase 工作区和 AirApp 创建指南
.claude-plugin/marketplace.json       Claude Code 市场列表
claude/.claude-plugin/plugin.json     Claude Code 插件清单
claude/.mcp.json                      Claude Code 的托管 OAuth MCP 配置
claude/skills/busabase/SKILL.md       Claude 专用 MCP 优先连接指南
claude/skills/busabase-app-creator/   指向共享应用创建器技能的符号链接
.agents/plugins/marketplace.json      Codex 市场列表
plugins/busabase/.codex-plugin/plugin.json   Codex 插件清单
plugins/busabase/.mcp.json                   Codex 的托管 OAuth MCP 配置
plugins/busabase/skills/busabase/SKILL.md    Codex 要求技能必须位于插件目录内
                                             （针对精选配置的 MCP 优先指南）
plugins/busabase/skills/busabase-app-creator/SKILL.md
                                             与 Busabase 依赖一起打包的应用创建器
plugins/busabase/assets/                     Codex 随附的图标及浅色/深色徽标
.mcp.json                             原有/通用客户端本地 MCP 配置
server.json                           官方 MCP Registry 条目（远程端点 → busabase.com/api/mcp）
scripts/validate-agent-plugin.mjs     可移植格式与客户端插件兼容性校验
```

> **为什么需要主机专用技能？** Claude Code 将服务器命名为 `plugin:busabase:busabase`，Codex
> 使用 `busabase`；两者都使用托管 OAuth，而不是本地 shell 配置。共享应用创建器会把连接行为
> 委托给对应主机的 MCP 优先技能。

## 发布到 OpenAI Plugin Directory

OpenAI Plugin Directory 和 MCP Registry 是两个独立的发布渠道。有关平台提交、域名验证、
审核人员访问权限、测试提示词和生产环境冒烟测试，请参阅
[`docs/openai-plugin-submission.md`](./docs/openai-plugin-submission.md)。

## 发布到官方 MCP Registry

```bash
brew install mcp-publisher                       # 或从 Registry 的 releases 下载二进制文件
mcp-publisher login dns --domain busabase.com --private-key <KEY>   # 验证 com.busabase/* 命名空间
mcp-publisher publish                            # 发布 server.json——立即生效，无需审核
```

仅在发布 MCP Registry 更新时才递增 `server.json` 中的 `version`。GitHub 市场版本发布时，
请单独递增 Codex 插件清单中的版本号。
