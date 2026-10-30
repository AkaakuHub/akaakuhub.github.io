import { profile } from "./profile.ts";
import { privacyText } from "./privacy.ts";

export const boardText = [
  privacyText,
  profile.hobbies,
  profile.favorite,
  ...profile.history.flatMap((entry) => [entry.date, entry.title, entry.detail]),
  ...profile.qualifications,
  "趣味 好きなもの 好きな言語 活動・資格 活動記録 所属 活動 受賞 資格",
  "Googleのデータ利用 計測を停止する",
  "あかあく",
  "紙の外をタップしてみてください 紙の外をクリックしてみてください",
  "天気の音を再生 天気の音を消す >",
  "音をオンにすると、雨や風の音も楽しめます 音やモーションをオンにすると、部屋をもっと楽しめます モーションをオンにすると、端末の傾きで視点を動かせます 案内を閉じる モーション操作をオン モーション操作をオフ",
  "AkaakuHub GitHub GitHubを開く GitHubの制作物を見る Skills Languages PC README 最新記事 この記事を読む 読み込み中 掲示を直す クリックして再取得 公開リポジトリはありません 更新順 0123456789/:%@.年月日時分",
].join(" ");

export const boardHeadingText =
  "最新記事GitHub活動・資格活動記録所属活動受賞資格SkillsWeather by Open-Meteo";
