import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { SubscriptionDetails } from "@/components/subscription/subscription-details"

interface SubscriptionPageProps {
  params: {
    id: string
  }
}

const SubscriptionPage = async ({ params }: SubscriptionPageProps) => {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/")
  }

  const { data: subscription } = await db
    .from("subscriptions")
    .select(`
      *,
      plan:plans(*),
      user:users(*)
    `)
    .eq("id", params.id)
    .single()

  if (!subscription) {
    return notFound()
  }

  if (subscription.userId !== userId) {
    // Check if the user is an admin.  If not, redirect.
    const { data: user } = await db
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (!user?.isAdmin) {
      return redirect("/instructor/subscriptions")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-md border bg-muted p-4 mb-4">
        <p className="text-sm text-muted-foreground">
          This subscription is managed by an administrator. You have read-only access.
        </p>
      </div>
      <SubscriptionDetails subscription={subscription} readOnly={true} />
    </div>
  )
}

export default SubscriptionPage
