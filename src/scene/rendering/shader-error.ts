import { RenderingContextLostError, RenderingResourcesInvalidError } from "./recovery";

type ShaderContext = Pick<
  WebGL2RenderingContext,
  | "getError"
  | "isContextLost"
  | "isProgram"
  | "isShader"
  | "getShaderParameter"
  | "getProgramParameter"
  | "getShaderInfoLog"
  | "getProgramInfoLog"
  | "COMPILE_STATUS"
  | "LINK_STATUS"
>;

export function shaderError(
  gl: ShaderContext,
  program: WebGLProgram,
  vertex: WebGLShader,
  fragment: WebGLShader,
): Error {
  const code = gl.getError();
  const lost = gl.isContextLost();
  const status = `GL error: 0x${code.toString(16)}\nContext lost: ${lost}`;
  if (lost) return new RenderingContextLostError("WebGL", status);
  const programExists = gl.isProgram(program);
  const vertexExists = gl.isShader(vertex);
  const fragmentExists = gl.isShader(fragment);
  if (!programExists || !vertexExists || !fragmentExists)
    return new RenderingResourcesInvalidError(
      [
        "WebGLの描画オブジェクトが無効になりました。コンパイル結果は取得できません。",
        status,
        `Program exists: ${programExists}`,
        `Vertex exists: ${vertexExists}`,
        `Fragment exists: ${fragmentExists}`,
      ].join("\n"),
    );
  return new Error(
    [
      "WebGLのシェーダーを準備できませんでした。",
      status,
      `Vertex compiled: ${gl.getShaderParameter(vertex, gl.COMPILE_STATUS)}`,
      `Fragment compiled: ${gl.getShaderParameter(fragment, gl.COMPILE_STATUS)}`,
      `Linked: ${gl.getProgramParameter(program, gl.LINK_STATUS)}`,
      `Program: ${gl.getProgramInfoLog(program)?.slice(0, 400)}`,
      `Vertex: ${gl.getShaderInfoLog(vertex)?.slice(0, 400)}`,
      `Fragment: ${gl.getShaderInfoLog(fragment)?.slice(0, 400)}`,
    ].join("\n"),
  );
}
