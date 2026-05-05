"use client"

import type React from "react"
import { LoginButton } from "@/components/login-button"
import Image from "next/image"

export default function SiteHeader() {
  // 🏠 Handle logo click - navigate to home
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Always navigate to home, never logout
    window.location.href = "/"
  }

  return (
    <header className="bg-gray-100 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <button
          onClick={handleLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Sthavishtah Logo" fill className="object-contain" />
          </div>
          <span className="text-2xl font-bold text-green-700">STHAVISHTAH</span>
        </button>
        <nav>
          <ul className="flex items-center space-x-4">
            <li>
              <a href="/about" className="hover:text-green-600 transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-green-600 transition-colors">
                Contact
              </a>
            </li>
            <li>
              <LoginButton className="ml-4" />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
