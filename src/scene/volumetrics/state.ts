import { Color, Matrix4, Vector3 } from "three";
import type { DirectionalLight, PerspectiveCamera, Texture } from "three";

export class ScatteringState {
  private readonly world = new Matrix4();
  private readonly projection = new Matrix4();
  private readonly shadow = new Matrix4();
  private readonly color = new Color();
  private readonly direction = new Vector3();
  private readonly nextDirection = new Vector3();
  private readonly target = new Vector3();
  private depth: Texture | null | undefined;
  private intensity = NaN;
  private bias = NaN;
  private dirty = true;

  invalidate(): void {
    this.dirty = true;
  }

  update(camera: PerspectiveCamera, light: DirectionalLight): boolean {
    light.target.getWorldPosition(this.target);
    light.getWorldPosition(this.nextDirection).sub(this.target).normalize();
    const depth = light.shadow.map?.depthTexture;
    if (
      !this.dirty &&
      this.world.equals(camera.matrixWorld) &&
      this.projection.equals(camera.projectionMatrixInverse) &&
      this.shadow.equals(light.shadow.matrix) &&
      this.direction.equals(this.nextDirection) &&
      this.color.equals(light.color) &&
      this.intensity === light.intensity &&
      this.bias === light.shadow.bias &&
      this.depth === depth
    )
      return false;
    this.world.copy(camera.matrixWorld);
    this.projection.copy(camera.projectionMatrixInverse);
    this.shadow.copy(light.shadow.matrix);
    this.direction.copy(this.nextDirection);
    this.color.copy(light.color);
    this.intensity = light.intensity;
    this.bias = light.shadow.bias;
    this.depth = depth;
    this.dirty = false;
    return true;
  }
}
