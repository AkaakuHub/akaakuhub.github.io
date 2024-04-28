import React from "react";
import "./index.css";

import { ArrowBackIcon, CloseIcon, HamburgerMenuIcon, HomeIcon } from "../../../lib/SVGlibrary";

import { modalArrayPropsType } from "../../../type"

// androidのナビゲーションのように、戻る、メニュー、ホームのアイコンボタンを表示する

const Navigation: React.FC<modalArrayPropsType> = (
  { modalArray, setModalArray }
) => {
  const iconSize = 40;
  const iconColor = "#000";
  const iconStyle = { width: `${iconSize}px`, height: `${iconSize}px` };

  const handleBackOnClick = () => {
    if (modalArray.length > 0) {
      setModalArray(modalArray.slice(0, -1));
    }
  };

  const handleMenuOnClick = () => {
    if (modalArray.length > 0) {
      setModalArray([]);
    } else {
      setModalArray(["menu"]);
    }
  };

  const handleHomeOnClick = () => {
    setModalArray([]);
  };

  return (
    <div>
      <div className="navigation">
        <div className="navigation_item"
          onClick={handleBackOnClick}
        >
          <div className="nav-item-content">
            <ArrowBackIcon style={iconStyle} color={iconColor} />
          </div>
        </div>
        <div className="navigation_item"
          onClick={handleMenuOnClick}
        >
          <div className="nav-item-content">

            {modalArray.length > 0 ? (
              <CloseIcon style={iconStyle} color={iconColor} />
            ) : (
              <HamburgerMenuIcon style={iconStyle} color={iconColor} />
            )
            }
          </div>
        </div>
        <div className="navigation_item"
          onClick={handleHomeOnClick}
        >
          <div className="nav-item-content">
            <HomeIcon style={iconStyle} color={iconColor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;