import { AdminLayout } from "@/components/admin-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Loading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />

        <Tabs defaultValue="all-reviews">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-reviews">All Reviews</TabsTrigger>
            <TabsTrigger value="create-review">Create Review</TabsTrigger>
          </TabsList>

          <TabsContent value="all-reviews" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-7 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Skeleton className="h-5 w-32 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-16 w-full my-2" />
                        <div className="flex gap-2 mt-4">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-16" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
