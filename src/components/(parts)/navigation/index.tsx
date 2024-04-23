import React from "react";
import "./index.css";

// androidのナビゲーションのように、戻る、メニュー、ホームのアイコンボタンを表示する

const Navigation: React.FC = () => {
  return (
    <div>
      <div className="navigation">
        <div className="navigation_button">1</div>
        <div className="navigation_button">2</div>
        <div className="navigation_button">3</div>
      </div>
    </div>
  );
};

export default Navigation;