export const siteFont = '"Zen Maru Gothic", sans-serif';

export async function prepareBoardFont(content: string): Promise<void> {
  const text = [
    content,
    "AkaakuHub GitHub GitHubを開く GitHubの制作物を見る Skills Languages つくるもの PC README 最新記事 この記事を読む 読み込み中 掲示を直す クリックして再取得 公開リポジトリはありません 更新順 0123456789/:%@.年月日時分 ↗",
  ].join(" ");
  const faces = await document.fonts.load('500 32px "Zen Maru Gothic"', text);
  if (faces.length === 0) throw new Error("掲示のフォントが読み込まれていません。");
}

export async function prepareBoardHeadingFont(): Promise<void> {
  const faces = await document.fonts.load(
    '400 176px "Yomogi"',
    "最新記事GitHubSkillsWeather by Open-Meteo",
  );
  if (faces.length === 0) throw new Error("見出しのフォントが読み込まれていません。");
}
