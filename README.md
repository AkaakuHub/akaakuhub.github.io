# AkaakuHub

Three.jsで描画する部室を入口にした個人サイトです。室内では位置を固定し、4方向へ視線を切り替えます。

## 開発

Node.js 22.18以降とpnpmを使用します。

```sh
pnpm install
pnpm dev
```

## 検証

```sh
pnpm check
pnpm build
```

Vite+、TypeScript、Oxfmt、Oxlint、Knip、Lefthookを使用しています。`dist/`を静的ホスティングに配置できます。
