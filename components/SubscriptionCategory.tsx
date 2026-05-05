"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SubscriptionCategoryProps {
  id: string
  title: string
  subtitle?: string
  description?: string
  slug: string
  featuredImage?: string
  status?: "draft" | "published"
  subscriptionCount?: number
  tags?: string[]
}

export default function SubscriptionCategory({
  id,
  title,
  subtitle,
  description,
  slug,
  featuredImage,
  status = "published",
  subscriptionCount = 0,
  tags = [],
}: SubscriptionCategoryProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="overflow-hidden transition-all duration-300 h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-48 overflow-hidden">
        <Image
          src={featuredImage || `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(title)}`}
          alt={title}
          className={`object-cover transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {status === "draft" && (
          <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-100 text-amber-800">
            Draft
          </Badge>
        )}
      </div>

      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-grow">
        {description && <p className="text-sm text-gray-600 line-clamp-3">{description}</p>}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="text-sm text-gray-500">
          {subscriptionCount} {subscriptionCount === 1 ? "subscription" : "subscriptions"}
        </div>
        <Link href={`/user/subscription-categories/${slug}`} passHref>
          <Button size="sm">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
