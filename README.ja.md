# Busabase スキルとプラグイン

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | **日本語**

[Busabase](https://busabase.com) 向けのエージェントスキルとプラグインです。Busabase は承認を
優先するナレッジベースで、AI が変更を提案し、人間がレビューし、承認された変更だけが
マージされます。

2 つのスキルを 5 通りの方法でインストールできます。エージェントが対応する方法を選んでください。

## インストール

### `skills`（Claude Code、Cursor、Codex など、継続的に更新）

```bash
npx skills add busabase/skills
```

### Agent Plugins v1（ポータブルパッケージ）

リポジトリのルートは [Agent Plugins Specification v1.0.0](https://agent-plugins.org/) に準拠します。
`plugin.json` はポータブルマニフェスト、`skills/` は Agent Skills、`mcp.json` はホスト型
Streamable HTTP MCP サーバーの標準設定です。Agent Plugins 形式をサポートするクライアントは、
このリポジトリのルートをインストールまたは読み込めます。

Agent Plugins v1 では OAuth と認証情報の管理はクライアント側の責任です。既存の Claude Code と
Codex パッケージは、それぞれ専用のブラウザー OAuth 動作を維持します。互換性対応表と検証方法は
[`docs/agent-plugins.md`](./docs/agent-plugins.md) を参照してください。

### Claude Code プラグイン

```bash
claude plugin marketplace add https://github.com/busabase/skills.git
claude plugin install busabase@busabase
claude mcp login plugin:busabase:busabase
```

Claude Code プラグインはブラウザー OAuth で `https://busabase.com/api/mcp` に接続し、同梱
サーバーは `plugin:busabase:busabase` として名前空間化されます。インストールとログイン後は
新しい会話を開始してください。完全な手順は
[`docs/claude-code-install.md`](./docs/claude-code-install.md) を参照してください。

### Codex プラグイン

```bash
codex plugin marketplace add busabase/skills
codex plugin add busabase@busabase
codex mcp login busabase
```

Codex プラグインは `https://busabase.com/api/mcp` に接続し、標準のブラウザー OAuth
フローを開始して、厳選された 22 個のツールカタログを提供します。API キーの設定は不要です。

プラグインのインストールと MCP の認証は別々の状態です。ブラウザーに
`Authentication complete` と表示されたら、Busabase タスクを始める前に保存済みの接続を
確認してください。

```bash
codex mcp list
```

`busabase` の行の `Auth` は `OAuth` と表示される必要があります。まだ `Not logged in`
と表示される場合は、`codex mcp login busabase` をもう一度実行し、そのコマンドが動作している
間に新しく開いたブラウザータブで認証を完了してください。ログインに成功したら、新しい Codex
タスクを開始して、認証済みのツールカタログを読み込ませてください。

### MCP（MCP 対応の任意のエージェント）

エージェントをワークスペースの Streamable HTTP エンドポイントに接続します。

- デスクトップ/ローカル：`http://localhost:15419/api/mcp`（認証不要）
- クラウド：`https://busabase.com/api/mcp`（`Authorization: Bearer $BUSABASE_API_KEY` を送信）

Codex は標準 OAuth を使って、クラウド MCP の全機能を直接利用できます。

```bash
codex mcp add busabase --url https://busabase.com/api/mcp
codex mcp login busabase
```

ポータブルなルート [`mcp.json`](./mcp.json) は Agent Plugins v1 形式でホスト型エンドポイントを
宣言します。従来のルート [`.mcp.json`](./.mcp.json) は、一般的な MCP クライアント向けにローカル
エンドポイントを設定します。Claude パッケージは専用のホスト型 OAuth
[MCP 設定](./claude/.mcp.json) を使用し、Codex プラグインは別のリモート
[MCP 設定](./plugins/busabase/.mcp.json) を使用します。

ルートの **busabase** スキルは、ローカルおよび一般的なエージェントへのインストール向けの
完全な CLI/curl ガイドです。Claude と Codex の同梱スキルは意図的に MCP 優先となっており、
`~/.busabase/.env` を読む代わりに OAuth と厳選されたツールカタログを利用します。

ワークスペースを最初から設定する場合は、Busabase ダッシュボードの **Agent Skills**
ボタンからオンボーディングプロンプトを貼り付けてください。エージェントが接続、最初の Base
への初期データ投入、上記いずれかのインストールコマンドの実行を案内します。

## スキル

| スキル | 機能 |
| --- | --- |
| [`busabase`](./skills/busabase/SKILL.md) | HTTP 経由で Busabase ワークスペースを操作します。Base とレコードの一覧取得、ChangeRequest の提案、承認済み変更のマージを行います。 |
| [`busabase-app-creator`](./skills/busabase-app-creator/SKILL.md) | 製品アイデアを、ネイティブリソース、制限されたデータアクセス、レビュー可能な AirApp を備えた完全な Busabase ワークスペースアプリに変換します。 |
| [`busa-email`](./skills/busa-email/SKILL.md) | インストール可能な**テンプレート**：受信トレイのトリアージデスク。テーブル、AirApp、そしてこのマニュアルが一緒に届くので、エージェントは渡されたワークスペースの使い方が分かります。 |

## リポジトリ構成

この 1 つのリポジトリが、上記すべてのインストール方法に対応します。

```
plugin.json                           Agent Plugins v1 ポータブルマニフェスト
mcp.json                              Agent Plugins v1 ホスト型 MCP 設定
skills/busabase/SKILL.md              ローカルおよび一般用途エージェント向けの正規スキル
skills/busabase-app-creator/SKILL.md  Busabase ワークスペースと AirApp の作成ガイド
.claude-plugin/marketplace.json       Claude Code マーケットプレイス一覧
claude/.claude-plugin/plugin.json     Claude Code プラグインマニフェスト
claude/.mcp.json                      Claude Code 用ホスト型 OAuth MCP 設定
claude/skills/busabase/SKILL.md       Claude 専用 MCP 優先接続ガイド
claude/skills/busabase-app-creator/   共有アプリ作成スキルへのシンボリックリンク
.agents/plugins/marketplace.json      Codex マーケットプレイス一覧
plugins/busabase/.codex-plugin/plugin.json   Codex プラグインマニフェスト
plugins/busabase/.mcp.json                   Codex 用ホスト型 OAuth MCP 設定
plugins/busabase/skills/busabase/SKILL.md    Codex ではスキルをプラグインディレクトリ内に配置
                                             （厳選プロファイル向け MCP 優先ガイド）
plugins/busabase/skills/busabase-app-creator/SKILL.md
                                             Busabase 依存スキルとともに同梱されるアプリ作成スキル
plugins/busabase/assets/                     Codex に同梱されるアイコンとライト/ダークロゴ
.mcp.json                             従来/一般クライアント向けローカル MCP 設定
server.json                           公式 MCP Registry エントリ（リモート → busabase.com/api/mcp）
scripts/validate-agent-plugin.mjs     ポータブル形式とクライアントパッケージの互換性検証
```

> **ホスト固有スキルが必要な理由：** Claude Code はサーバーを
> `plugin:busabase:busabase` として名前空間化し、Codex は `busabase` を使用します。どちらも
> ローカル shell 設定ではなくホスト型 OAuth を使い、共有アプリ作成スキルは接続動作を各ホストの
> MCP 優先スキルに委譲します。

## OpenAI Plugin Directory への公開

OpenAI Plugin Directory と MCP Registry は別々のリリース経路です。プラットフォームへの申請、
ドメイン検証、レビュアーアクセス、テストプロンプト、本番環境のスモークチェックについては、
[`docs/openai-plugin-submission.md`](./docs/openai-plugin-submission.md) を参照してください。

## 公式 MCP Registry への公開

```bash
brew install mcp-publisher                       # または Registry の releases からバイナリを取得
mcp-publisher login dns --domain busabase.com --private-key <KEY>   # com.busabase/* 名前空間を検証
mcp-publisher publish                            # server.json を公開——即時反映、レビュー不要
```

MCP Registry の更新を公開する場合にのみ `server.json` の `version` を上げてください。
GitHub マーケットプレイスのリリースでは、Codex プラグインマニフェストのバージョンを
個別に上げてください。
