import React, { useState, useEffect } from "react";
import "./index.css";
import clsx from "clsx";

import { modalArrayPropsType } from "../../../type";

import { TwitterCardSVG, ComingSoonCardSVG } from "../../../lib/SVGlibrary";

const Modal: React.FC<modalArrayPropsType> = ({ modalArray, setModalArray }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const Menu: React.FC = () => {

    return (
      <div className="menu-root">
        <div className="menu-item-big">
          <a href="https://github.com/AkaakuHub/" target="_blank" rel="noopener noreferrer">
            <img src="https://raw.githubusercontent.com/AkaakuHub/github-grass/main/github-glass.svg" alt="GitHub" className="menu-item-image" />
          </a>
        </div>
        <div className="menu-item-big">
          <a href="https://twitter.com/AkaakuHub" target="_blank" rel="noopener noreferrer">
            {/* <img src={Twitter_card} alt="Twitter" className="menu-item-image" /> */}
            <div className="menu-item-image">
              <TwitterCardSVG style={{ width: "100%", height: "auto" }} />
            </div>
          </a>
        </div>
        <div className="menu-item-big">
          <a>
            <div className="menu-item-image">
              <ComingSoonCardSVG />
            </div>
          </a>
          {/* <img src={Coming_soon_card} alt="Coming soon..." className="menu-item-image" /> */}
        </div>
      </div>
    );
  };

  useEffect(() => {
    setIsModalOpen(modalArray.length > 0);
  }, [modalArray]);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      setModalArray([]);
    }
  };

  return (
    <>
      <div className={clsx("modal-bg", isModalOpen ? "modal-bg-open" : "modal-bg-close")} onClick={handleBgClick}>
        <div className={clsx("modal-root", isModalOpen ? "modal-root-open" : "modal-root-close")}>
          {modalArray.map((value, index) => {
            switch (value) {
              case "menu":
                return <Menu key={index} />;
              default:
                return <div key={index}></div>;
            }
          })}
        </div>
      </div>
    </>
  );
};

export default Modal;