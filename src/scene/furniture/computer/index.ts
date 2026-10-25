import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
} from "three";
import { cylinder, roundBox } from "../geometry";
import { desktopTower } from "./tower";
import { mechanicalKeyboard } from "./keyboard";

export function desktopComputer(): Group {
  const computer = new Group();
  computer.name = "desktop-computer";
  const white = new MeshStandardMaterial({ color: "#e5e7e6", roughness: 0.62 });
  const graphite = new MeshStandardMaterial({ color: "#232827", roughness: 0.74 });
  const display = new MeshBasicMaterial({ color: "#080b0a" });
  roundBox(computer, [0.22, 0.012, 0.18], [0, 0.006, -0.15], white, 0.008);
  roundBox(computer, [0.045, 0.17, 0.035], [0, 0.095, -0.22], white, 0.006);
  roundBox(computer, [0.61, 0.358, 0.026], [0, 0.33, -0.19], white, 0.008);
  const screen = new Mesh(new PlaneGeometry(0.589, 0.331), display);
  screen.position.set(0, 0.333, -0.1755);
  screen.name = "computer-monitor";
  computer.add(screen);
  const keyboard = mechanicalKeyboard();
  keyboard.position.set(0, 0, 0.173);
  computer.add(keyboard);
  const mouse = new Group();
  roundBox(mouse, [0.06, 0.005, 0.1], [0, 0.0025, 0], white, 0.002);
  const shell = new Mesh(new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), white);
  shell.scale.set(0.03, 0.018, 0.05);
  shell.position.y = 0.005;
  mouse.add(shell);
  cylinder(mouse, 0.005, 0.007, [0, 0.02, -0.018], graphite).rotation.z = Math.PI / 2;
  mouse.position.set(0.29, 0, 0.19);
  computer.add(mouse);
  const tower = desktopTower();
  tower.position.set(0.54, 0, -0.04);
  computer.add(tower);
  computer.traverse((object) => {
    if (!(object instanceof Mesh) || Array.isArray(object.material)) return;
    object.castShadow = object.receiveShadow = !object.material.transparent;
  });
  return computer;
}
