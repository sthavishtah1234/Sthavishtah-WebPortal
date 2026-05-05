import { Card } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SocialMediaCardProps {
  title: string
  subtitle?: string
  imageSrc?: string
  badgeText?: string
  className?: string
  imagePosition?: "top" | "background"
  size?: "instagram" | "facebook" | "twitter"
}

export default function SocialMediaCard({
  title,
  subtitle,
  imageSrc,
  badgeText,
  className = "",
  imagePosition = "top",
  size = "instagram",
}: SocialMediaCardProps) {
  // Size presets (aspect ratios)
  const sizeClasses = {
    instagram: "aspect-square w-full max-w-md",
    facebook: "aspect-[1.91/1] w-full max-w-lg",
    twitter: "aspect-[1.91/1] w-full max-w-lg",
  }

  return (
    <Card
      className={`overflow-hidden ${sizeClasses[size]} ${className}`}
      style={{
        backgroundImage: imagePosition === "background" && imageSrc ? `url(${imageSrc})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {imagePosition === "top" && imageSrc && (
        <div className="h-1/2 w-full bg-cover bg-center" style={{ backgroundImage: `url(${imageSrc})` }} />
      )}

      <div
        className={`
        p-6 flex flex-col items-center justify-center text-center
        ${imagePosition === "background" ? "h-full bg-black/40 text-white" : ""}
      `}
      >
        {badgeText && (
          <Badge
            className={`mb-3 ${
              imagePosition === "background"
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            {badgeText}
          </Badge>
        )}

        <div className="flex items-center justify-center mb-4">
          <Leaf className={`h-8 w-8 ${imagePosition === "background" ? "text-white" : "text-green-600"}`} />
        </div>

        <h3
          className={`text-xl md:text-2xl font-bold mb-2 ${imagePosition === "background" ? "text-white" : "text-green-800"}`}
        >
          {title}
        </h3>

        {subtitle && (
          <p className={`${imagePosition === "background" ? "text-white/80" : "text-gray-600"}`}>{subtitle}</p>
        )}
      </div>
    </Card>
  )
}
