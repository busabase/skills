# Busabase 技能與外掛

[English](./README.md) | [简体中文](./README.zh-CN.md) | **繁體中文** | [日本語](./README.ja.md)

適用於 [Busabase](https://busabase.com) 的智慧代理技能與外掛。Busabase 是一個審核優先的知識庫：
AI 提出變更，由人工審核，只有獲准的變更才會合併。

兩個技能、五種安裝方式，請選擇你的智慧代理支援的方式。

## 安裝

### `skills`（Claude Code、Cursor、Codex 等，持續更新）

```bash
npx skills add busabase/skills
```

### Agent Plugins v1（可攜式外掛套件）

儲存庫根目錄遵循 [Agent Plugins Specification v1.0.0](https://agent-plugins.org/)：
`plugin.json` 是可攜式資訊清單，`skills/` 包含 Agent Skills，`mcp.json` 使用標準格式宣告
託管的 Streamable HTTP MCP 服務。任何支援 Agent Plugins 格式的用戶端都可以安裝或載入
此儲存庫根目錄。

Agent Plugins v1 將 OAuth 與憑證管理交給用戶端。現有 Claude Code 與 Codex 外掛仍保留各自的
瀏覽器 OAuth 行為。相容性對照與驗證方式請參閱
[`docs/agent-plugins.md`](./docs/agent-plugins.md)。

### Claude Code 外掛

```bash
claude plugin marketplace add https://github.com/busabase/skills.git
claude plugin install busabase@busabase
claude mcp login plugin:busabase:busabase
```

Claude Code 外掛透過瀏覽器 OAuth 連線到 `https://busabase.com/api/mcp`，內建伺服器名稱為
`plugin:busabase:busabase`。安裝與登入後請開始新的對話。完整流程請參閱
[`docs/claude-code-install.md`](./docs/claude-code-install.md)。

### Codex 外掛

```bash
codex plugin marketplace add busabase/skills
codex plugin add busabase@busabase
codex mcp login busabase
```

Codex 外掛會連線到 `https://busabase.com/api/mcp`，開啟標準的瀏覽器 OAuth
流程，並提供精選的 22 項工具目錄。無需設定 API 金鑰。

外掛安裝與 MCP 授權是兩個獨立的狀態。瀏覽器顯示 `Authentication complete` 後，
請先確認已儲存的連線，再開始 Busabase 任務：

```bash
codex mcp list
```

`busabase` 所在列的 `Auth` 應顯示為 `OAuth`。如果仍顯示 `Not logged in`，請再次執行
`codex mcp login busabase`，並在該命令仍在執行時，於新開啟的瀏覽器分頁中完成授權。
登入成功後，請開始新的 Codex 任務，讓該任務載入已驗證的工具目錄。

### MCP（任何支援 MCP 的智慧代理）

將智慧代理指向你的工作區 Streamable HTTP 端點：

- 桌面端/本機：`http://localhost:15419/api/mcp`（無需驗證）
- 雲端：`https://busabase.com/api/mcp`（傳送 `Authorization: Bearer $BUSABASE_API_KEY`）

Codex 可以透過標準 OAuth 直接使用完整的雲端 MCP 功能：

```bash
codex mcp add busabase --url https://busabase.com/api/mcp
codex mcp login busabase
```

可攜式根目錄 [`mcp.json`](./mcp.json) 使用 Agent Plugins v1 格式宣告託管端點。原有根目錄
[`.mcp.json`](./.mcp.json) 繼續為一般 MCP 用戶端設定本機端點。Claude 套件使用獨立的
託管 OAuth [MCP 設定](./claude/.mcp.json)；Codex 外掛使用另一份遠端
[MCP 設定](./plugins/busabase/.mcp.json)。

根目錄的 **busabase** 技能仍是供本機及一般智慧代理安裝方式使用的完整 CLI/curl 指南。
Claude 與 Codex 內建技能都採用 MCP 優先方式：它們依賴 OAuth 與精選工具目錄，而不是讀取
`~/.busabase/.env`。

若要從頭設定工作區，請先貼上 Busabase 控制台中 **Agent Skills** 按鈕提供的新手引導提示。
它會引導智慧代理完成連線、為第一個 Base 建立初始資料，然後執行上述任一安裝命令。

## 技能

| 技能 | 功能 |
| --- | --- |
| [`busabase`](./skills/busabase/SKILL.md) | 透過 HTTP 操作 Busabase 工作區：列出 Base 和記錄、提出 ChangeRequest，並合併已核准的變更。 |
| [`busabase-app-creator`](./skills/busabase-app-creator/SKILL.md) | 將產品構想轉換為完整的 Busabase 工作區應用程式，使用原生資源、受限資料存取和可審核的 AirApp。 |
| [`busa-email`](./skills/busa-email/SKILL.md) | 可安裝的**範本**：收件審批台，安裝後即帶資料表、AirApp 與這份手冊，Agent 拿到工作區就知道如何使用。 |

## 儲存庫結構

這個儲存庫支援上述所有安裝方式：

```
plugin.json                           Agent Plugins v1 可攜式資訊清單
mcp.json                              Agent Plugins v1 託管 MCP 設定
skills/busabase/SKILL.md              供本機及一般智慧代理使用的標準技能
skills/busabase-app-creator/SKILL.md  Busabase 工作區和 AirApp 建立指南
.claude-plugin/marketplace.json       Claude Code 市集清單
claude/.claude-plugin/plugin.json     Claude Code 外掛清單
claude/.mcp.json                      Claude Code 的託管 OAuth MCP 設定
claude/skills/busabase/SKILL.md       Claude 專用 MCP 優先連線指南
claude/skills/busabase-app-creator/   指向共用應用建立技能的符號連結
.agents/plugins/marketplace.json      Codex 市集清單
plugins/busabase/.codex-plugin/plugin.json   Codex 外掛資訊清單
plugins/busabase/.mcp.json                   Codex 的託管 OAuth MCP 設定
plugins/busabase/skills/busabase/SKILL.md    Codex 要求技能必須位於外掛目錄內
                                             （精選設定檔的 MCP 優先指南）
plugins/busabase/skills/busabase-app-creator/SKILL.md
                                             與 Busabase 相依技能一起封裝的應用程式建立器
plugins/busabase/assets/                     Codex 隨附的圖示及淺色/深色標誌
.mcp.json                             原有/一般用戶端本機 MCP 設定
server.json                           官方 MCP Registry 項目（遠端端點 → busabase.com/api/mcp）
scripts/validate-agent-plugin.mjs     可攜式格式與用戶端外掛相容性驗證
```

> **為什麼需要主機專用技能？** Claude Code 將伺服器命名為 `plugin:busabase:busabase`，Codex
> 使用 `busabase`；兩者都使用託管 OAuth，而不是本機 shell 設定。共用應用建立器會將連線行為
> 委派給對應主機的 MCP 優先技能。

## 發佈到 OpenAI Plugin Directory

OpenAI Plugin Directory 和 MCP Registry 是兩個獨立的發佈管道。有關平台提交、網域驗證、
審核人員存取權、測試提示和正式環境冒煙測試，請參閱
[`docs/openai-plugin-submission.md`](./docs/openai-plugin-submission.md)。

## 發佈到官方 MCP Registry

```bash
brew install mcp-publisher                       # 或從 Registry 的 releases 下載二進位檔
mcp-publisher login dns --domain busabase.com --private-key <KEY>   # 驗證 com.busabase/* 命名空間
mcp-publisher publish                            # 發佈 server.json——立即生效，無需審核
```

只有在發佈 MCP Registry 更新時才遞增 `server.json` 中的 `version`。發佈 GitHub 市集版本時，
請另外遞增 Codex 外掛資訊清單中的版本號。
