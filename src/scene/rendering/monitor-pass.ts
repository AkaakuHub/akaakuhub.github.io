import { Mesh, Scene } from "three";
import type {
  BufferGeometry,
  MeshBasicMaterial,
  PerspectiveCamera,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";

export class MonitorPass extends Pass {
  private readonly scene = new Scene();
  private readonly surface: Mesh<BufferGeometry, MeshBasicMaterial>;

  constructor(
    private readonly monitor: Mesh<BufferGeometry, MeshBasicMaterial>,
    private readonly camera: PerspectiveCamera,
  ) {
    super();
    this.needsSwap = false;
    this.surface = new Mesh(monitor.geometry, monitor.material);
    this.surface.matrixAutoUpdate = false;
    this.surface.matrixWorldAutoUpdate = false;
    this.scene.add(this.surface);
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ): void {
    this.monitor.updateWorldMatrix(true, false);
    this.surface.matrixWorld.copy(this.monitor.matrixWorld);
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? writeBuffer : readBuffer);
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
  }
}
