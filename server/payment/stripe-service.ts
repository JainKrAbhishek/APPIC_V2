import Stripe from 'stripe';
import { storage } from '../storage';
import { UserType, SubscriptionStatus } from '../../shared/schema';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const PAYMENT_SUCCESS_URL = process.env.PAYMENT_SUCCESS_URL || 'http://localhost:5000/payment/success';
const PAYMENT_CANCEL_URL = process.env.PAYMENT_CANCEL_URL || 'http://localhost:5000/payment/cancel';

class StripeService {
  private stripe: Stripe;

  constructor() {
    // Only initialize Stripe if API key is provided
    if (STRIPE_SECRET_KEY) {
      try {
        this.stripe = new Stripe(STRIPE_SECRET_KEY, {
          apiVersion: '2023-10-16' as any // Use latest stable version
        });
      } catch (error) {
        console.warn('Failed to initialize Stripe:', error);
        this.stripe = null as any;
      }
    } else {
      console.warn('Stripe API key not provided. Payment functionality will be disabled.');
      this.stripe = null as any;
    }
  }

  // Check if Stripe client is properly initialized
  isConfigured(): boolean {
    return STRIPE_SECRET_KEY !== '' && STRIPE_SECRET_KEY !== undefined && this.stripe !== null;
  }

  // Create a customer in Stripe
  async createCustomer(
    userId: number,
    email: string,
    name: string
  ): Promise<string | null> {
    try {
      if (!this.isConfigured()) {
        console.warn('Stripe not configured. Customer not created.');
        return null;
      }

      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString()
        }
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return null;
    }
  }

  // Create a checkout session for a subscription
  async createCheckoutSession(
    userId: number,
    customerEmail: string,
    priceId: string,
    customerId?: string
  ): Promise<string | null> {
    try {
      if (!this.isConfigured()) {
        console.warn('Stripe not configured. Checkout session not created.');
        return null;
      }

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customerId,
        customer_email: !customerId ? customerEmail : undefined,
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId.toString()
        },
        success_url: PAYMENT_SUCCESS_URL,
        cancel_url: PAYMENT_CANCEL_URL,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  // Create a customer portal session for managing subscription
  async createPortalSession(
    customerId: string
  ): Promise<string | null> {
    try {
      if (!this.isConfigured()) {
        console.warn('Stripe not configured. Portal session not created.');
        return null;
      }

      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${PAYMENT_SUCCESS_URL}?portal=true`,
      });

      return portalSession.url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      return null;
    }
  }

  // Cancel a subscription
  async cancelSubscription(
    subscriptionId: string
  ): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.warn('Stripe not configured. Subscription not canceled.');
        return false;
      }

      await this.stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  // Handle webhook events from Stripe
  async handleWebhookEvent(
    eventBody: string,
    signature: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !STRIPE_WEBHOOK_SECRET) {
      console.warn('Stripe or webhook secret not configured.');
      return { success: false, error: 'Stripe not configured' };
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        eventBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid webhook signature'
      };
    }

    try {
      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleCheckoutSessionCompleted(session);
          break;
        }
        
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionCreated(subscription);
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionUpdated(subscription);
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionDeleted(subscription);
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaymentSucceeded(invoice);
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handleInvoicePaymentFailed(invoice);
          break;
        }
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Error handling webhook event ${event.type}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : `Error processing webhook ${event.type}` 
      };
    }
  }

  // Handle checkout.session.completed
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (!session.metadata?.userId || !session.customer || !session.subscription) {
      console.warn('Missing user ID, customer ID, or subscription ID in session:', session.id);
      return;
    }

    const userId = parseInt(session.metadata.userId);
    const customerId = typeof session.customer === 'string' 
      ? session.customer 
      : session.customer.id;
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    // Get subscription details
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    
    // Get the subscription plan details from our database based on the price ID
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.warn('No price ID found in subscription:', subscriptionId);
      return;
    }

    const plan = await storage.getSubscriptionPlanByStripePriceId(priceId);
    if (!plan) {
      console.warn('No plan found for price ID:', priceId);
      return;
    }

    // Update user subscription data
    await storage.updateUserSubscription(userId, {
      stripeCustomerId: customerId,
      subscriptionId: subscriptionId,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: plan.name,
      subscriptionPriceId: priceId,
      subscriptionStartDate: new Date(subscription.current_period_start * 1000),
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      userType: plan.userType,
    });
    
    // Get user data for email
    const user = await storage.getUser(userId);
    if (user && user.email) {
      // Send confirmation email
      // Import in the function to avoid circular dependency
      const { emailService } = await import('../email/email-service');
      
      await emailService.sendSubscriptionConfirmationEmail(
        user.email,
        user.firstName,
        plan.name,
        subscription.items.data[0]?.price.unit_amount || 0,
        subscription.items.data[0]?.plan.interval || 'month',
        new Date(subscription.current_period_start * 1000)
      );
    }
  }

  // Handle customer.subscription.created
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    // This is usually handled by checkout.session.completed, but included for completeness
    // This event is useful for subscriptions created outside the checkout flow
    
    // Get user ID from customer metadata
    const customer = await this.stripe.customers.retrieve(subscription.customer as string);
    if (!customer || customer.deleted) {
      console.warn('Customer not found or deleted:', subscription.customer);
      return;
    }
    
    const userId = customer.metadata?.userId;
    if (!userId) {
      console.warn('No user ID found in customer metadata:', customer.id);
      return;
    }
    
    // The rest is similar to handleCheckoutSessionCompleted...
  }

  // Handle customer.subscription.updated
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    // Retrieve the customer and get the associated user ID
    const customer = await this.stripe.customers.retrieve(subscription.customer as string);
    if (!customer || customer.deleted) {
      console.warn('Customer not found or deleted:', subscription.customer);
      return;
    }
    
    const userId = customer.metadata?.userId;
    if (!userId) {
      console.warn('No user ID found in customer metadata:', customer.id);
      return;
    }
    
    // Determine the new status
    let status: string;
    switch (subscription.status) {
      case 'active':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'canceled':
        status = SubscriptionStatus.CANCELED;
        break;
      case 'past_due':
        status = SubscriptionStatus.PAST_DUE;
        break;
      case 'trialing':
        status = SubscriptionStatus.TRIAL;
        break;
      default:
        status = SubscriptionStatus.NONE;
    }
    
    // Get the price ID and plan
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.warn('No price ID found in subscription:', subscription.id);
      return;
    }

    const plan = await storage.getSubscriptionPlanByStripePriceId(priceId);
    if (!plan) {
      console.warn('No plan found for price ID:', priceId);
      return;
    }
    
    // Update user subscription data
    await storage.updateUserSubscription(parseInt(userId), {
      subscriptionStatus: status,
      subscriptionPlan: plan.name,
      subscriptionPriceId: priceId,
      subscriptionStartDate: new Date(subscription.current_period_start * 1000),
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
      userType: subscription.status === 'active' ? plan.userType : UserType.FREE,
    });
  }

  // Handle customer.subscription.deleted
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    // Retrieve the customer and get the associated user ID
    const customer = await this.stripe.customers.retrieve(subscription.customer as string);
    if (!customer || customer.deleted) {
      console.warn('Customer not found or deleted:', subscription.customer);
      return;
    }
    
    const userId = customer.metadata?.userId;
    if (!userId) {
      console.warn('No user ID found in customer metadata:', customer.id);
      return;
    }
    
    // Update user subscription data
    await storage.updateUserSubscription(parseInt(userId), {
      subscriptionStatus: SubscriptionStatus.CANCELED,
      userType: UserType.FREE,
    });
  }

  // Handle invoice.payment_succeeded
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription || !invoice.customer) {
      console.warn('Missing subscription or customer ID in invoice:', invoice.id);
      return;
    }
    
    // Retrieve the subscription to get the latest details
    const subscription = await this.stripe.subscriptions.retrieve(
      typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
    );
    
    // Retrieve the customer to get the user ID
    const customer = await this.stripe.customers.retrieve(
      typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id
    );
    
    if (!customer || customer.deleted) {
      console.warn('Customer not found or deleted:', invoice.customer);
      return;
    }
    
    const userId = customer.metadata?.userId;
    if (!userId) {
      console.warn('No user ID found in customer metadata:', customer.id);
      return;
    }
    
    // Update only the necessary subscription data
    await storage.updateUserSubscription(parseInt(userId), {
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionStartDate: new Date(subscription.current_period_start * 1000),
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    });
  }

  // Handle invoice.payment_failed
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription || !invoice.customer) {
      console.warn('Missing subscription or customer ID in invoice:', invoice.id);
      return;
    }
    
    // Retrieve the customer to get the user ID
    const customer = await this.stripe.customers.retrieve(
      typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id
    );
    
    if (!customer || customer.deleted) {
      console.warn('Customer not found or deleted:', invoice.customer);
      return;
    }
    
    const userId = customer.metadata?.userId;
    if (!userId) {
      console.warn('No user ID found in customer metadata:', customer.id);
      return;
    }
    
    // Update subscription status to past_due
    await storage.updateUserSubscription(parseInt(userId), {
      subscriptionStatus: SubscriptionStatus.PAST_DUE,
    });
  }
}

// Singleton instance
export const stripeService = new StripeService();