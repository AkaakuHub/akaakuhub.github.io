export const privacy = {
  title: "プライバシーポリシー",
  updated: "2026年10月30日",
  sections: [
    {
      title: "アクセス解析",
      text: "利用状況の把握とサイトの改善のため、Googleアナリティクスを使用します。Cookieなどを通じて、閲覧ページ、操作、端末・ブラウザー情報などを収集し、Googleへ送信します。",
    },
    {
      title: "計測の停止",
      text: "Cookieはブラウザーの設定で無効にできます。Googleアナリティクスのオプトアウトアドオンでも計測を停止できます。",
    },
    {
      title: "保存と外部サービス",
      text: "読み込み用データ、HDR設定、操作案内の表示状態を端末内へ保存します。配信にCloudflare、プロフィール画像にGitHub、天気と記事の取得にOpen-Meteoとブログを利用します。",
    },
    {
      title: "位置情報と端末の傾き",
      text: "端末の位置情報は取得しません。傾きは操作を有効にしたときだけ端末内で使い、送信しません。",
    },
  ],
  operator: "運営: あかあく（AkaakuHub）",
  google: "https://policies.google.com/technologies/partner-sites?hl=ja",
  optout: "https://tools.google.com/dlpage/gaoptout?hl=ja",
} as const;

export const privacyText = [
  privacy.title,
  ...privacy.sections.flatMap((section) => [section.title, section.text]),
  privacy.operator,
  privacy.google,
  privacy.optout,
  privacy.updated,
].join("\n");
