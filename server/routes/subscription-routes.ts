import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { stripeService } from "../payment/stripe-service";
import { User } from "../../shared/schema";
import { isAuthenticated, isAdmin } from "../middleware/auth";

const router = Router();

// Get active subscription plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await storage.getActiveSubscriptionPlans();
    
    // Transform plans for frontend consumption
    const formattedPlans = plans.map((plan) => {
      // Parse features from JSON if stored as JSON string
      let features: string[] = [];
      try {
        if (typeof plan.featuresJson === 'string') {
          features = JSON.parse(plan.featuresJson as string);
        } else if (Array.isArray(plan.featuresJson)) {
          features = plan.featuresJson as string[];
        }
      } catch (error) {
        console.error("Error parsing features JSON:", error);
      }
      
      // Get interval and interval count from billing period
      // Assuming billingPeriod is stored as "monthly" or "yearly"
      const interval = plan.billingPeriod === "yearly" ? "year" : "month";
      const intervalCount = plan.billingPeriod === "yearly" ? 12 : 1;
      
      // Calculate monthly equivalent price for yearly plans for comparison
      let monthlyEquivalentPrice = null;
      if (plan.billingPeriod === "yearly") {
        monthlyEquivalentPrice = Math.round(plan.price / 12);
      }
      
      return {
        ...plan,
        features,
        interval,
        intervalCount,
        monthlyEquivalentPrice,
        // Set default values for UI properties if not present
        popular: plan.name.toLowerCase().includes("pro"),
        limitedTimeOffer: null,
        refundPolicy: "7-day money-back guarantee"
      };
    });
    
    res.json(formattedPlans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

// Create a Stripe Checkout session
router.post("/create-checkout", isAuthenticated, async (req, res) => {
  try {
    const schema = z.object({
      priceId: z.string().min(1, "Price ID is required")
    });
    
    const { priceId } = schema.parse(req.body);
    const user = req.user as User;
    
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
      return res.status(503).json({ 
        error: "Payment service is currently unavailable. Please try again later."
      });
    }
    
    // Get the subscription plan from the database
    const plan = await storage.getSubscriptionPlanByStripePriceId(priceId);
    if (!plan) {
      return res.status(404).json({ error: "Subscription plan not found" });
    }
    
    // Create a checkout session
    const checkoutUrl = await stripeService.createCheckoutSession(
      user.id,
      user.email,
      priceId
    );
    
    if (!checkoutUrl) {
      throw new Error("Failed to create checkout session");
    }
    
    res.json({ checkoutUrl });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Create a Stripe Customer Portal session
router.post("/portal", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as User;
    
    // Check if user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "You don't have an active subscription" });
    }
    
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
      return res.status(503).json({ 
        error: "Payment service is currently unavailable. Please try again later."
      });
    }
    
    // Create a portal session
    const portalUrl = await stripeService.createPortalSession(
      user.stripeCustomerId
    );
    
    if (!portalUrl) {
      throw new Error("Failed to create portal session");
    }
    
    res.json({ portalUrl });
  } catch (error) {
    console.error("Error creating portal session:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Webhook endpoint for Stripe events
router.post("/webhook", async (req, res) => {
  // Get the signature from the header
  const signature = req.headers["stripe-signature"] as string;
  
  if (!signature) {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }
  
  try {
    // Check if Stripe is configured
    if (!stripeService.isConfigured()) {
      return res.status(503).json({ 
        error: "Payment service is currently unavailable"
      });
    }
    
    // Verify and handle the webhook
    await stripeService.handleWebhookEvent(req.body, signature);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    res.status(400).json({ error: "Webhook error" });
  }
});

// User's subscription status
router.get("/status", isAuthenticated, async (req, res) => {
  try {
    const user = req.user as User;
    
    // Return relevant subscription information
    res.json({
      subscriptionId: user.subscriptionId,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
});

// Create a subscription plan (admin only)
router.post("/plans", isAuthenticated, async (req, res) => {
  try {
    // Check if user is admin
    const user = req.user as User;
    if (!user.isAdmin && user.userType !== 'admin') {
      return res.status(403).json({ error: "Only admins can create subscription plans" });
    }
    
    // Validate input data
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().min(1, "Description is required"),
      userType: z.string().min(1, "User type is required"),
      price: z.number().min(0, "Price must be positive"),
      billingPeriod: z.string().min(1, "Billing period is required"),
      stripePriceId: z.string().optional(),
      features: z.array(z.string()).optional(),
      isActive: z.boolean().optional()
    });
    
    const { features, ...planData } = schema.parse(req.body);
    
    // Convert features array to JSON
    const featuresJson = features || [];
    
    // Create the plan
    const plan = await storage.createSubscriptionPlan({
      ...planData,
      featuresJson: featuresJson as any
    });
    
    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid plan data", details: error.errors });
    }
    
    res.status(500).json({ error: "Failed to create subscription plan" });
  }
});

export default router;