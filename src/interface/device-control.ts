import "./device-controls.css";

export function createDeviceControl(
  root: HTMLElement,
  name: "sound" | "hdr",
  label: string,
): HTMLButtonElement {
  const controls = root.querySelector(".room-device-controls");
  if (!controls) throw new Error("設備の操作対象を配置できませんでした。");
  const button = document.createElement("button");
  button.type = "button";
  button.className = `room-${name} room-device-control`;
  button.hidden = true;
  button.setAttribute("aria-label", label);
  controls.append(button);
  return button;
}
