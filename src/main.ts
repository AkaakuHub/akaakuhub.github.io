import { createIcons, ArrowLeft } from "lucide";
import { Scene } from "three";
import { box, surface } from "./scene/primitives";
import "./style.css";

const scene = new Scene();
box(scene, [1, 1, 1], [0, 0, 0], surface("#e7e4db"));
createIcons({ icons: { ArrowLeft } });
