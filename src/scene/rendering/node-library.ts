import { AmbientLight, DirectionalLight, RectAreaLight } from "three";
import {
  MeshBasicNodeMaterial,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  RectAreaLightNode,
  AmbientLightNode,
} from "three/webgpu";
import NodeLibrary from "three/src/renderers/common/nodes/NodeLibrary.js";
import { RoomDirectionalLightNode } from "../lighting/notice-light-nodes";

export class RoomNodeLibrary extends NodeLibrary {
  constructor() {
    super();
    this.addMaterial(MeshBasicNodeMaterial, "MeshBasicMaterial");
    this.addMaterial(MeshStandardNodeMaterial, "MeshStandardMaterial");
    this.addMaterial(MeshPhysicalNodeMaterial, "MeshPhysicalMaterial");
    this.addLight(RoomDirectionalLightNode, DirectionalLight);
    this.addLight(RectAreaLightNode, RectAreaLight);
    this.addLight(AmbientLightNode, AmbientLight);
  }
}
