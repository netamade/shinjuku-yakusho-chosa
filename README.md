# 新宿区 売買役所調査台帳

不動産売買で回る役所調査を、区ごとに一画面にまとめた台帳です。画面上部で区を選びます（東京23区）。現在、調査データがあるのは新宿区のみで、他区は「データ準備中」と表示します。

新宿区の台帳の内容：

- 用途地域、道路、建築台帳、地区計画、開発・盛土、ハザード、文化財、土壌、インフラ、都税
- みんなのGISと窓口のどちらで取るか
- 本庁舎の階・窓口番号・電話
- 来庁順（1階 → 4階 → 7階 → 8階、分庁舎・法務局・都税は別）
- 物件ごとの進捗とメモ（ブラウザ内だけに、区ごとに保存）
- 調査メモのコピー（見出しの区名は選択中の区）

整理の起点は新宿区「[都市計画情報等の調べ方（不動産調査用）](https://www.city.shinjuku.lg.jp/kusei/toshikei01_000001_00065.html)」（2026年4月1日更新）です。告示と窓口は変わるので、重説の前に原典と窓口で確認してください。この台帳は行政の証明書ではありません。

## 構成

| ファイル | 内容 |
| --- | --- |
| `src/data/wards.ts` | 区マスタ（23区の id・団体コード・区名・よみ・公式URL）。公式URLは確認できたものだけを入れ、未確認は `null` |
| `src/data/survey.ts` | 区に依存しない型（`SurveyItem`・`WardSurvey`）とラベル |
| `src/data/wards/shinjuku.ts` | 新宿区の調査項目・来庁順・画面の区固有の文言 |
| `src/data/ward-surveys.ts` | 区ごとの調査データの登録簿。ここにない区は「データ準備中」 |
| `src/lib/ward-storage.ts` | 区ごとの保存・選択中の区の保存・旧キーの移行 |
| `src/lib/export-text.ts` | 書き出し文 |

### 区を追加するとき

1. 区の公式情報で確認した内容で `src/data/wards/<区id>.ts` を作り、`WardSurvey` を export する。
2. `src/data/ward-surveys.ts` に登録する。
3. 確認できた公式URLを `src/data/wards.ts` の区マスタに入れる。

推測で項目やURLを作らないこと。

### 保存（localStorage）

| キー | 内容 |
| --- | --- |
| `ward-yakusho:selected-ward` | 選択中の区 id（次回起動時に復元） |
| `ward-yakusho:v1:<区id>` | 区ごとの物件情報と項目ごとの状態・メモ |
| `ward-yakusho:legacy-migrated` | 旧キーの移行済みの印 |

新宿区専用だった頃のキー `shinjuku-yakusho-v1` は、初回起動時に一度だけ `ward-yakusho:v1:shinjuku` へ写します。新キーに既にデータがあれば上書きせず、旧キーは消さずに残します。

## GitHub Pages への公開

Desk (本体) は静的データと localStorage だけで動作する。サーバー機能は使わないので、TanStack Start を SPA モードでビルドし、その静的成果物を GitHub Pages で配信する。認証・DB まわりのスキャフォールドは残っているが、Pages では `/api/auth` などは利用できない。公開ページでは未ログインとして扱われ、台帳の入力・保存は localStorage で行われる。

- 公開URL: https://netamade.github.io/shinjuku-yakusho-chosa/
- 公開用のビルド: `npm run build:pages` (SPA モードで `dist/pages` に静的成果物を集約する)
- デプロイ: `.github/workflows/deploy-pages.yml` (main への push で GitHub Pages にデプロイする。PR ではビルドと `npm run test:ts` のみ検証する)
- 手元の確認: `npm run build:pages` のあと、`dist/pages` へのシンボリックリンクを `/tmp/pages/shinjuku-yakusho-chosa` に置き、`python3 -m http.server --directory /tmp/pages` で配信して `/shinjuku-yakusho-chosa/` を開く

## 開発

```bash
npm install
npm run dev
```

アプリは `8080` で開きます。

台帳まわりの単体テストだけを走らせる：

```bash
node --experimental-strip-types --test src/data/wards.test.ts src/lib/ward-storage.test.ts src/lib/export-text.test.ts
```
