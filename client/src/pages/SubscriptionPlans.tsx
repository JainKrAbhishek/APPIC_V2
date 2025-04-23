import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import SubscriptionPlanCard from "@/components/auth/SubscriptionPlanCard";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Crown, Calendar, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface SubscriptionPlan {
  id: number;
  name: string;
  userType: string;
  description: string;
  price: number;
  billingPeriod: string;
  stripePriceId: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  featuresJson: unknown;
  intervalCount?: number;
  interval?: string;
  monthlyEquivalentPrice?: number;
  features: string[];
  popular?: boolean;
  limitedTimeOffer?: string;
  refundPolicy?: string;
}

interface SubscriptionPlansProps {
  user: User;
}

const SubscriptionPlans = ({ user }: SubscriptionPlansProps) => {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"success" | "canceled" | null>(null);

  // Extract status from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlStatus = searchParams.get("status");

    if (urlStatus === "success" || urlStatus === "canceled") {
      setStatus(urlStatus);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch subscription plans
  const {
    data: plans,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscriptions/plans'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle subscription management
  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to get portal session");
      }

      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
    }
  };

  return (
    <DashboardLayout title="Subscription Plans" user={user}>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select the perfect plan to accelerate your GRE preparation
          </p>
        </div>

        {/* Current subscription card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Current Subscription
                </h2>

                <div className="flex items-center gap-2">
                  <Badge variant="default" className={
                    user.subscriptionStatus === "active"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  }>
                    {user.subscriptionPlan || "Free"}
                  </Badge>
                  {user.subscriptionStatus && user.subscriptionStatus !== "active" && (
                    <Badge variant="default" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 capitalize">
                      {user.subscriptionStatus}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {user.subscriptionEndDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {user.subscriptionStatus === "canceled" ? "Access until" : "Next billing"}: {" "}
                        {new Date(user.subscriptionEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {user.stripeCustomerId && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment method on file</span>
                    </div>
                  )}
                </div>
              </div>

              {user.subscriptionId && (
                <Button
                  onClick={handleManageSubscription}
                  variant="outline"
                  className="shrink-0 border-gray-200 dark:border-gray-700"
                >
                  Manage Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status alerts */}
        {status === "success" && (
          <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
            <Crown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertTitle className="text-emerald-800 dark:text-emerald-300">
              Subscription Activated!
            </AlertTitle>
            <AlertDescription className="text-emerald-700 dark:text-emerald-400">
              Your premium features are now unlocked. Start exploring your enhanced learning experience!
            </AlertDescription>
          </Alert>
        )}

        {status === "canceled" && (
          <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">
              Subscription Not Completed
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Your subscription process was canceled. No charges were made. Feel free to try again when you're ready.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center space-y-4">
              <Spinner size="lg" className="mx-auto" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading subscription plans...
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-800 dark:text-red-300">
              Failed to load plans
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400">
              {error instanceof Error ? error.message : "An unknown error occurred"}
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-3 w-full sm:w-auto border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription plans grid */}
        {plans && plans.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
              Available Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  currentPlan={user.subscriptionPlan}
                  user={user}
                />
              ))}
            </div>
          </div>
        )}

        {/* No plans available */}
        {plans && plans.length === 0 && !isLoading && !isError && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Plans Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are currently no subscription plans available. Please check back later.
            </p>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 space-y-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                  How do I cancel my subscription?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You can cancel your subscription anytime through your account settings.
                  You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  We accept all major credit cards including Visa, Mastercard, American Express,
                  and Discover through our secure payment system.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                  Is there a refund policy?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Yes, we offer a 7-day money-back guarantee on all new subscriptions.
                  Contact our support team within 7 days of purchase for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPlans;