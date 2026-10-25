export interface Skill {
  label: string;
  detail: string;
  icon: string;
  evidence: readonly { url: string; summary: string }[];
}

export const skillDomains: readonly Skill[] = [
  {
    label: "Web",
    detail: "React",
    icon: "react",
    evidence: [
      { url: "https://github.com/AkaakuHub/link-like-ui", summary: "React用UIライブラリ" },
    ],
  },
  {
    label: "Mobile",
    detail: "iOS / Swift",
    icon: "apple",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/iOSThermalMmonitor",
        summary: "iPhone・iPadの熱状態を監視するSwiftアプリ",
      },
    ],
  },
  {
    label: "Desktop",
    detail: "Tauri / macOS",
    icon: "tauri",
    evidence: [
      { url: "https://github.com/AkaakuHub/refined-line", summary: "Tauri 2のWindowsアプリ" },
      {
        url: "https://github.com/rurza/BatFi/compare/main...AkaakuHub:BatFi:main",
        summary: "macOSアプリのクライアント・電源管理処理を改修",
      },
    ],
  },
  {
    label: "3D",
    detail: "Three.js",
    icon: "threejs",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/akaakuhub.github.io",
        summary: "Three.jsの部室と照明・描画処理",
      },
    ],
  },
  {
    label: "VR",
    detail: "Unity / SteamVR",
    icon: "unity",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/sekaimate",
        summary: "VR・Desktop向けソーシャル基盤",
      },
    ],
  },
  {
    label: "Audio",
    detail: "音源分離・音量制御",
    icon: "pytorch",
    evidence: [
      {
        url: "https://github.com/Anjok07/ultimatevocalremovergui/compare/master...AkaakuHub:ultimatevocalremovergui:main",
        summary: "Demucsのモデル読み込みとモデル設定を改修",
      },
      {
        url: "https://github.com/bitgapp/eqMac/compare/master...AkaakuHub:eqMac:master",
        summary: "Swiftのアプリ別音量制御・AudioTap・XPC処理を追加",
      },
    ],
  },
  {
    label: "放送・映像",
    detail: "MPEG-TS / ARIB",
    icon: "linux",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/mpegts.js",
        summary: "ブラウザー向けMPEG-TS再生の改修",
      },
      {
        url: "https://github.com/AkaakuHub/mirakc-arib",
        summary: "日本の放送番組データを扱うツール群",
      },
      {
        url: "https://github.com/AkaakuHub/ariblib",
        summary: "ARIB規格の解析ライブラリ",
      },
    ],
  },
  {
    label: "Tools",
    detail: "MCP / Node.js",
    icon: "nodejs",
    evidence: [
      {
        url: "https://github.com/Piotr1215/mcp-obsidian/compare/main...AkaakuHub:mcp-obsidian:main",
        summary: "ノート・リンク・タグ操作などのMCPツールを改修",
      },
      {
        url: "https://github.com/shinshin86/oh-my-logo/compare/main...AkaakuHub:oh-my-logo:main",
        summary: "日本語文字レンダリングを追加",
      },
    ],
  },
];

export const skillLanguages: readonly Skill[] = [
  {
    label: "TypeScript",
    detail: "",
    icon: "typescript",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/unified-asset-loader",
        summary: "主言語がTypeScriptの非フォークリポジトリ",
      },
    ],
  },
  {
    label: "Python",
    detail: "",
    icon: "python",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/steam-analyzer",
        summary: "主言語がPythonの非フォークリポジトリ",
      },
    ],
  },
  {
    label: "C#",
    detail: "",
    icon: "csharp",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/OpenKikaiSan",
        summary: "主言語がC#の非フォークリポジトリ",
      },
    ],
  },
  {
    label: "Rust",
    detail: "",
    icon: "rust",
    evidence: [{ url: "https://github.com/AkaakuHub/refined-line", summary: "RustとTauriを使用" }],
  },
  {
    label: "JavaScript",
    detail: "",
    icon: "javascript",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/obs-fader",
        summary: "主言語がJavaScriptの非フォークリポジトリ",
      },
    ],
  },
  {
    label: "C++",
    detail: "",
    icon: "cplusplus",
    evidence: [
      { url: "https://github.com/AkaakuHub/ginko", summary: "主言語がC++の非フォークリポジトリ" },
    ],
  },
  {
    label: "Swift",
    detail: "",
    icon: "swift",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/iOSThermalMmonitor",
        summary: "iOSアプリとmacOSアプリの改修に使用",
      },
    ],
  },
  {
    label: "Go",
    detail: "",
    icon: "go",
    evidence: [
      {
        url: "https://github.com/AkaakuHub/m3u8-saver",
        summary: "主言語がGoの非フォークリポジトリ",
      },
    ],
  },
];

export const skillIconNames = [
  ...new Set([...skillDomains, ...skillLanguages].map((skill) => skill.icon)),
];
export const skillText = [...skillDomains, ...skillLanguages]
  .flatMap((skill) => [skill.label, skill.detail])
  .join(" ");
