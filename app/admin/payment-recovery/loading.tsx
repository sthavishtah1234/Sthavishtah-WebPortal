import { Skeleton } from "@/components/ui/skeleton"
import AdminLayout from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentRecoveryLoading() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Payment Recovery</h1>
          <Skeleton className="h-10 w-24" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unrecorded Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-full max-w-[300px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-full max-w-[250px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-full max-w-[280px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Payment Recovery Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Skeleton className="h-5 w-[150px] mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%] mt-1" />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <Skeleton className="h-5 w-[150px] mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%] mt-1" />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <Skeleton className="h-5 w-[150px] mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%] mt-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
