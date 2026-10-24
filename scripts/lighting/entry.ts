import { Scene, WebGLRenderer } from "three";
import { createRoomAssetLoader } from "../../src/assets/loading";
import { assembleClubroom } from "../../src/scene/clubroom";
import { loadMaterials } from "../../src/scene/materials/library";
import { exportLightingScene } from "./export";

export async function exportRoom() {
  const renderer = new WebGLRenderer();
  const assets = createRoomAssetLoader(() => {});
  const loading = loadMaterials(renderer, assets);
  await loading.ready;
  const scene = new Scene();
  assembleClubroom(scene, loading.materials);
  const exported = await exportLightingScene(scene);
  renderer.dispose();
  return exported;
}
