"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function ApiVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRazorpayDetails, setShowRazorpayDetails] = useState(false)
  const [showSupabaseDetails, setShowSupabaseDetails] = useState(false)

  const verifyRazorpaySetup = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/razorpay/verify-setup")

      if (!response.ok) {
        throw new Error(`API verification failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      console.error("Error verifying API setup:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verifyRazorpaySetup()
  }, [])

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">API Integration Verification</h1>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Razorpay Integration Status</span>
                  <Button variant="outline" size="sm" onClick={verifyRazorpaySetup}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>Verification of your Razorpay payment gateway integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="mb-4">
                    <Alert
                      className={
                        results?.results?.api_test?.success
                          ? "bg-green-50 border-green-200"
                          : "bg-amber-50 border-amber-200"
                      }
                    >
                      {results?.results?.api_test?.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                      )}
                      <AlertTitle className={results?.results?.api_test?.success ? "text-green-800" : "text-amber-800"}>
                        {results?.results?.api_test?.success
                          ? "Razorpay API Connected Successfully"
                          : "Razorpay API Connection Issues Detected"}
                      </AlertTitle>
                      <AlertDescription
                        className={results?.results?.api_test?.success ? "text-green-700" : "text-amber-700"}
                      >
                        {results?.results?.api_test?.message}
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* Environment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-1">Environment</h3>
                      <p className="text-sm">{results?.results?.environment}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-1">API Key Type</h3>
                      <p className="text-sm flex items-center">
                        {results?.results?.config_status?.razorpay_key_id?.type || "Unknown"}
                        {results?.results?.config_status?.razorpay_key_id?.type === "TEST" && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Test Mode
                          </span>
                        )}
                        {results?.results?.config_status?.razorpay_key_id?.type === "LIVE" && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Live Mode
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Configuration Status */}
                  <div>
                    <h3 className="font-medium mb-2">Configuration Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        {results?.results?.config_status?.razorpay_key_id?.exists ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Server API Key (RAZORPAY_KEY_ID)</p>
                          <p className="text-xs text-gray-500">
                            {results?.results?.config_status?.razorpay_key_id?.exists
                              ? results?.results?.config_status?.razorpay_key_id?.value
                              : "Not configured"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {results?.results?.config_status?.key_secret?.exists ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">API Secret Key (RAZORPAY_KEY_SECRET)</p>
                          <p className="text-xs text-gray-500">
                            {results?.results?.config_status?.key_secret?.exists
                              ? results?.results?.config_status?.key_secret?.value
                              : "Not configured"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {results?.results?.config_status?.webhook_secret?.exists ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Webhook Secret (RAZORPAY_WEBHOOK_SECRET)</p>
                          <p className="text-xs text-gray-500">
                            {results?.results?.config_status?.webhook_secret?.exists ? "Configured" : "Not configured"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Test Results */}
                  {results?.results?.api_test && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-2">API Connection Test</h3>
                        {results.results.api_test.success ? (
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                            <AlertDescription className="text-green-700">
                              Successfully connected to the Razorpay API. Your integration is working.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Connection Failed</AlertTitle>
                            <AlertDescription>
                              {results.results.api_test.error || "Could not connect to Razorpay API"}
                              {results.results.api_test.status === 401 && (
                                <p className="mt-1">This usually indicates invalid API credentials.</p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </>
                  )}

                  {/* Warnings */}
                  {results?.results?.warnings && results.results.warnings.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-2">Warnings</h3>
                        <Alert variant="warning">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Configuration Warnings</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              {results.results.warnings.map((warning: string, i: number) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </>
                  )}

                  {/* Recommendations */}
                  {results?.recommendations && results.recommendations.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-2">Recommendations</h3>
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Suggested Actions</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              {results.recommendations.map((rec: string, i: number) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </>
                  )}

                  {/* Advanced Details */}
                  <Collapsible open={showRazorpayDetails} onOpenChange={setShowRazorpayDetails} className="mt-4">
                    <Separator />
                    <div className="py-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="flex w-full justify-between p-0">
                          <span className="font-medium">Advanced Technical Details</span>
                          {showRazorpayDetails ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-2">
                      <div className="rounded-md bg-gray-50 p-4">
                        <pre className="text-xs overflow-auto">{JSON.stringify(results?.results, null, 2)}</pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={verifyRazorpaySetup}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Verification Again
                </Button>
                <Button variant="outline" onClick={() => window.open("https://dashboard.razorpay.com", "_blank")}>
                  Open Razorpay Dashboard
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Supabase Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Supabase Integration Status</span>
                </CardTitle>
                <CardDescription>Verification of your Supabase database integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="mb-4">
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="text-green-800">Supabase Integration Active</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Your Supabase integration is configured and active.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Supabase URL</p>
                        <p className="text-xs text-gray-500">Configured</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Supabase Anon Key</p>
                        <p className="text-xs text-gray-500">Configured</p>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Details */}
                  <Collapsible open={showSupabaseDetails} onOpenChange={setShowSupabaseDetails} className="mt-4">
                    <Separator />
                    <div className="py-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="flex w-full justify-between p-0">
                          <span className="font-medium">Advanced Technical Details</span>
                          {showSupabaseDetails ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-2">
                      <div className="rounded-md bg-gray-50 p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-xs font-medium">SUPABASE_URL</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {process.env.NEXT_PUBLIC_SUPABASE_URL
                                ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20) + "..."
                                : "Not available in client"}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-xs font-medium">SUPABASE_ANON_KEY</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                                ? "●●●●●●●●●●●●●●●●"
                                : "Not available in client"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => window.open("https://app.supabase.com", "_blank")}>
                  Open Supabase Dashboard
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
