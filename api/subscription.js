import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get trial configuration from environment variables
const trialPriceId = process.env.TRIAL_PRODUCT_PRICE_ID;
const trialDaysEnv = process.env.TRIAL_PERIOD_DAYS;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end('Method Not Allowed');
  }

  const { priceId } = request.body;
  if (!priceId) return response.status(400).json({ error: 'Missing priceId' });

  try {
    // Price validation
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active) return response.status(400).json({ error: 'Inactive price' });
    } catch (e) {
      return response.status(400).json({ error: 'Invalid priceId' });
    }
    
    // Trial period setup
    let trialDays = null;
    if (priceId === trialPriceId && trialDaysEnv) {
      const days = parseInt(trialDaysEnv, 10);
      if (!isNaN(days) && days > 0) trialDays = days;
    }
    
    // Create subscription
    const customer = await stripe.customers.create();
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice', 'pending_setup_intent'],
      ...(trialDays && { trial_period_days: trialDays })
    });
    
    // Get client_secret from different sources
    let clientSecret = null;
    
    // 1. From SetupIntent (for trial subscriptions)
    if (subscription.pending_setup_intent?.client_secret) {
      clientSecret = subscription.pending_setup_intent.client_secret;
    } 
    // 2. From PaymentIntent (for immediate payments)
    else if (subscription.latest_invoice?.payment_intent) {
      const piId = typeof subscription.latest_invoice.payment_intent === 'string'
        ? subscription.latest_invoice.payment_intent
        : subscription.latest_invoice.payment_intent.id;
        
      const pi = await stripe.paymentIntents.retrieve(piId);
      clientSecret = pi.client_secret;
    }
    // 3. Create PaymentIntent if not found
    else if (subscription.status === 'incomplete' && subscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice.id);
      const pi = await stripe.paymentIntents.create({
        amount: invoice.amount_due || 0,
        currency: invoice.currency || 'usd',
        customer: customer.id,
        description: `Payment for ${subscription.id}`,
        automatic_payment_methods: { enabled: true },
        metadata: { subscription_id: subscription.id }
      });
      
      clientSecret = pi.client_secret;
    }

    return response.status(200).json({
      clientSecret,
      subscriptionId: subscription.id,
      ...(clientSecret ? {} : { 
        status: subscription.status,
        error: 'No client secret available'
      })
    });
    
  } catch (error) {
    console.error(error.message);
    return response.status(500).json({ error: 'Subscription creation failed' });
  }
} 