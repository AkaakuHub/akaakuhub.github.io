import { Box3, Frustum, Group, InstancedMesh, Matrix4, Mesh, Vector3 } from "three";
import type { PerspectiveCamera, Scene } from "three";
import { BundleGroup } from "three/webgpu";

interface Bundle {
  group: BundleGroup;
  meshes: Mesh[];
  visible: boolean[];
}

export class StaticSceneBundles {
  readonly root = new Group();
  private readonly bundles: Bundle[] = [];
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  private readonly previous = new Matrix4();
  private dirty = true;

  constructor(scene: Scene) {
    scene.updateMatrixWorld(true);
    const meshes: Mesh[] = [];
    scene.traverseVisible((object) => {
      if (
        object instanceof Mesh &&
        !(object instanceof InstancedMesh) &&
        !object.matrixAutoUpdate &&
        object.children.length === 0 &&
        !Array.isArray(object.material) &&
        !object.material.transparent &&
        object.onBeforeRender === Mesh.prototype.onBeforeRender
      )
        meshes.push(object);
    });
    this.root.name = "static-room-bundles";
    scene.add(this.root);
    const groups = new Map<string, Bundle>();
    const center = new Vector3();
    const bounds = new Box3();
    for (const mesh of meshes) {
      bounds.setFromObject(mesh).getCenter(center);
      const key = [
        Math.floor(center.x / 3),
        Math.floor(center.y / 3),
        Math.floor(center.z / 3),
      ].join(":");
      let bundle = groups.get(key);
      if (!bundle) {
        bundle = { group: new BundleGroup(), meshes: [], visible: [] };
        bundle.group.matrixAutoUpdate = false;
        groups.set(key, bundle);
        this.bundles.push(bundle);
        this.root.add(bundle.group);
      }
      bundle.group.attach(mesh);
      bundle.meshes.push(mesh);
      bundle.visible.push(false);
    }
    this.root.updateMatrixWorld(true);
    this.root.matrixAutoUpdate = false;
  }

  invalidate(): void {
    this.dirty = true;
  }

  update(camera: PerspectiveCamera): void {
    camera.updateMatrixWorld();
    this.projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    if (!this.dirty && this.projection.equals(this.previous)) return;
    this.previous.copy(this.projection);
    this.frustum.setFromProjectionMatrix(this.projection, camera.coordinateSystem);
    for (const bundle of this.bundles) {
      let changed = this.dirty;
      for (const [index, mesh] of bundle.meshes.entries()) {
        const visible = !mesh.frustumCulled || this.frustum.intersectsObject(mesh);
        if (visible !== bundle.visible[index]) changed = true;
        bundle.visible[index] = visible;
      }
      if (changed) bundle.group.needsUpdate = true;
    }
    this.dirty = false;
  }
}
