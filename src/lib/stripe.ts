import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set in environment variables - Stripe functionality will be disabled');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export const getStripePublishableKey = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
    return 'pk_test_dummy_key';
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

// Stripe webhook endpoint secret
export const getStripeWebhookSecret = () => {
  return process.env.STRIPE_WEBHOOK_SECRET || '';
};

// Create payment intent for wholesale domain purchase
export const createWholesalePaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        type: 'wholesale_domain_purchase',
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error('Failed to create payment intent');
  }
};

// Retrieve payment intent
export const retrievePaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw new Error('Failed to retrieve payment intent');
  }
};

// Create customer for wholesale purchase
export const createCustomer = async (email: string, name?: string) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }
};

// Format amount for display
export const formatAmount = (amount: number, currency: string = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Validate webhook signature
export const validateWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
) => {
  try {
    const event = Stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    throw new Error('Invalid webhook signature');
  }
};
