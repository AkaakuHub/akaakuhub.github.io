export const privacy = {
  title: "プライバシーポリシー",
  updated: "2026年10月30日",
  sections: [
    {
      title: "アクセス解析",
      text: "GoogleアナリティクスがCookieで閲覧・操作・端末情報を収集し、Googleへ送信します。",
    },
    {
      title: "計測の停止",
      text: "ブラウザー設定でCookieを無効にするか、Googleのオプトアウトを利用できます。",
    },
    {
      title: "保存と外部サービス",
      text: "HDR設定・案内・読み込みデータを端末に保存します。配信等にCloudflare・GitHub・Open-Meteo・ブログを利用します。",
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
