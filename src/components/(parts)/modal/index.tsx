import React, { useState, useEffect } from "react";
import "./index.css";
import clsx from "clsx";

import { modalArrayPropsType } from "../../../type";

import { TwitterCardSVG, ComingSoonCardSVG } from "../../../lib/SVGlibrary";

import { modalMessageType } from "../../../type";

const Modal: React.FC<modalArrayPropsType> = ({ modalArray, setModalArray }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      setModalArray(current => current.slice(0, -1));
    }
  };

  useEffect(() => {
    setIsModalOpen(modalArray.length > 0);
  }, [modalArray]);

  const Menu: React.FC<{ zIndexCurrent: number }> =
    ({ zIndexCurrent }) => {
      return (
        <div className={clsx("modal-bg", isModalOpen ? "modal-bg-open" : "modal-bg-close")} onClick={handleBgClick}>
          <div className={clsx("menu-root", isModalOpen ? "modal-bg-open" : "modal-bg-close")} style={{ zIndex: zIndexCurrent }}>
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
            <div className="menu-item-big"
              onClick={() => {
                const message = {
                  title: "お知らせ",
                  text: "未実装",
                  button1: "閉じる",
                };
                setModalArray(current => [...current, { name: "message1", message }]);
              }}
            >
              <a>
                <div className="menu-item-image">
                  <ComingSoonCardSVG />
                </div>
              </a>
              {/* <img src={Coming_soon_card} alt="Coming soon..." className="menu-item-image" /> */}
            </div>
          </div>
        </div>
      );
    };

  const MessageDialog1: React.FC<{ message: modalMessageType, zIndexCurrent: number }> =
    ({
      message,
      zIndexCurrent
    }) => {

      const closeButtonOnClick = () => {
        setModalArray(current => current.slice(0, -1));
      };

      return (
        <div className={clsx("modal-bg", isModalOpen ? "modal-bg-open" : "modal-bg-close")} onClick={handleBgClick}>
          <div className="message-dialog-root" style={{ zIndex: zIndexCurrent }}>
            <div className="message-dialog-title">
              {message.title}
            </div>
            <div className="message-dialog-text">
              {message.text}
            </div>
            <div className="message-dialog-button"
              onClick={() => closeButtonOnClick()}
            >
              {message.button1}
            </div>
          </div>
        </div>
      );
    };

  return (
    <>
      <div className={clsx("modal-root")}>
        {/* <div className={clsx("modal-root", isModalOpen ? "modal-root-open" : "modal-root-close")}> */}
        {modalArray.map((value, index) => {
          const zIndexBase: number = 1100;
          const zIndexCurrent: number = zIndexBase + index;
          switch (value.name) {
            case "menu":
              return <Menu {...{ zIndexCurrent }} />;
            case "message1":
              return value.message ? <MessageDialog1 {...{ zIndexCurrent }} message={value.message} /> : null;
            default:
              return null;
          }
        })}
      </div>
    </>
  );
};

export default Modal;