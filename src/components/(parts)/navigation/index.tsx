import React from "react";

import { ArrowBackIcon, CloseIcon, HamburgerMenuIcon, HomeIcon } from "../../../lib/SVGlibrary";

import { modalArrayPropsType } from "../../../type"

// androidのナビゲーションのように、戻る、メニュー、ホームのアイコンボタンを表示する

const ButtonWrapper = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
  return (
    <div className="cursor-pointer w-1/3 flex justify-center items-center py-5"
      onClick={onClick}
    >
      <div className="w-full flex justify-center items-center border-l-4 border-gray-300">
        {children}
      </div>
    </div>
  );
}

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
      setModalArray(current => [...current, { name: "menu" }]);
    }
  };

  const handleHomeOnClick = () => {
    setModalArray([]);
  };

  return (
    <div>
      <div className="absolute bottom-0 left-0 w-full flex justify-around items-center bg-white border border-gray-300 rounded-t-2xl z-50">
        <ButtonWrapper onClick={handleBackOnClick}>
          <ArrowBackIcon style={iconStyle} color={iconColor} />
        </ButtonWrapper>
        <ButtonWrapper onClick={handleMenuOnClick}>
          {modalArray.length > 0 ? (
            <CloseIcon style={iconStyle} color={iconColor} />
          ) : (
            <HamburgerMenuIcon style={iconStyle} color={iconColor} />
          )
          }
        </ButtonWrapper>
        <ButtonWrapper onClick={handleHomeOnClick}>
          <HomeIcon style={iconStyle} color={iconColor} />
        </ButtonWrapper>
      </div>
    </div>
  );
};

export default Navigation;