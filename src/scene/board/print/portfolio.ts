import { profile } from "../../../content/profile";
import { siteFont } from "../../../assets/typography";

export function paintPortfolio(context: OffscreenCanvasRenderingContext2D, width: number): void {
  function heading(text: string, x: number, y: number, size = 0.046): void {
    context.fillStyle = "#294536";
    context.font = `400 ${width * size}px "Yomogi"`;
    context.fillText(text, width * x, width * y);
  }
  function lines(items: readonly string[], x: number, y: number): void {
    context.fillStyle = "#253b31";
    context.font = `500 ${width * 0.027}px ${siteFont}`;
    items.forEach((text, index) => context.fillText(text, width * x, width * (y + index * 0.047)));
  }
  heading("活動・資格", 0.06, 0.105, 0.068);
  heading("所属", 0.06, 0.18);
  lines(profile.education, 0.06, 0.235);
  heading("活動", 0.06, 0.37);
  lines(profile.activities, 0.06, 0.425);
  heading("受賞", 0.53, 0.18);
  for (const [index, award] of profile.awards.entries()) {
    const y = 0.23 + index * 0.105;
    context.fillStyle = "#53645c";
    context.font = `500 ${width * 0.022}px ${siteFont}`;
    context.fillText(award.year, width * 0.53, width * y);
    context.fillStyle = "#253b31";
    context.font = `500 ${width * 0.024}px ${siteFont}`;
    context.fillText(award.title, width * 0.53, width * (y + 0.032));
    context.fillText(award.prize, width * 0.53, width * (y + 0.064));
  }
  heading("資格", 0.53, 0.585);
  lines(profile.qualifications, 0.53, 0.64);
}
