import { DirectionalLight, RectAreaLight } from "three";
import {
  DirectionalLightNode,
  MeshBasicNodeMaterial,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  RectAreaLightNode,
} from "three/webgpu";
import NodeLibrary from "three/src/renderers/common/nodes/NodeLibrary.js";

export class RoomNodeLibrary extends NodeLibrary {
  constructor() {
    super();
    this.addMaterial(MeshBasicNodeMaterial, "MeshBasicMaterial");
    this.addMaterial(MeshStandardNodeMaterial, "MeshStandardMaterial");
    this.addMaterial(MeshPhysicalNodeMaterial, "MeshPhysicalMaterial");
    this.addLight(DirectionalLightNode, DirectionalLight);
    this.addLight(RectAreaLightNode, RectAreaLight);
  }
}
