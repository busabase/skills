# Busabase スキルとプラグイン

[English](./README.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | **日本語**

[Busabase](https://busabase.com) 向けのエージェントスキルとプラグインです。Busabase は承認を
優先するナレッジベースで、AI が変更を提案し、人間がレビューし、承認された変更だけが
マージされます。

2 つのスキルを 4 通りの方法でインストールできます。エージェントが対応する方法を選んでください。

## インストール

### `skills`（Claude Code、Cursor、Codex など、継続的に更新）

```bash
npx skills add busabase/skills
```

### Claude Code プラグイン

```bash
/plugin marketplace add busabase/skills
/plugin install busabase@busabase
```

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

ルートの [`.mcp.json`](./.mcp.json) は、一般的な MCP クライアント向けにローカル
エンドポイントを設定します。Codex プラグインには専用のリモート
[MCP 設定](./plugins/busabase/.mcp.json) があり、プラグインディレクトリ内にあるため
プラグインに同梱されます。

ルートの **busabase** スキルは、ローカルおよび一般的なエージェントへのインストール向けの
完全な CLI/curl ガイドです。Codex 同梱スキルは意図的に MCP 優先となっており、
`~/.busabase/.env` を読む代わりに OAuth と厳選されたツールカタログを利用します。

ワークスペースを最初から設定する場合は、Busabase ダッシュボードの **Agent Skills**
ボタンからオンボーディングプロンプトを貼り付けてください。エージェントが接続、最初の Base
への初期データ投入、上記いずれかのインストールコマンドの実行を案内します。

## スキル

| スキル | 機能 |
| --- | --- |
| [`busabase`](./skills/busabase/SKILL.md) | HTTP 経由で Busabase ワークスペースを操作します。Base とレコードの一覧取得、ChangeRequest の提案、承認済み変更のマージを行います。 |
| [`busabase-app-creator`](./skills/busabase-app-creator/SKILL.md) | 製品アイデアを、ネイティブリソース、制限されたデータアクセス、レビュー可能な AirApp を備えた完全な Busabase ワークスペースアプリに変換します。 |

## リポジトリ構成

この 1 つのリポジトリが、上記すべてのインストール方法に対応します。

```
skills/busabase/SKILL.md              スキル（正規版）——`skills`、Claude Code、Buda で使用
skills/busabase-app-creator/SKILL.md  Busabase ワークスペースと AirApp の作成ガイド
.claude-plugin/plugin.json            Claude Code プラグインマニフェスト（./skills/ を自動検出）
.claude-plugin/marketplace.json       Claude Code マーケットプレイス一覧
.agents/plugins/marketplace.json      Codex マーケットプレイス一覧
plugins/busabase/.codex-plugin/plugin.json   Codex プラグインマニフェスト
plugins/busabase/.mcp.json                   Codex 用ホスト型 OAuth MCP 設定
plugins/busabase/skills/busabase/SKILL.md    Codex ではスキルをプラグインディレクトリ内に配置
                                             （厳選プロファイル向け MCP 優先ガイド）
plugins/busabase/skills/busabase-app-creator/SKILL.md
                                             Busabase 依存スキルとともに同梱されるアプリ作成スキル
plugins/busabase/assets/                     Codex に同梱されるアイコンとライト/ダークロゴ
.mcp.json                             組み込み MCP サーバー（Streamable HTTP）
server.json                           公式 MCP Registry エントリ（リモート → busabase.com/api/mcp）
```

> **Codex 専用の Busabase スキルが必要な理由：** Codex は `plugins/<name>/` 内のファイルだけを
> 同梱します。同梱される `busabase` スキルは、ローカルの shell 設定ではなく、ホスト型 OAuth と
> MCP ツールを使う別の接続方式を採用しています。`busabase-app-creator` は変更せずに同梱され、
> 接続、API、ChangeRequest の動作を、この MCP 優先の依存スキルに委譲します。

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
