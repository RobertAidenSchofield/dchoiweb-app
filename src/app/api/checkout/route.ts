import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { INITIAL_PRODUCTS } from '@/lib/storeManager';
import { getShippingEstimates } from '@/lib/shippingService';
import { calculateDestinationSalesTax } from '@/lib/taxService';

interface CheckoutItemRequest {
  id?: string;
  productId?: string;
  quantity?: number;
  name?: string;
  price?: number;
  image?: string;
  dimensions?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      items,
      customerEmail,
      customerName,
      shippingOption,
      shippingAddress,
      orderId,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty or invalid.' }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        {
          error:
            'STRIPE_SECRET_KEY is not set in environment. Please add it to your environment variables to enable live payments.',
          isConfigured: false,
        },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 1. Authoritative Server-Side Product Validation & Pricing
    const verifiedItems: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
      image: string;
      dimensions?: string;
      weightOz: number;
    }[] = [];

    for (const rawItem of items as CheckoutItemRequest[]) {
      const lookupId = rawItem.id || rawItem.productId;
      const catalogProduct = INITIAL_PRODUCTS.find(
        (p) => p.id === lookupId || p.sku.toLowerCase() === String(lookupId).toLowerCase()
      );

      const quantity = Math.max(1, Math.floor(rawItem.quantity || 1));

      if (catalogProduct) {
        const isCuttingBoard = catalogProduct.category === 'Cutting board';
        const weightOz = isCuttingBoard ? 128 : 14;

        verifiedItems.push({
          productId: catalogProduct.id,
          name: catalogProduct.name,
          price: catalogProduct.price,
          quantity,
          image: catalogProduct.image,
          dimensions: catalogProduct.dimensions,
          weightOz,
        });
      } else if (rawItem.name && typeof rawItem.price === 'number' && rawItem.price > 0) {
        // Fallback for bespoke commissions
        verifiedItems.push({
          productId: lookupId || 'bespoke',
          name: rawItem.name,
          price: Math.max(50, rawItem.price),
          quantity,
          image: rawItem.image || '',
          dimensions: rawItem.dimensions,
          weightOz: 16,
        });
      }
    }

    if (verifiedItems.length === 0) {
      return NextResponse.json({ error: 'No valid products identified in cart.' }, { status: 400 });
    }

    const subtotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalWeightOz = verifiedItems.reduce((sum, item) => sum + item.weightOz * item.quantity, 0);

    // 2. Authoritative Shipping Rate Computation
    const shippingEstimates = getShippingEstimates({
      state: shippingAddress?.state,
      zip: shippingAddress?.zip,
      subtotal,
      weightOz: totalWeightOz,
    });

    const chosenOption =
      shippingEstimates.find((o) => o.id === shippingOption?.id) ||
      shippingEstimates.find((o) => o.carrier === shippingOption?.carrier) ||
      shippingEstimates[0];

    const authoritativeShippingCost = chosenOption.price;

    // 3. Authoritative Destination Sales Tax Calculation
    const taxCalc = calculateDestinationSalesTax({
      state: shippingAddress?.state,
      zip: shippingAddress?.zip,
      subtotal,
    });
    const authoritativeTaxAmount = taxCalc.taxAmount;

    // 4. Build Secure Stripe Line Items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = verifiedItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image.startsWith('http') ? item.image : `${origin}${item.image}`] : [],
          description: item.dimensions ? `Fitment: ${item.dimensions}` : 'DCHOI DESIGNS handcrafted studio piece',
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (authoritativeShippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Shipping: ${chosenOption.name} (${chosenOption.carrier})`,
            description: `Insured studio transit to ${shippingAddress?.state || 'US'}`,
          },
          unit_amount: Math.round(authoritativeShippingCost * 100),
        },
        quantity: 1,
      });
    }

    if (authoritativeTaxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Estimated Sales Tax (${taxCalc.taxRatePercent} - ${taxCalc.taxJurisdiction})`,
          },
          unit_amount: Math.round(authoritativeTaxAmount * 100),
        },
        quantity: 1,
      });
    }

    const assignedOrderId = orderId || `#${Math.floor(1050 + Math.random() * 8900)}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/store?session_id={CHECKOUT_SESSION_ID}&order_id=${encodeURIComponent(assignedOrderId)}&success=true`,
      cancel_url: `${origin}/store?canceled=true`,
      metadata: {
        orderId: assignedOrderId,
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        shippingMethod: chosenOption.name,
        carrier: chosenOption.carrier,
        shippingStreet: shippingAddress?.street || '',
        shippingCity: shippingAddress?.city || '',
        shippingState: shippingAddress?.state || '',
        shippingZip: shippingAddress?.zip || '',
        taxJurisdiction: taxCalc.taxJurisdiction,
        taxAmount: String(authoritativeTaxAmount),
        taxRate: String(taxCalc.taxRate),
        itemCount: String(verifiedItems.reduce((acc, i) => acc + i.quantity, 0)),
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      orderId: assignedOrderId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to initiate Stripe Checkout session';
    console.error('Stripe Checkout Session Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


