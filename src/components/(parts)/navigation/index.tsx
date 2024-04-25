import React from "react";
import "./index.css";

import { ArrowBackIcon, CloseIcon, HamburgerMenuIcon, HomeIcon } from "../../../lib/SVGlibrary";

// androidのナビゲーションのように、戻る、メニュー、ホームのアイコンボタンを表示する

const Navigation: React.FC = () => {
  const iconSize = 55;
  const iconColor = "#000";
  const iconStyle = { width: `${iconSize}px`, height: `${iconSize}px` };
  return (
    <div>
      <div className="navigation">
        <div className="navigation_item">
          <ArrowBackIcon style={iconStyle} color={iconColor} />
        </div>
        <div className="navigation_item">
          <HamburgerMenuIcon style={iconStyle} color={iconColor} />
        </div>
        <div className="navigation_item">
          <HomeIcon style={iconStyle} color={iconColor} />
        </div>
      </div>
    </div>
  );
};

export default Navigation;