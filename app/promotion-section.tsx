import Image from "next/image"
import { Leaf } from "lucide-react"
import { LoginButton } from "@/components/navigation-buttons"

export function PromotionSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/forest-yoga-bg.jpg"
          alt="Forest Yoga Background"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 to-green-800/80"></div>
      </div>

      {/* Decorative Pattern Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] -z-10"></div>

      <div className="container mx-auto px-4 text-center">
        <div className="inline-block mb-4 md:mb-6 px-4 py-1 sm:px-6 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium">
          <Leaf className="inline-block h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Limited Time Offer
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-white">
          JOIN NOW FOR FREE SESSIONS FOR 2 MONTHS
        </h2>
        <p className="text-lg md:text-xl mb-6 md:mb-10 text-white/80">Sessions starting from April 1</p>

        <div className="flex justify-center mb-6 md:mb-10">
          <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-2xl flex flex-col items-center transform transition-transform hover:scale-105 duration-300">
            <div className="text-green-800 font-bold mb-2 sm:mb-4 text-center text-sm sm:text-base">
              SCAN FOR WHATSAPP CHANNEL
            </div>
            <div className="h-32 w-32 sm:h-48 sm:w-48 relative rounded-lg overflow-hidden shadow-inner">
              <Image src="/images/whatsapp-qr.png" alt="WhatsApp Channel QR Code" fill className="object-contain" />
            </div>
          </div>
        </div>

        <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8">
          Transform your life with ancient wisdom in a modern sanctuary. Begin your journey today!
        </p>

        <div className="mt-4 md:mt-8">
          <LoginButton className="w-full md:w-auto px-8 py-2 text-lg" />
        </div>
      </div>
    </section>
  )
}
