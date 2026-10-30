import { ConvertNode, DirectionalLightNode } from "three/webgpu";
import type NodeBuilder from "three/src/nodes/core/NodeBuilder.js";
import { noticeLightScale } from "./notice-light";

export class RoomDirectionalLightNode extends DirectionalLightNode {
  override setupDirect(builder: NodeBuilder) {
    const data = super.setupDirect(builder);
    if (!data) return;
    return {
      ...data,
      lightColor: new ConvertNode<"vec3">(data.lightColor, "vec3").mul(
        noticeLightScale(builder.material.name, "sun"),
      ),
    };
  }
}
