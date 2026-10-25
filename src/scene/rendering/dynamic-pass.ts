import { DirectionalLight, Mesh, RectAreaLight, Scene } from "three";
import type {
  BufferGeometry,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene as RoomScene,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";

export class DynamicSurfacePass extends Pass {
  private readonly scene = new Scene();
  private readonly surfaces = new Map<Mesh, Mesh>();
  private readonly lights: { source: RectAreaLight; copy: RectAreaLight }[] = [];
  private readonly daylight: { source: DirectionalLight; copy: DirectionalLight }[] = [];

  constructor(
    monitor: Mesh<BufferGeometry, MeshBasicMaterial>,
    fanSurfaces: readonly Mesh[],
    private readonly contributions: Object3D,
    private readonly room: RoomScene,
    private readonly camera: PerspectiveCamera,
  ) {
    super();
    this.needsSwap = false;
    for (const source of [monitor, ...fanSurfaces]) this.addSurface(source);
    room.traverse((object) => {
      if (object instanceof DirectionalLight) {
        const copy = object.clone();
        copy.target = object.target;
        copy.shadow = object.shadow;
        copy.matrixAutoUpdate = false;
        copy.matrixWorldAutoUpdate = false;
        this.scene.add(copy);
        this.daylight.push({ source: object, copy });
      }
      if (!(object instanceof RectAreaLight)) return;
      const copy = object.clone();
      copy.matrixAutoUpdate = false;
      copy.matrixWorldAutoUpdate = false;
      this.scene.add(copy);
      this.lights.push({ source: object, copy });
    });
  }

  private addSurface(source: Mesh): void {
    if (this.surfaces.has(source)) return;
    const copy = new Mesh(source.geometry, source.material);
    copy.matrixAutoUpdate = false;
    copy.matrixWorldAutoUpdate = false;
    copy.receiveShadow = source.receiveShadow;
    copy.renderOrder = source.renderOrder;
    this.scene.add(copy);
    this.surfaces.set(source, copy);
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    this.scene.environment = this.room.environment;
    this.scene.environmentIntensity = this.room.environmentIntensity;
    this.contributions.traverse((object) => {
      if (object instanceof Mesh) this.addSurface(object);
    });
    for (const [source, copy] of this.surfaces) {
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
    for (const { source, copy } of this.daylight) {
      source.updateWorldMatrix(true, false);
      copy.matrixWorld.copy(source.matrixWorld);
      copy.color.copy(source.color);
      copy.intensity = source.intensity;
      copy.visible = source.visible;
    }
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? writeBuffer : readBuffer);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
  }
}
