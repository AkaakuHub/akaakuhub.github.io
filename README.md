# AkaakuHub

Three.jsで描画する部室を入口にした個人サイトです。室内では位置を固定し、四方の壁・天井・床へ視線を切り替えます。

## 部室

左右ボタン、左右矢印キー、スワイプで向きを変えます。ホワイトボードの紙はクリック・タップ、または「掲示を見る」で近づき、3Dの紙を拡大して読みます。

東京の座標から日付と実時刻における太陽の方位・高度を計算し、毎秒更新します。窓は南向きです。晴天を想定した日差しと空色を計算し、夜は天井の面光源で照らします。

散乱光は通常の照明と同じ影マップを参照し、画面の深度から復元した物体の表面まで積分します。Henyey–Greenstein位相関数とBeer–Lambert則を使い、半解像度の計算結果を深度に応じて合成します。[参考にした描画処理](https://github.com/AkaakuHub/steamvr-workshop-tools-win/tree/main/rendering)の原理をもとに、メートル単位の部室用GLSLとして実装しています。

スマホとPCで同じ空間を描画し、画面の実寸に合わせて画角・描画解像度を調整します。

床・壁・木材・布・塗装金属には[Poly HavenのCC0素材](https://polyhaven.com/license)を使い、色・法線・AO・粗さを実寸で適用しています。素材の出典と著者は[素材一覧](public/materials/attribution.json)に記録しています。参考作品のモデルやテクスチャは使用していません。

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
