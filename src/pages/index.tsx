import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"

import TapEffect from "../components/(parts)/tapeffect"

const IndexPage: React.FC<PageProps> = () => {
  return (
    <main>
      <TapEffect />
      <h1>Home Page</h1>
      <p>
        ここが本文の予定です
        <br /><br /><br /><br />
        <br /><br /><br /><br />
        <br /><br /><br /><br />
        <br /><br /><br /><br />
        あああ
      </p>
    </main>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Home Page</title>
