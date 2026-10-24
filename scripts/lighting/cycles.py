import argparse
import gzip
import json
import math
import sys
import struct
from array import array
from pathlib import Path

import bpy


def read_options():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--samples", type=int, default=256)
    parser.add_argument("--inspect", action="store_true")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:])


def collect_vertices(obj, vertices):
    mesh = obj.data
    colors = array("f", [0]) * (len(mesh.loops) * 4)
    mesh.color_attributes["room-irradiance"].data.foreach_get("color", colors)
    indices = array("i", [0]) * len(mesh.loops)
    mesh.loops.foreach_get("vertex_index", indices)
    sums = array("f", [0]) * (len(mesh.vertices) * 3)
    weights = array("f", [0]) * len(mesh.vertices)
    for face in mesh.polygons:
        if len(face.loop_indices) != 3:
            raise RuntimeError(f"Non-triangular bake geometry: {obj.name}")
        area = face.area
        for loop in face.loop_indices:
            vertex = indices[loop]
            weights[vertex] += area
            for channel in range(3):
                sums[vertex * 3 + channel] += colors[loop * 4 + channel] * area
    for vertex, weight in enumerate(weights):
        if weight == 0:
            continue
        for channel in range(3):
            index = vertex * 3 + channel
            sums[index] *= math.pi / weight
    if any(not math.isfinite(value) or value < 0 for value in sums):
        raise RuntimeError(f"Invalid irradiance: {obj.name}")
    ids = array("i", [0]) * len(mesh.vertices)
    mesh.attributes["room-vertex-id"].data.foreach_get("value", ids)
    original = array("f", [0]) * (vertices * 3)
    for vertex, index in enumerate(ids):
        for channel in range(3):
            original[index * 3 + channel] = sums[vertex * 3 + channel]
    return original


def main():
    options = read_options()
    metadata = json.loads((options.input / "scene.json").read_text())
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(options.input / "scene.glb"), merge_vertices=False, import_shading="NORMALS")
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = options.samples
    scene.cycles.max_bounces = 6
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 2
    scene.cycles.transmission_bounces = 4
    scene.cycles.transparent_max_bounces = 8
    scene.cycles.use_light_tree = True
    scene.render.bake.target = "VERTEX_COLORS"
    scene.world = bpy.data.worlds.new("bake-sky")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (1, 1, 1, 1)
    targets = []
    vertices = 0
    for descriptor in metadata["meshes"]:
        obj = bpy.data.objects.get(descriptor["name"])
        if obj is None or obj.type != "MESH":
            raise RuntimeError(f"Missing receiver: {descriptor['name']}")
        if len(obj.data.vertices) != len(descriptor["usedVertices"]):
            raise RuntimeError(f"Vertex count mismatch: {obj.name}: {len(obj.data.vertices)} != {descriptor['vertices']}")
        attribute = obj.data.color_attributes.new(name="room-irradiance", type="FLOAT_COLOR", domain="CORNER")
        obj.data.color_attributes.active_color = attribute
        identifiers = obj.data.attributes.new(name="room-vertex-id", type="INT", domain="POINT")
        identifiers.data.foreach_set("value", array("i", (vertices + index for index in descriptor["usedVertices"])))
        vertices += descriptor["vertices"]
        targets.append(obj)
    print(json.dumps({"phase":"imported", "objects":len(targets), "vertices":sum(len(obj.data.vertices) for obj in targets), "samples":options.samples}),flush=True)
    if options.inspect:
        return
    room_materials = {material for obj in bpy.data.objects if obj.type == "MESH" and obj.name.startswith("room-fluorescent") for material in obj.data.materials}
    if not room_materials:
        raise RuntimeError("No fluorescent emitters were imported")
    emissions = []
    for material in bpy.data.materials:
        if not material.use_nodes:
            continue
        for node in material.node_tree.nodes:
            if node.type == "BSDF_PRINCIPLED":
                strength = node.inputs["Emission Strength"]
            elif node.type == "EMISSION":
                strength = node.inputs["Strength"]
            else:
                continue
            emissions.append((strength, float(strength.default_value) if material in room_materials else 0))
    print(json.dumps({"emitters":len(room_materials), "strengths":[original for strength,original in emissions if original>0]}),flush=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in targets:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = targets[0]
    bpy.ops.object.join()
    receiver = bpy.context.object
    receiver.name = "room-bake"
    receiver.data.color_attributes.active_color = receiver.data.color_attributes["room-irradiance"]
    baked = {}
    for name, room, sky in [("fluorescent", True, 0), ("sky", False, 1)]:
        for strength, original in emissions:
            strength.default_value = original if room else 0
        background.inputs["Strength"].default_value = sky
        print(json.dumps({"phase":name}),flush=True)
        bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, target="VERTEX_COLORS", use_clear=True)
        baked[name] = collect_vertices(receiver, vertices)
    output = bytearray(metadata["fingerprint"].encode())
    offset = 0
    for descriptor in metadata["meshes"]:
        count = descriptor["vertices"] * 3
        for name in ["fluorescent", "sky"]:
            values = baked[name][offset:offset + count]
            output.extend(struct.pack(f"<{len(values)}e", *values))
        offset += count
    compressed = gzip.compress(output,mtime=0)
    options.output.parent.mkdir(parents=True,exist_ok=True)
    options.output.write_bytes(compressed)
    print(json.dumps({"phase":"complete", "bytes":len(compressed), "fingerprint":metadata["fingerprint"]}),flush=True)


main()
