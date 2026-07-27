# Busabase 技能與外掛

[English](./README.md) | [简体中文](./README.zh-CN.md) | **繁體中文** | [日本語](./README.ja.md)

適用於 [Busabase](https://busabase.com) 的智慧代理技能與外掛。Busabase 是一個審核優先的知識庫：
AI 提出變更，由人工審核，只有獲准的變更才會合併。

兩個技能、四種安裝方式，請選擇你的智慧代理支援的方式。

## 安裝

### `skills`（Claude Code、Cursor、Codex 等，持續更新）

```bash
npx skills add busabase/skills
```

### Claude Code 外掛

```bash
/plugin marketplace add busabase/skills
/plugin install busabase@busabase
```

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

根目錄的 [`.mcp.json`](./.mcp.json) 會為一般 MCP 用戶端設定本機端點。Codex 外掛擁有
獨立的遠端 [MCP 設定](./plugins/busabase/.mcp.json)；該檔案位於外掛目錄中，因此會隨外掛一起封裝。

根目錄的 **busabase** 技能仍是供本機及一般智慧代理安裝方式使用的完整 CLI/curl 指南。
Codex 內建技能刻意採用 MCP 優先方式：它依賴 OAuth 與精選工具目錄，而不是讀取
`~/.busabase/.env`。

若要從頭設定工作區，請先貼上 Busabase 控制台中 **Agent Skills** 按鈕提供的新手引導提示。
它會引導智慧代理完成連線、為第一個 Base 建立初始資料，然後執行上述任一安裝命令。

## 技能

| 技能 | 功能 |
| --- | --- |
| [`busabase`](./skills/busabase/SKILL.md) | 透過 HTTP 操作 Busabase 工作區：列出 Base 和記錄、提出 ChangeRequest，並合併已核准的變更。 |
| [`busabase-app-creator`](./skills/busabase-app-creator/SKILL.md) | 將產品構想轉換為完整的 Busabase 工作區應用程式，使用原生資源、受限資料存取和可審核的 AirApp。 |

## 儲存庫結構

這個儲存庫支援上述所有安裝方式：

```
skills/busabase/SKILL.md              技能（標準版本）——供 `skills`、Claude Code 和 Buda 使用
skills/busabase-app-creator/SKILL.md  Busabase 工作區和 AirApp 建立指南
.claude-plugin/plugin.json            Claude Code 外掛資訊清單（自動探索 ./skills/）
.claude-plugin/marketplace.json       Claude Code 市集清單
.agents/plugins/marketplace.json      Codex 市集清單
plugins/busabase/.codex-plugin/plugin.json   Codex 外掛資訊清單
plugins/busabase/.mcp.json                   Codex 的託管 OAuth MCP 設定
plugins/busabase/skills/busabase/SKILL.md    Codex 要求技能必須位於外掛目錄內
                                             （精選設定檔的 MCP 優先指南）
plugins/busabase/skills/busabase-app-creator/SKILL.md
                                             與 Busabase 相依技能一起封裝的應用程式建立器
plugins/busabase/assets/                     Codex 隨附的圖示及淺色/深色標誌
.mcp.json                             內建 MCP 伺服器（Streamable HTTP）
server.json                           官方 MCP Registry 項目（遠端端點 → busabase.com/api/mcp）
```

> **為什麼需要 Codex 專用的 Busabase 技能？** Codex 只會封裝 `plugins/<name>/` 中的檔案。
> 內建的 `busabase` 技能使用不同的連線約定：它透過託管 OAuth 和 MCP 工具連線，而不是使用
> 本機 shell 設定。`busabase-app-creator` 則原樣與它一起封裝，並將連線、API 和 ChangeRequest
> 行為委派給這個 MCP 優先的相依技能。

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
