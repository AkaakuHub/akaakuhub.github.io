import { Mesh, RectAreaLight, Scene } from "three";
import type {
  BufferGeometry,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene as RoomScene,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";

export class DynamicSurfacePass extends Pass {
  private readonly scene = new Scene();
  private readonly surfaces: readonly { source: Mesh; copy: Mesh }[];
  private readonly lights: { source: RectAreaLight; copy: RectAreaLight }[] = [];

  constructor(
    monitor: Mesh<BufferGeometry, MeshBasicMaterial>,
    fanSurfaces: readonly Mesh[],
    private readonly room: RoomScene,
    private readonly camera: PerspectiveCamera,
  ) {
    super();
    this.needsSwap = false;
    this.surfaces = [monitor, ...fanSurfaces].map((source) => {
      const copy = new Mesh(source.geometry, source.material);
      copy.matrixAutoUpdate = false;
      copy.matrixWorldAutoUpdate = false;
      this.scene.add(copy);
      return { source, copy };
    });
    room.traverse((object) => {
      if (!(object instanceof RectAreaLight)) return;
      const copy = object.clone();
      copy.matrixAutoUpdate = false;
      copy.matrixWorldAutoUpdate = false;
      this.scene.add(copy);
      this.lights.push({ source: object, copy });
    });
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    this.scene.environment = this.room.environment;
    this.scene.environmentIntensity = this.room.environmentIntensity;
    for (const { source, copy } of this.surfaces) {
      source.updateWorldMatrix(true, false);
      copy.geometry = source.geometry;
      copy.matrixWorld.copy(source.matrixWorld);
      copy.visible = source.visible;
    }
    for (const { source, copy } of this.lights) {
      source.updateWorldMatrix(true, false);
      copy.matrixWorld.copy(source.matrixWorld);
      copy.color.copy(source.color);
      copy.intensity = source.intensity;
      copy.width = source.width;
      copy.height = source.height;
      copy.visible = source.visible;
    }
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? writeBuffer : readBuffer);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
  }
}
