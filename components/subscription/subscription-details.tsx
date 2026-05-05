"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react"

interface Subscription {
  id: string
  name: string
  description: string
  price: number
  duration_months: number
  features: string[] | string
  is_active: boolean
  created_at: string
  updated_at: string
  max_users?: number
  discount_percentage?: number
}

interface SubscriptionDetailsProps {
  subscription: Subscription
  showActions?: boolean
  onEdit?: (subscription: Subscription) => void
  onDelete?: (subscriptionId: string) => void
  onToggleStatus?: (subscriptionId: string, isActive: boolean) => void
}

export function SubscriptionDetails({
  subscription,
  showActions = false,
  onEdit,
  onDelete,
  onToggleStatus,
}: SubscriptionDetailsProps) {
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserCount()
  }, [subscription.id])

  const fetchUserCount = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/users`)
      if (response.ok) {
        const data = await response.json()
        setUserCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching user count:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatFeatures = (features: string[] | string) => {
    if (Array.isArray(features)) {
      return features
    }
    if (typeof features === "string") {
      try {
        const parsed = JSON.parse(features)
        return Array.isArray(parsed) ? parsed : features.split(",").map((f) => f.trim())
      } catch {
        return features.split(",").map((f) => f.trim())
      }
    }
    return []
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const featuresList = formatFeatures(subscription.features)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">{subscription.name}</CardTitle>
          <Badge variant={subscription.is_active ? "default" : "secondary"}>
            {subscription.is_active ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Inactive
              </>
            )}
          </Badge>
        </div>
        {subscription.description && <p className="text-muted-foreground">{subscription.description}</p>}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-lg font-semibold">{formatPrice(subscription.price)}</p>
              {subscription.discount_percentage && (
                <Badge variant="outline" className="text-xs">
                  {subscription.discount_percentage}% OFF
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">
                {subscription.duration_months} {subscription.duration_months === 1 ? "Month" : "Months"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Current Users</p>
              <p className="text-lg font-semibold">
                {loading ? "..." : userCount}
                {subscription.max_users && ` / ${subscription.max_users}`}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        {featuresList.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-3">Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {featuresList.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(subscription.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(subscription.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(subscription)}>
                Edit Subscription
              </Button>
            )}

            {onToggleStatus && (
              <Button
                variant={subscription.is_active ? "destructive" : "default"}
                onClick={() => onToggleStatus(subscription.id, !subscription.is_active)}
              >
                {subscription.is_active ? "Deactivate" : "Activate"}
              </Button>
            )}

            {onDelete && (
              <Button variant="destructive" onClick={() => onDelete(subscription.id)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SubscriptionDetails
