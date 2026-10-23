import {
  DirectionalLight,
  HemisphereLight,
  PMREMGenerator,
  PointLight,
  Scene,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function illuminate(scene: Scene, renderer: WebGLRenderer): void {
  const generator = new PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  scene.environment = generator.fromScene(environment, 0.04).texture;
  scene.environmentIntensity = 0.24;
  environment.dispose();
  generator.dispose();
  scene.add(new HemisphereLight("#dce9fa", "#a39172", 1.15));
  const sun = new DirectionalLight("#fff0d7", 4.5);
  sun.position.set(-4, 3.1, 1.2);
  sun.target.position.set(1.4, 0, -1.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  const ceiling = new PointLight("#fff5df", 12, 7, 2);
  ceiling.position.set(0.4, 2.65, -0.6);
  scene.add(ceiling);
}
