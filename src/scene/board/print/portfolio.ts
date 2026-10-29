import { profile } from "../../../content/profile";
import { siteFont } from "../../../assets/typography";

export function paintPortfolio(context: OffscreenCanvasRenderingContext2D, width: number): void {
  const margin = width * 0.06;
  context.fillStyle = "#294536";
  context.font = `500 ${width * 0.048}px ${siteFont}`;
  context.fillText("活動・資格", margin, width * 0.1);
  context.font = `500 ${width * 0.029}px ${siteFont}`;
  for (const [index, text] of profile.activities.entries())
    context.fillText(text, margin, width * (0.185 + index * 0.046));
}
