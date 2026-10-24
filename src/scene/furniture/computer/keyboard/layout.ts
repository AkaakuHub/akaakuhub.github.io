export interface Key {
  label: string;
  x: number;
  row: number;
  units: number;
  rows: number;
  shape?: "enter" | "space";
}

function row(index: number, labels: readonly (string | readonly [string, number])[]): Key[] {
  let x = 0;
  return labels.map((entry) => {
    const [label, units] = typeof entry === "string" ? [entry, 1] : entry;
    const key = { label, units, x, row: index, rows: 1 };
    x += units;
    return key;
  });
}

export const keyboardKeys: readonly Key[] = [
  { label: "Esc", x: 0, row: 0, units: 1, rows: 1 },
  ...["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"].map(
    (label, index) => ({
      label,
      x: 2 + index + Math.floor(index / 4) * 0.5,
      row: 0,
      units: 1,
      rows: 1,
    }),
  ),
  ...row(1.5, ["半角", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "^", "¥", "Back"]),
  ...row(2.5, [["Tab", 1.5], "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "@", "["]),
  ...row(3.5, [["Caps", 1.75], "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", ":", "]"]),
  { label: "Enter", x: 13.5, row: 2.5, units: 1.5, rows: 2, shape: "enter" },
  ...row(4.5, [
    ["Shift", 2.25],
    "Z",
    "X",
    "C",
    "V",
    "B",
    "N",
    "M",
    ",",
    ".",
    "/",
    "\\",
    ["Shift", 1.75],
  ]),
  ...row(5.5, [
    ["Ctrl", 1.25],
    ["", 1.25],
    ["Alt", 1.25],
    ["無変換", 1.25],
    ["", 4],
    ["変換", 1.25],
    ["かな", 1.25],
    ["Alt", 1.25],
    "Fn",
    ["Ctrl", 1.25],
  ]).map((key): Key => (key.units === 4 ? { ...key, shape: "space" } : key)),
  ...["Insert", "Home", "PgUp", "Delete", "End", "PgDn"].map((label, index) => ({
    label,
    x: 15.5 + (index % 3),
    row: 1.5 + Math.floor(index / 3),
    units: 1,
    rows: 1,
  })),
  { label: "↑", x: 16.5, row: 4.5, units: 1, rows: 1 },
  ...["←", "↓", "→"].map((label, index) => ({
    label,
    x: 15.5 + index,
    row: 5.5,
    units: 1,
    rows: 1,
  })),
];
