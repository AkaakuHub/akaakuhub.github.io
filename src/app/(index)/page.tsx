"use client";

import React,  { useState } from "react";

import "./index.css"

import TapEffect from "@/components/(parts)/tapeffect"

import Header from "@/components/(parts)/header"
import Navigation from "@/components/(parts)/navigation"

import Modal from "@/components/(parts)/modal";

import { modalArrayType } from "@/type"

export default function IndexPage() {
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
