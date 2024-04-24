import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"

import "./global.css"

import TapEffect from "../components/(parts)/tapeffect"

import Header from "../components/(parts)/header"
import Navigation from "../components/(parts)/navigation"

const IndexPage: React.FC<PageProps> = () => {
  return (
    <main>
      <TapEffect>
        <Header />
        <div>
          ここが本文の予定です
          ここが本文の予定です
          ここが本文の予定です
          ここが本文の予定です
          ここが本文の予定です
          ここが本文の予定です
          ここが本文の予定です
          ここが本文の予定です
        </div>
        <Navigation />
      </TapEffect>
    </main>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>
