'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export default function StripeTestPage() {
  const [keyCheckResult, setKeyCheckResult] = useState<any>(null)
  const [keyCheckLoading, setKeyCheckLoading] = useState(false)
  
  const [dbTestResult, setDbTestResult] = useState<any>(null)
  const [dbTestLoading, setDbTestLoading] = useState(false)
  const [userId, setUserId] = useState('0e749b0e-c379-4b83-9666-2ade83ea5999')
  const [subscriptionId, setSubscriptionId] = useState('sub_test_' + Math.random().toString(36).substring(2, 10))
  const [isAnnualTest, setIsAnnualTest] = useState(false)
  
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null)
  const [webhookTestLoading, setWebhookTestLoading] = useState(false)
  const [webhookPayload, setWebhookPayload] = useState(JSON.stringify({
    id: 'evt_test_webhook',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_123456',
        status: 'active',
        customer: 'cus_test_123456',
        created: Math.floor(Date.now() / 1000),
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
        items: {
          data: [{ price: { id: 'price_test_123456' } }]
        },
        metadata: {
          supabase_user_id: '0e749b0e-c379-4b83-9666-2ade83ea5999'
        }
      }
    }
  }, null, 2))

  const [annualTestResult, setAnnualTestResult] = useState<any>(null)
  const [annualTestLoading, setAnnualTestLoading] = useState(false)
  const [annualPriceId, setAnnualPriceId] = useState('price_1QuPTtKs7sR77VGViWjiz1tm')

  const checkStripeKeys = async () => {
    setKeyCheckLoading(true)
    try {
      const response = await fetch('/api/check-stripe-keys')
      const data = await response.json()
      setKeyCheckResult(data)
    } catch (error) {
      setKeyCheckResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setKeyCheckLoading(false)
    }
  }

  const testDatabaseUpdate = async () => {
    setDbTestLoading(true)
    try {
      const response = await fetch('/api/test-subscription-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscriptionId,
          status: 'active',
          priceId: isAnnualTest ? annualPriceId : ('price_test_' + Math.random().toString(36).substring(2, 10)),
          isAnnual: isAnnualTest
        })
      })
      const data = await response.json()
      setDbTestResult(data)
    } catch (error) {
      setDbTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setDbTestLoading(false)
    }
  }

  const testWebhook = async () => {
    setWebhookTestLoading(true);
    try {
      // Use our test webhook handler instead of the main webhook endpoint
      const response = await fetch('/api/test-webhook-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: webhookPayload
      });
      
      const data = await response.json();
      setWebhookTestResult({
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      // Log detailed information for debugging
      console.log('Webhook test response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (error) {
      console.error('Webhook test error:', error);
      setWebhookTestResult({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
        statusText: 'Error'
      });
    } finally {
      setWebhookTestLoading(false);
    }
  };

  const testAnnualSubscription = async () => {
    setAnnualTestLoading(true)
    try {
      // Create a test payload with the annual price ID
      const testPayload = {
        id: 'evt_test_annual_' + Math.random().toString(36).substring(2, 10),
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_annual_' + Math.random().toString(36).substring(2, 10),
            status: 'active',
            customer: 'cus_test_annual',
            created: Math.floor(Date.now() / 1000),
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year from now
            items: {
              data: [{ 
                price: { 
                  id: annualPriceId,
                  recurring: {
                    interval: 'year',
                    interval_count: 1
                  }
                },
                quantity: 1
              }]
            },
            metadata: {
              supabase_user_id: userId
            }
          }
        }
      }
      
      // Call our test webhook handler
      const response = await fetch('/api/test-webhook-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      })
      
      const data = await response.json()
      setAnnualTestResult(data)
    } catch (error) {
      setAnnualTestResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setAnnualTestLoading(false)
    }
  }

  const resetWebhookPayload = () => {
    const defaultPayload = {
      id: 'evt_test_webhook_' + Math.random().toString(36).substring(2, 10),
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_' + Math.random().toString(36).substring(2, 10),
          status: 'active',
          customer: 'cus_test_' + Math.random().toString(36).substring(2, 10),
          created: Math.floor(Date.now() / 1000),
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          items: {
            data: [{ 
              price: { 
                id: 'price_test_' + Math.random().toString(36).substring(2, 10),
                recurring: {
                  interval: 'month',
                  interval_count: 1
                }
              },
              quantity: 1
            }]
          },
          metadata: {
            supabase_user_id: userId
          }
        }
      }
    };
    
    setWebhookPayload(JSON.stringify(defaultPayload, null, 2));
    setWebhookTestResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0f1729] p-8">
      <h1 className="text-3xl font-mono text-white mb-8">
        <span className="text-white text-shadow-sm -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
          Stripe Integration Test Panel
        </span>
      </h1>
      
      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="mb-4 bg-white/5">
          <TabsTrigger value="keys" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white">Stripe Keys</TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white">Database Test</TabsTrigger>
          <TabsTrigger value="webhook" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white">Webhook Test</TabsTrigger>
          <TabsTrigger value="annual" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-white">Annual Plan Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="keys">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Stripe API Key Verification</CardTitle>
              <CardDescription className="text-white/70">
                Check if your Stripe API keys are correctly configured and working
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                onClick={checkStripeKeys} 
                disabled={keyCheckLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {keyCheckLoading ? 'Checking...' : 'Check Stripe Keys'}
              </Button>
              
              {keyCheckResult && (
                <div className="mt-6">
                  <Alert variant={keyCheckResult.stripeKeyWorks ? "default" : "destructive"} className={keyCheckResult.stripeKeyWorks ? "bg-green-900/50 border-green-700 text-green-300" : "bg-red-900/50 border-red-700 text-red-300"}>
                    <div className="flex items-center gap-2">
                      {keyCheckResult.stripeKeyWorks ? 
                        <CheckCircleIcon className="h-4 w-4 text-green-400" /> : 
                        <AlertCircleIcon className="h-4 w-4 text-red-400" />
                      }
                      <AlertTitle className="font-semibold">
                        {keyCheckResult.stripeKeyWorks ? 'Success' : 'Error'}
                      </AlertTitle>
                    </div>
                    <AlertDescription className="mt-2">
                      {keyCheckResult.message}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6 p-4 bg-black/20 rounded-md border border-white/10">
                    <h3 className="font-medium mb-2 text-white">Key Information:</h3>
                    <pre className="text-sm overflow-auto p-3 bg-black/30 rounded border border-white/10 text-white/90">
                      {JSON.stringify(keyCheckResult.keyInfo, null, 2)}
                    </pre>
                    
                    {keyCheckResult.stripeError && (
                      <>
                        <h3 className="font-medium mt-6 mb-2 text-white">Error Details:</h3>
                        <pre className="text-sm overflow-auto p-3 bg-black/30 rounded border border-white/10 text-white/90">
                          {JSON.stringify(keyCheckResult.stripeError, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Database Update Test</CardTitle>
              <CardDescription className="text-white/70">
                Test if we can directly update the database with subscription data
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="userId" className="text-white font-medium">User ID</Label>
                  <Input 
                    id="userId" 
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)}
                    className="mt-1 border-white/10 bg-black/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subscriptionId" className="text-white font-medium">Subscription ID</Label>
                  <Input 
                    id="subscriptionId" 
                    value={subscriptionId} 
                    onChange={(e) => setSubscriptionId(e.target.value)}
                    className="mt-1 border-white/10 bg-black/20 text-white"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAnnualTest" 
                    checked={isAnnualTest}
                    onChange={(e) => setIsAnnualTest(e.target.checked)}
                    className="h-4 w-4 rounded border border-white/30 bg-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  <Label 
                    htmlFor="isAnnualTest" 
                    className="text-white font-medium cursor-pointer"
                  >
                    Use Annual Price ({isAnnualTest ? annualPriceId : 'Random test price'})
                  </Label>
                </div>
                
                <Button 
                  onClick={testDatabaseUpdate} 
                  disabled={dbTestLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {dbTestLoading ? 'Testing...' : 'Test Database Update'}
                </Button>
              </div>
              
              {dbTestResult && (
                <div className="mt-6">
                  <Alert variant={dbTestResult.status === 'success' ? "default" : "destructive"} className={dbTestResult.status === 'success' ? "bg-green-900/50 border-green-700 text-green-300" : "bg-red-900/50 border-red-700 text-red-300"}>
                    <div className="flex items-center gap-2">
                      {dbTestResult.status === 'success' ? 
                        <CheckCircleIcon className="h-4 w-4 text-green-400" /> : 
                        <AlertCircleIcon className="h-4 w-4 text-red-400" />
                      }
                      <AlertTitle className="font-semibold">
                        {dbTestResult.status === 'success' ? 'Success' : 'Error'}
                      </AlertTitle>
                    </div>
                    <AlertDescription className="mt-2">
                      {dbTestResult.message}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6 p-4 bg-black/20 rounded-md border border-white/10">
                    <h3 className="font-medium mb-2 text-white">Response Details:</h3>
                    <pre className="text-sm overflow-auto p-3 bg-black/30 rounded border border-white/10 text-white/90">
                      {JSON.stringify(dbTestResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="webhook">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Webhook Test</CardTitle>
              <CardDescription className="text-white/70">
                Test the webhook handler with a sample payload (bypasses signature verification)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="webhookPayload" className="text-white font-medium">Webhook Payload (JSON)</Label>
                  <Textarea 
                    id="webhookPayload" 
                    value={webhookPayload} 
                    onChange={(e) => setWebhookPayload(e.target.value)}
                    className="mt-1 font-mono text-sm border-white/10 bg-black/20 text-white"
                    rows={12}
                  />
                </div>
                
                <div className="flex space-x-4">
                  <Button 
                    onClick={testWebhook} 
                    disabled={webhookTestLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {webhookTestLoading ? 'Testing...' : 'Test Webhook Handler'}
                  </Button>
                  
                  <Button
                    onClick={resetWebhookPayload}
                    variant="outline"
                    className="border-white/10 hover:bg-white/10 text-white"
                  >
                    Reset Webhook Payload
                  </Button>
                </div>
              </div>
              
              {webhookTestResult && (
                <div className="mt-6">
                  <Alert variant={webhookTestResult.status === 200 ? "default" : "destructive"} className={webhookTestResult.status === 200 ? "bg-green-900/50 border-green-700 text-green-300" : "bg-red-900/50 border-red-700 text-red-300"}>
                    <div className="flex items-center gap-2">
                      {webhookTestResult.status === 200 ? 
                        <CheckCircleIcon className="h-4 w-4 text-green-400" /> : 
                        <AlertCircleIcon className="h-4 w-4 text-red-400" />
                      }
                      <AlertTitle className="font-semibold">
                        Status: {webhookTestResult.status} {webhookTestResult.statusText}
                      </AlertTitle>
                    </div>
                  </Alert>
                  
                  <div className="mt-6 p-4 bg-black/20 rounded-md border border-white/10">
                    <h3 className="font-medium mb-2 text-white">Response Details:</h3>
                    <pre className="text-sm overflow-auto p-3 bg-black/30 rounded border border-white/10 text-white/90 max-h-96">
                      {JSON.stringify(webhookTestResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annual">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle>Annual Subscription Test</CardTitle>
              <CardDescription className="text-white/70">
                Test processing an annual subscription with the real price ID
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="userId" className="text-white font-medium">User ID</Label>
                  <Input 
                    id="userId" 
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)}
                    className="mt-1 border-white/10 bg-black/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="annualPriceId" className="text-white font-medium">Annual Price ID</Label>
                  <Input 
                    id="annualPriceId" 
                    value={annualPriceId} 
                    onChange={(e) => setAnnualPriceId(e.target.value)}
                    className="mt-1 border-white/10 bg-black/20 text-white"
                  />
                </div>
                
                <Button 
                  onClick={testAnnualSubscription} 
                  disabled={annualTestLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {annualTestLoading ? 'Testing...' : 'Test Annual Subscription'}
                </Button>
              </div>
              
              {annualTestResult && (
                <div className="mt-6">
                  <Alert variant={annualTestResult.status === 'success' ? "default" : "destructive"} className={annualTestResult.status === 'success' ? "bg-green-900/50 border-green-700 text-green-300" : "bg-red-900/50 border-red-700 text-red-300"}>
                    <div className="flex items-center gap-2">
                      {annualTestResult.status === 'success' ? 
                        <CheckCircleIcon className="h-4 w-4 text-green-400" /> : 
                        <AlertCircleIcon className="h-4 w-4 text-red-400" />
                      }
                      <AlertTitle className="font-semibold">
                        {annualTestResult.status === 'success' ? 'Success' : 'Error'}
                      </AlertTitle>
                    </div>
                    <AlertDescription className="mt-2">
                      {annualTestResult.message || 'Test completed'}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6 p-4 bg-black/20 rounded-md border border-white/10">
                    <h3 className="font-medium mb-2 text-white">Response Details:</h3>
                    <pre className="text-sm overflow-auto p-3 bg-black/30 rounded border border-white/10 text-white/90 max-h-96">
                      {JSON.stringify(annualTestResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 