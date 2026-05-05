import Image from "next/image"

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <Image src="/images/logo.png" alt="Sthavishtah Yoga & Wellness" width={40} height={40} className="rounded-full" />
      <div className="hidden sm:block">
        <h1 className="text-xl font-bold text-green-700">Sthavishtah</h1>
        <p className="text-xs text-gray-600">Yoga & Wellness</p>
      </div>
    </div>
  )
}
