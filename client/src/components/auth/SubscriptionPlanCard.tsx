import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "@shared/schema";

// Define extended SubscriptionPlan type with additional properties
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
  
  // Extended properties
  intervalCount?: number;
  interval?: string;
  monthlyEquivalentPrice?: number;
  features: string[];
  popular?: boolean;
  limitedTimeOffer?: string;
  refundPolicy?: string;
}
import { apiRequest } from "@/lib/queryClient";

// Extend the Response interface
interface SubscriptionResponse {
  checkoutUrl?: string;
  portalUrl?: string;
}
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  currentPlan?: string | null;
  user?: User | null;
  onSubscribe?: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlanCard = ({
  plan,
  currentPlan,
  user,
  onSubscribe,
}: SubscriptionPlanCardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const isCurrentPlan = currentPlan === plan.name;
  const isYearly = plan.intervalCount === 12;
  
  // Calculate savings percentage for yearly plans
  const savingsPercent = isYearly && plan.monthlyEquivalentPrice
    ? Math.round(((plan.monthlyEquivalentPrice * 12 - plan.price) / (plan.monthlyEquivalentPrice * 12)) * 100)
    : 0;

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (isCurrentPlan) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Create checkout session
      const response = await apiRequest("/api/subscriptions/create-checkout", {
        method: "POST",
        data: {
          priceId: plan.stripePriceId,
        },
      }) as SubscriptionResponse;
      
      if (response && response.checkoutUrl) {
        // Using window.location.href is acceptable here since
        // we're navigating to an external Stripe URL, not within our app
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Subscription error",
        description: "There was an error processing your subscription. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${
      isCurrentPlan ? 'border-2 border-emerald-500 dark:border-emerald-400' : 'hover:border-emerald-200 dark:hover:border-emerald-800'
    }`}>
      {/* Plan header with featured badge */}
      <CardHeader className={`pb-4 relative ${
        plan.popular ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20' : ''
      }`}>
        {plan.popular && (
          <Badge 
            variant="default" 
            className="absolute -top-1 right-4 font-medium bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            Most Popular
          </Badge>
        )}
        
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            {plan.name}
          </CardTitle>
          
          {isYearly && savingsPercent > 0 && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              Save {savingsPercent}%
            </Badge>
          )}
        </div>
        
        <CardDescription>
          {plan.description}
        </CardDescription>
        
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">${(plan.price / 100).toFixed(2)}</span>
          <span className="ml-1 text-gray-500 dark:text-white/60">
            /{plan.interval}
          </span>
          
          {plan.monthlyEquivalentPrice && isYearly && (
            <span className="ml-2 text-xs text-gray-500 dark:text-white/50">
              ${(plan.monthlyEquivalentPrice / 100).toFixed(2)}/mo
            </span>
          )}
        </div>
      </CardHeader>
      
      {/* Features list */}
      <CardContent className="pb-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex">
              <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mr-2" />
              <span className="text-sm text-gray-600 dark:text-white/70">{feature}</span>
            </li>
          ))}
        </ul>
        
        {plan.limitedTimeOffer && (
          <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md border border-emerald-100 dark:border-emerald-800/50">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center">
              <Info className="h-4 w-4 mr-1" />
              {plan.limitedTimeOffer}
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Action button */}
      <CardFooter className="bg-gray-50 dark:bg-gray-900/30 pt-4 pb-4">
        <div className="w-full">
          <Button 
            onClick={handleSubscribe}
            className={`w-full ${
              isCurrentPlan
                ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
            }`}
            disabled={isLoading || isCurrentPlan}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : isCurrentPlan ? (
              "Current Plan"
            ) : (
              "Subscribe Now"
            )}
          </Button>
          
          {plan.refundPolicy && (
            <div className="mt-3 flex justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-gray-500 dark:text-white/50 flex items-center cursor-help">
                      <HelpCircle className="h-3 w-3 mr-1" />
                      {plan.refundPolicy}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      You can cancel your subscription at any time from your account settings.
                      Refund eligibility is based on our refund policy.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionPlanCard;