import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"

import { useState } from "react";

import "./global.css"
import "./index.css"

import TapEffect from "../components/(parts)/tapeffect"

import Header from "../components/(parts)/header"
import Navigation from "../components/(parts)/navigation"

import Modal from "../components/(parts)/modal";

import { modalArrayType } from "../type"

const IndexPage: React.FC<PageProps> = () => {
  // ここでモーダルを管理する
  const [modalArray, setModalArray] = useState<modalArrayType[]>([])

  return (
    <main className="main-root">
      <TapEffect>
        <Modal {... { modalArray, setModalArray }} />
        <Header />
        {/* <div>
          ここに一応本文です
        </div> */}
        <Navigation {... { modalArray, setModalArray }} />
      </TapEffect>
    </main>
  )
}

export default IndexPage

export const Head: HeadFC = () => {
  return (
    <head>
      <title>Home</title>
      <meta name="description" content="Home" />
      <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0" />
    </head>
  )
}