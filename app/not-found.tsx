"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f1729] flex items-center justify-center p-4">
      <div className="flex flex-col-reverse md:flex-row items-center gap-12 max-w-7xl mx-auto">
        <div className="flex-1">
          <img 
            className="w-full max-w-xl mx-auto" 
            src="/images/404-error-robot.svg" 
            alt="404 Error Robot" 
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            Page Not Found
          </h1>
          <div className="w-24 h-1 bg-[#008ffb] my-6 mx-auto md:mx-0" />
          <p className="text-xl text-gray-300 mb-8">
            The page you're looking for has drifted into a black hole. Let's get you back on track!
          </p>
          <div className="space-x-4">
            <Link href="/" prefetch={false}>
              <Button 
                className="bg-[#008ffb] hover:bg-[#008ffb]/90 text-white px-8 py-6 text-lg"
                size="lg"
              >
                Return Home
              </Button>
            </Link>
            <Link href="/contact" prefetch={false}>
              <Button 
                variant="outline"
                className="border-[#008ffb] text-[#008ffb] hover:bg-[#008ffb]/10 px-8 py-6 text-lg"
                size="lg"
              >
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}