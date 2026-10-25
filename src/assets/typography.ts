import { boardText } from "../content/board-text";

export const siteFont = '"Zen Maru Gothic Board", "Zen Maru Gothic", sans-serif';
const boardCharacters = new Set(boardText);

export async function prepareBoardFont(content: string): Promise<void> {
  const additional = [...new Set(content)].filter((character) => !boardCharacters.has(character));
  const requests = [document.fonts.load('500 32px "Zen Maru Gothic Board"', boardText)];
  if (additional.length > 0) {
    await import("./fonts/zen-maru-gothic.css");
    requests.push(document.fonts.load('500 32px "Zen Maru Gothic"', additional.join("")));
  }
  const faces = await Promise.all(requests);
  if (faces.some((entries) => entries.length === 0))
    throw new Error("掲示のフォントが読み込まれていません。");
}

export async function prepareBoardHeadingFont(): Promise<void> {
  const faces = await document.fonts.load(
    '400 176px "Yomogi"',
    "最新記事GitHubSkillsWeather by Open-Meteo",
  );
  if (faces.length === 0) throw new Error("見出しのフォントが読み込まれていません。");
}
