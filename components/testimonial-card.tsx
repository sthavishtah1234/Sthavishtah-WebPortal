import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

interface TestimonialCardProps {
  name: string
  location: string
  testimonial: string
  rating: number
  imageSrc?: string
  className?: string
}

export default function TestimonialCard({
  name,
  location,
  testimonial,
  rating,
  imageSrc,
  className = "",
}: TestimonialCardProps) {
  return (
    <Card className={`p-6 h-full flex flex-col ${className}`}>
      <div className="flex items-start mb-4">
        <Avatar className="h-12 w-12 mr-4">
          {imageSrc ? (
            <AvatarImage src={imageSrc || "/placeholder.svg"} alt={name} />
          ) : (
            <AvatarFallback className="bg-green-100 text-green-800">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h4 className="font-semibold text-green-800">{name}</h4>
          <p className="text-sm text-gray-500">{location}</p>
          <div className="flex mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
            ))}
          </div>
        </div>
      </div>
      <blockquote className="text-gray-600 italic flex-grow">"{testimonial}"</blockquote>
    </Card>
  )
}
