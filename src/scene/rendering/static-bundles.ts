import { Box3, Frustum, Group, InstancedMesh, Matrix4, Mesh, Sphere, Vector3 } from "three";
import type { PerspectiveCamera, Scene } from "three";
import { BundleGroup } from "three/webgpu";

interface Bundle {
  group: BundleGroup;
  meshes: Mesh[];
  visible: boolean[];
  bounds: { box: Box3; sphere: Sphere }[];
}

export class StaticSceneBundles {
  readonly root = new Group();
  private readonly bundles: Bundle[] = [];
  private readonly frustum = new Frustum();
  private readonly projection = new Matrix4();
  private readonly previous = new Matrix4();
  private dirty = true;
  private boundsDirty = true;

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
        bundle = { group: new BundleGroup(), meshes: [], visible: [], bounds: [] };
        bundle.group.matrixAutoUpdate = false;
        groups.set(key, bundle);
        this.bundles.push(bundle);
        this.root.add(bundle.group);
      }
      bundle.group.attach(mesh);
      bundle.meshes.push(mesh);
      bundle.visible.push(false);
      bundle.bounds.push({ box: new Box3(), sphere: new Sphere() });
    }
    this.root.updateMatrixWorld(true);
    this.root.matrixAutoUpdate = false;
  }

  invalidate(): void {
    this.dirty = true;
  }

  invalidateGeometry(): void {
    this.boundsDirty = true;
    this.invalidate();
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
        const bounds = bundle.bounds[index];
        if (!bounds) throw new Error("固定部材の範囲がありません。");
        if (this.boundsDirty) {
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
          if (!mesh.geometry.boundingBox || !mesh.geometry.boundingSphere)
            throw new Error("固定部材の範囲を計算できません。");
          bounds.box
            .copy(mesh.geometry.boundingBox)
            .applyMatrix4(mesh.matrixWorld)
            .expandByScalar(0.0001);
          bounds.sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
        }
        const visible =
          !mesh.frustumCulled ||
          (this.frustum.intersectsSphere(bounds.sphere) && this.frustum.intersectsBox(bounds.box));
        if (visible !== bundle.visible[index]) changed = true;
        bundle.visible[index] = visible;
      }
      if (changed) bundle.group.needsUpdate = true;
    }
    this.dirty = false;
    this.boundsDirty = false;
  }
}
