import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const trialPriceId = process.env.TRIAL_PRODUCT_PRICE_ID;
const trialDaysEnv = process.env.TRIAL_PERIOD_DAYS;

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).end('Method Not Allowed');
  }

  try {
    // Fetch active prices with expanded product data
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    // Filter prices to show only those with active products
    const activePrices = prices.data.filter(price => price.product.active === true);

    // Format price data for client consumption
    const formattedPrices = activePrices.map(price => {
      // Format currency display
      const unitAmount = price.unit_amount || 0;
      const currency = price.currency || 'usd';
      const formattedCost = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(unitAmount / 100);

      // Determine subscription duration
      let duration = 'one-time';
      if (price.recurring) {
        duration = price.recurring.interval_count === 1 
          ? price.recurring.interval 
          : `every ${price.recurring.interval_count} ${price.recurring.interval}s`;
      }

      // Check for free trial availability
      let hasTrial = false;
      let trialDays = null;
      
      if (price.id === trialPriceId && trialDaysEnv) {
        hasTrial = true;
        trialDays = parseInt(trialDaysEnv, 10);
      }

      // Return formatted price object
      return {
        id: price.id,
        cost: formattedCost,
        currency: currency,
        duration: duration,
        has_free_trial: hasTrial,
        trial_days: trialDays
      };
    });

    // Return formatted prices as JSON response
    response.status(200).json(formattedPrices);
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    response.status(500).json({ error: 'Failed to retrieve plans' });
  }
} 