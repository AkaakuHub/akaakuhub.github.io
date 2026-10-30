import type { Object3D, Scene } from "three";

export class SceneTransforms {
  private readonly animated: Object3D[] = [];
  private dirty = true;

  constructor(private readonly scene: Scene) {}

  invalidate(): void {
    this.dirty = true;
  }

  update(): void {
    if (this.dirty) {
      this.scene.matrixWorldAutoUpdate = true;
      try {
        this.scene.updateMatrixWorld();
      } finally {
        this.scene.matrixWorldAutoUpdate = false;
      }
      this.animated.length = 0;
      const collect = (parent: Object3D): void => {
        for (const child of parent.children) {
          if (child.matrixAutoUpdate) this.animated.push(child);
          else collect(child);
        }
      };
      collect(this.scene);
      this.dirty = false;
      return;
    }
    for (const object of this.animated) object.updateWorldMatrix(true, true);
  }
}
