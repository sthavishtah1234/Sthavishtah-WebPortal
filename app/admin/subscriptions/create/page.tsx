"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { calculateDurationDays, formatSubscriptionError } from "@/lib/subscription-utils"
import { X, Plus, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

// Predefined features that can be selected
const PREDEFINED_FEATURES = [
  "Access to all recorded sessions",
  "Live session access",
  "Personal guidance from instructors",
  "Access to exclusive content",
  "Priority support",
  "Downloadable resources",
  "Certificate of completion",
  "Community forum access",
  "Monthly Q&A sessions",
  "Mobile app access",
]

export default function CreateSubscription() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [durationDays, setDurationDays] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [startDateStr, setStartDateStr] = useState(new Date().toISOString().split("T")[0])
  const [endDateStr, setEndDateStr] = useState("")
  const [useCustomEndDate, setUseCustomEndDate] = useState(false)
  const [isDefaultForNewUsers, setIsDefaultForNewUsers] = useState(false)
  const [isOneTimeOnly, setIsOneTimeOnly] = useState(false)
  const [useDates, setUseDates] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("")

  // Activation settings
  const [requiresActivation, setRequiresActivation] = useState(false)
  const [autoActivateAfterDays, setAutoActivateAfterDays] = useState("0")
  const [activationDate, setActivationDate] = useState<Date | undefined>(undefined)
  const [activationDateStr, setActivationDateStr] = useState<string>("")

  // New state for features
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [selectedPredefinedFeatures, setSelectedPredefinedFeatures] = useState<string[]>([])

  // Add these new state variables after the other state declarations
  const [hasDiscount, setHasDiscount] = useState(false)
  const [discountPercentage, setDiscountPercentage] = useState("0")
  const [originalPrice, setOriginalPrice] = useState("")

  // Add this function to calculate the discounted price
  const calculateDiscountedPrice = (original: string, discount: string): string => {
    if (!original || !discount) return original

    const originalValue = Number.parseFloat(original)
    const discountValue = Number.parseInt(discount)

    if (isNaN(originalValue) || isNaN(discountValue)) return original
    if (discountValue <= 0 || discountValue >= 100) return original

    const discountedPrice = originalValue * (1 - discountValue / 100)
    return discountedPrice.toFixed(2)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Name is required"

    if (!price.trim()) {
      newErrors.price = "Price is required"
    } else if (isNaN(Number.parseFloat(price)) || Number.parseFloat(price) < 0) {
      newErrors.price = "Price must be a valid positive number"
    }

    if (useDates) {
      if (!startDateStr) {
        newErrors.startDate = "Start date is required when using dates"
      }

      if (useCustomEndDate) {
        if (!endDateStr) {
          newErrors.endDate = "End date is required when using custom end date"
        } else if (startDateStr && endDateStr) {
          const startDate = new Date(startDateStr)
          const endDate = new Date(endDateStr)
          if (endDate <= startDate) {
            newErrors.endDate = "End date must be after start date"
          }
        }
      } else {
        if (!durationDays.trim()) {
          newErrors.durationDays = "Duration is required"
        } else if (isNaN(Number.parseInt(durationDays)) || Number.parseInt(durationDays) <= 0) {
          newErrors.durationDays = "Duration must be a valid positive number"
        }
      }
    } else {
      if (!durationDays.trim()) {
        newErrors.durationDays = "Duration is required"
      } else if (isNaN(Number.parseInt(durationDays)) || Number.parseInt(durationDays) <= 0) {
        newErrors.durationDays = "Duration must be a valid positive number"
      }
    }

    if (requiresActivation && autoActivateAfterDays.trim()) {
      if (isNaN(Number.parseInt(autoActivateAfterDays)) || Number.parseInt(autoActivateAfterDays) < 0) {
        newErrors.autoActivateAfterDays = "Auto-activate days must be a valid non-negative number"
      }
    }

    if (hasDiscount) {
      if (!originalPrice.trim()) {
        newErrors.originalPrice = "Original price is required when using discount"
      } else if (isNaN(Number.parseFloat(originalPrice)) || Number.parseFloat(originalPrice) <= 0) {
        newErrors.originalPrice = "Original price must be a valid positive number"
      }

      if (!discountPercentage.trim()) {
        newErrors.discountPercentage = "Discount percentage is required"
      } else {
        const discountValue = Number.parseInt(discountPercentage)
        if (isNaN(discountValue) || discountValue <= 0 || discountValue >= 100) {
          newErrors.discountPercentage = "Discount must be between 1 and 99 percent"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature("")
    }
  }

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...features]
    updatedFeatures.splice(index, 1)
    setFeatures(updatedFeatures)
  }

  const handlePredefinedFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setSelectedPredefinedFeatures([...selectedPredefinedFeatures, feature])
    } else {
      setSelectedPredefinedFeatures(selectedPredefinedFeatures.filter((f) => f !== feature))
    }
  }

  const handleActivationDateSelect = (date: Date | undefined) => {
    setActivationDate(date)
    if (date) {
      setActivationDateStr(format(date, "yyyy-MM-dd"))
    } else {
      setActivationDateStr("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      setSuccess(null)
      setErrors({})
      const supabase = getSupabaseBrowserClient()

      // Calculate end date if using duration days and dates
      let calculatedEndDate: string | null = null
      let finalDurationDays = 0

      if (useDates) {
        if (!useCustomEndDate && startDateStr) {
          // Using start date + duration
          finalDurationDays = Number.parseInt(durationDays)
          const startDate = new Date(startDateStr)
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + finalDurationDays)
          calculatedEndDate = endDate.toISOString()
        } else if (useCustomEndDate && startDateStr && endDateStr) {
          // Using custom end date - calculate duration from dates
          finalDurationDays = calculateDurationDays(startDateStr, endDateStr)
          calculatedEndDate = new Date(endDateStr).toISOString()
        }
      } else {
        // Not using dates, just duration
        finalDurationDays = Number.parseInt(durationDays)
      }

      // Ensure we have a valid duration_days value
      if (finalDurationDays <= 0) {
        setErrors({ durationDays: "Duration must be a positive number" })
        setLoading(false)
        return
      }

      // Combine custom features and selected predefined features
      const allFeatures = [...features, ...selectedPredefinedFeatures]

      // Remove duplicates
      const uniqueFeatures = [...new Set(allFeatures)]

      const { data, error } = await supabase
        .from("subscriptions")
        .insert([
          {
            name,
            description: description || null,
            price: hasDiscount
              ? Number.parseFloat(calculateDiscountedPrice(originalPrice, discountPercentage))
              : Number.parseFloat(price),
            duration_days: finalDurationDays,
            start_date: useDates ? (startDateStr ? new Date(startDateStr).toISOString() : null) : null,
            end_date: useDates ? calculatedEndDate : null,
            is_default_for_new_users: isDefaultForNewUsers,
            is_one_time_only: isOneTimeOnly,
            features: uniqueFeatures,
            requires_activation: requiresActivation,
            auto_activate_after_days: requiresActivation ? Number.parseInt(autoActivateAfterDays) : 0,
            activation_date: activationDate ? activationDate.toISOString() : null,
            whatsapp_group_link: whatsappGroupLink || null,
            has_discount: hasDiscount,
            discount_percentage: hasDiscount ? Number.parseInt(discountPercentage) : 0,
            original_price: hasDiscount ? Number.parseFloat(originalPrice) : null,
          },
        ])
        .select()

      if (error) throw error

      setSuccess("Subscription created successfully!")

      // If this is set as a default subscription, run the migration to ensure the schema is updated
      if (isDefaultForNewUsers) {
        try {
          await fetch("/api/update-subscription-defaults")
        } catch (migrationError) {
          console.error("Error running migration:", migrationError)
        }
      }

      // Clear form or redirect after a delay
      setTimeout(() => {
        router.push("/admin/subscriptions")
      }, 1500)
    } catch (error) {
      console.error("Error creating subscription:", error)
      setSuccess(null)
      setErrors({ submit: formatSubscriptionError(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create Subscription Plan</h1>

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {errors.submit && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Create a new subscription plan for your users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter plan name" />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter plan description"
                  rows={3}
                />
              </div>

              {/* Features Section */}
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium text-lg">Subscription Features</h3>
                <p className="text-sm text-gray-500">Add features that will be displayed as bullet points</p>

                {/* Custom Features */}
                <div className="space-y-2">
                  <Label htmlFor="features">Custom Features</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="features"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddFeature()
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddFeature} variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Feature List */}
                {features.length > 0 && (
                  <div className="space-y-2">
                    <Label>Added Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1.5">
                          <span>{feature}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Predefined Features */}
                <div className="space-y-3 mt-4">
                  <Label>Predefined Features</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {PREDEFINED_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature}`}
                          checked={selectedPredefinedFeatures.includes(feature)}
                          onCheckedChange={(checked) => handlePredefinedFeatureChange(feature, checked === true)}
                        />
                        <label htmlFor={`feature-${feature}`} className="text-sm">
                          {feature}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {(features.length > 0 || selectedPredefinedFeatures.length > 0) && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">Feature Preview</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {[...features, ...selectedPredefinedFeatures].map((feature, index) => (
                        <li key={index} className="text-sm">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Price with Discount Option */}
              <div className="space-y-4 border p-4 rounded-md">
                <h3 className="font-medium text-lg">Pricing</h3>

                {/* Discount Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="has-discount" className="font-medium">
                      Apply Discount
                    </Label>
                    <p className="text-sm text-gray-500">Show original price with a discount applied</p>
                  </div>
                  <Switch
                    id="has-discount"
                    checked={hasDiscount}
                    onCheckedChange={(checked) => {
                      setHasDiscount(checked)
                      if (checked && !originalPrice && price) {
                        setOriginalPrice(price)
                        setPrice(calculateDiscountedPrice(price, discountPercentage))
                      } else if (!checked && originalPrice) {
                        setPrice(originalPrice)
                        setOriginalPrice("")
                      }
                    }}
                  />
                </div>

                {hasDiscount ? (
                  <>
                    {/* Original Price */}
                    <div className="space-y-2">
                      <Label htmlFor="original-price">Original Price (₹)</Label>
                      <Input
                        id="original-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={originalPrice}
                        onChange={(e) => {
                          setOriginalPrice(e.target.value)
                          setPrice(calculateDiscountedPrice(e.target.value, discountPercentage))
                        }}
                        placeholder="Enter original price in rupees"
                      />
                      {errors.originalPrice && <p className="text-sm text-red-500">{errors.originalPrice}</p>}
                    </div>

                    {/* Discount Percentage */}
                    <div className="space-y-2">
                      <Label htmlFor="discount-percentage">Discount Percentage (%)</Label>
                      <Input
                        id="discount-percentage"
                        type="number"
                        min="1"
                        max="99"
                        value={discountPercentage}
                        onChange={(e) => {
                          setDiscountPercentage(e.target.value)
                          setPrice(calculateDiscountedPrice(originalPrice, e.target.value))
                        }}
                        placeholder="Enter discount percentage"
                      />
                      {errors.discountPercentage && <p className="text-sm text-red-500">{errors.discountPercentage}</p>}
                    </div>

                    {/* Final Price (Calculated) */}
                    <div className="space-y-2">
                      <Label htmlFor="price">Final Price (₹)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Discounted price"
                          className="bg-gray-50"
                          readOnly
                        />
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {originalPrice && discountPercentage && Number.parseInt(discountPercentage) > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="line-through text-gray-500">₹{originalPrice}</span>
                            <span>₹{price}</span>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                              {discountPercentage}% OFF
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Regular Price (No Discount) */
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter price in rupees"
                    />
                    {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                  </div>
                )}
              </div>

              {/* WhatsApp Group Link */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp-group-link">WhatsApp Group Link</Label>
                <Input
                  id="whatsapp-group-link"
                  value={whatsappGroupLink}
                  onChange={(e) => setWhatsappGroupLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                />
                <p className="text-sm text-gray-500">Enter the WhatsApp group link for this subscription</p>
              </div>

              {/* Date Configuration Toggle */}
              <div className="flex items-center space-x-2">
                <Switch id="use-dates" checked={useDates} onCheckedChange={setUseDates} />
                <Label htmlFor="use-dates">Use specific start and end dates</Label>
              </div>

              {/* Duration - Only show if not using custom end date */}
              {(!useDates || (useDates && !useCustomEndDate)) && (
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="Enter duration in days"
                  />
                  {errors.durationDays && <p className="text-sm text-red-500">{errors.durationDays}</p>}
                </div>
              )}

              {/* Date Selection - Only show if useDates is true */}
              {useDates && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-custom-end-date"
                      checked={useCustomEndDate}
                      onCheckedChange={(checked) => {
                        setUseCustomEndDate(checked === true)
                      }}
                    />
                    <label
                      htmlFor="use-custom-end-date"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Use custom end date instead of duration
                    </label>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                    />
                    {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                  </div>

                  {useCustomEndDate ? (
                    /* End Date (when using custom end date) */
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDateStr}
                        onChange={(e) => setEndDateStr(e.target.value)}
                        min={startDateStr}
                      />
                      {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}

                      {/* Show calculated duration when using custom end date */}
                      {startDateStr && endDateStr && (
                        <p className="text-sm text-gray-500 mt-1">
                          Calculated duration: {calculateDurationDays(startDateStr, endDateStr)} days
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Activation Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Activation Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires-activation" className="font-medium">
                      Requires Activation
                    </Label>
                    <p className="text-sm text-gray-500">
                      Subscriptions will only become active after a specific date or manual activation
                    </p>
                  </div>
                  <Switch
                    id="requires-activation"
                    checked={requiresActivation}
                    onCheckedChange={setRequiresActivation}
                  />
                </div>

                {requiresActivation && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="activation-date">Activation Date (Optional)</Label>
                      <div className="flex w-full max-w-sm items-center space-x-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={`w-full justify-start text-left font-normal ${
                                !activationDate && "text-muted-foreground"
                              }`}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {activationDate ? format(activationDate, "PPP") : "Select activation date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={activationDate}
                              onSelect={handleActivationDateSelect}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        {activationDate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleActivationDateSelect(undefined)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {activationDate
                          ? `All subscriptions will activate on ${format(activationDate, "PPP")}`
                          : "Leave blank to activate subscriptions manually or based on auto-activation days"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="auto-activate-days">Auto-Activate After (Days)</Label>
                      <Input
                        id="auto-activate-days"
                        type="number"
                        min="0"
                        value={autoActivateAfterDays}
                        onChange={(e) => setAutoActivateAfterDays(e.target.value)}
                        placeholder="Enter days (0 for manual activation only)"
                      />
                      {errors.autoActivateAfterDays && (
                        <p className="text-sm text-red-500">{errors.autoActivateAfterDays}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Number of days after registration when subscriptions automatically activate (0 for manual
                        activation only)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Default for New Users */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Subscription Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="default-for-new-users" className="font-medium">
                      Default for New Users
                    </Label>
                    <p className="text-sm text-gray-500">
                      Automatically assign this subscription to new users when they register
                    </p>
                  </div>
                  <Switch
                    id="default-for-new-users"
                    checked={isDefaultForNewUsers}
                    onCheckedChange={setIsDefaultForNewUsers}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="one-time-only" className="font-medium">
                      One-Time Only
                    </Label>
                    <p className="text-sm text-gray-500">Users can only receive this subscription once</p>
                  </div>
                  <Switch id="one-time-only" checked={isOneTimeOnly} onCheckedChange={setIsOneTimeOnly} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/subscriptions")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Subscription"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
