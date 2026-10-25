import { profile } from "../content/profile";

export const siteFont = '"Zen Maru Gothic", sans-serif';

export async function prepareBoardFont(content: string): Promise<void> {
  const text = [
    profile.name,
    profile.handle,
    profile.description,
    content,
    "PROFILE BLOG GitHub Weather data by Open-Meteo プロフィール リポジトリを開く この記事を読む 読み込み中 掲示を直す クリックして再取得 公開ありません 東京 晴れ時々曇り雨雪霧雷風北南東西 着氷性 みぞれ 降水 雲量 取得 更新 時間別予報 0123456789/:%@.年月日時分 cmhJSTstars↗",
  ].join(" ");
  const faces = await document.fonts.load('500 32px "Zen Maru Gothic"', text);
  if (faces.length === 0) throw new Error("掲示のフォントが読み込まれていません。");
}
