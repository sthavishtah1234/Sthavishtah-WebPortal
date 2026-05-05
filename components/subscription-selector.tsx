"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils"

interface Subscription {
  id: number
  subscription_id: number
  start_date: string
  end_date: string
  is_active: boolean
  subscription: {
    id: number
    name: string
    description: string | null
  }
}

interface SubscriptionSelectorProps {
  subscriptions: Subscription[]
  onSelect: (subscriptionId: number) => void
  onCancel: () => void
}

export function SubscriptionSelector({ subscriptions, onSelect, onCancel }: SubscriptionSelectorProps) {
  const [selectedSubscription, setSelectedSubscription] = useState<number | null>(
    subscriptions.length > 0 ? subscriptions[0].id : null,
  )

  const handleSubmit = () => {
    if (selectedSubscription) {
      onSelect(selectedSubscription)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Select Subscription</CardTitle>
        <CardDescription>Choose which subscription to use for this course</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedSubscription?.toString()}
          onValueChange={(value) => setSelectedSubscription(Number(value))}
        >
          {subscriptions.map((sub) => (
            <div key={sub.id} className="flex items-start space-x-2 mb-4 border p-3 rounded-md">
              <RadioGroupItem value={sub.id.toString()} id={`sub-${sub.id}`} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={`sub-${sub.id}`} className="font-medium">
                  {sub.subscription.name}
                </Label>
                <p className="text-sm text-muted-foreground">Valid until: {formatDate(sub.end_date)}</p>
                {sub.subscription.description && <p className="text-sm mt-1">{sub.subscription.description}</p>}
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!selectedSubscription}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  )
}
