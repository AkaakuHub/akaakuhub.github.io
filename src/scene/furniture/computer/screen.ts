import { CanvasTexture, SRGBColorSpace } from "three";
import type { MeshBasicMaterial } from "three";
import type { BoardState } from "../../board/notices";
import { siteFont } from "../../../assets/typography";

export function createComputerScreen(material: MeshBasicMaterial) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("モニターを描画できませんでした。");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  material.map = texture;
  material.color.set("#bfc7c0");
  material.needsUpdate = true;
  return (powered: boolean, state: BoardState): void => {
    context.fillStyle = powered ? "#f6f7f2" : "#080b0a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (powered) {
      context.fillStyle = "#23392e";
      context.font = `500 58px ${siteFont}`;
      context.fillText("AkaakuHub", 60, 95);
      context.font = `28px ${siteFont}`;
      context.fillText("つくったもの", 60, 147);
      if (state.status === "ready") {
        state.content.repositories.slice(0, 3).forEach((repository, index) => {
          const y = 230 + index * 115;
          context.font = `500 31px ${siteFont}`;
          context.fillStyle = "#23392e";
          context.fillText(repository.name, 60, y, 1060);
          if (repository.description) {
            context.font = `24px ${siteFont}`;
            context.fillStyle = "#617066";
            context.fillText(repository.description, 60, y + 41, 1060);
          }
        });
      } else {
        context.font = `28px ${siteFont}`;
        context.fillText(
          state.status === "loading" ? "読み込み中" : "一覧を読み直してください",
          60,
          250,
        );
      }
      context.font = `25px ${siteFont}`;
      context.fillStyle = "#617066";
      context.fillText("クリックしてリポジトリ一覧を開く", 60, 620);
    }
    texture.needsUpdate = true;
  };
}
