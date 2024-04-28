import React, { useState, useEffect } from "react";
import "./index.css";
import clsx from "clsx";

import { modalArrayPropsType } from "../../../type"

const Menu: React.FC = () => {
  // const BASE_URL = process.env.GATSBY_BASE_URL;

  const menuData = [
    { name: "GitHub", image: "https://raw.githubusercontent.com/AkaakuHub/github-grass/main/github-glass.svg", href: "https://github.com/AkaakuHub/" },
    { name: "Twitter", image: "/twitter-card.svg", href: "https://twitter.com/AkaakuHub" },
    { name: "Coming soon...", image: "/coming-soon-card.svg", href: "" },
  ];

  const preventDefault = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    if (href === "") {
      e.preventDefault();
    } else {
      return;
    }
  };

  return (
    <div className="menu-root">
      {menuData.map((value, index) => {
        return (
          <div key={index} className="menu-item-big">
            <a href={value.href} target="_blank" rel="noopener noreferrer"
              onClick={(e) => preventDefault(e, value.href)}
            >
              <img src={value.image} alt={value.name} className="menu-item-image" />
            </a>
          </div>
        );
      })}
    </div>
  );
}

const Modal: React.FC<modalArrayPropsType> = ({ modalArray, setModalArray }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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