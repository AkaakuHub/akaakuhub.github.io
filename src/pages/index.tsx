import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"

import { useState } from "react";

import "./global.css"
import "./index.css"

import TapEffect from "../components/(parts)/tapeffect"

import Header from "../components/(parts)/header"
import Navigation from "../components/(parts)/navigation"

import Modal from "../components/(parts)/modal";

const IndexPage: React.FC<PageProps> = () => {
  // ここでモーダルを管理する
  const [modalArray, setModalArray] = useState<string[]>([])

  return (
    <main className="main-root">
      <TapEffect>
        <Modal {... { modalArray, setModalArray }} />
        <Header />
        <div>
          ここに一応本文です
        </div>
        <Navigation {... { modalArray, setModalArray }} />
      </TapEffect>
    </main>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>
