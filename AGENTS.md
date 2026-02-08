# ルール
devは私が建てているので勝手にサーバー起動をしないこと

### Package Manager
- **ALWAYS use `pnpm` for package management** - never manually edit package.json
- Add dependencies: `pnpm add package-name`
- Add dev dependencies: `pnpm add -D package-name`
- Remove dependencies: `pnpm remove package-name`

### ファイル構成
1つのファイルが長くなりすぎないよう、適切に分割すること。
T-wadaさんの方針で。

### コードスタイル
- 使用しない変数は、アンダーバーつけは禁止で、削除すること
- フォールバックは絶対に禁止。
- anyは禁止
- 型定義は厳密に行うこと
- biome-ignoreなど、lint無効化は禁止
- anyや、eslint-disableなどを使わずに、型安全に書くこと
- SVG直で書くのを禁止。アイコンライブラリを使用すること