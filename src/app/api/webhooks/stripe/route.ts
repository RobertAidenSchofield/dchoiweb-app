import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { dispatchEmail } from '@/lib/emailService';
import { INITIAL_EMAIL_SETTINGS, INITIAL_ADMIN_PROFILE } from '@/lib/storeManager';
import { Order } from '@/types/store';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe secret or webhook secret not configured in environment.' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signature error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    const orderId = metadata.orderId || `#${Math.floor(1050 + Math.random() * 8900)}`;
    const customer = metadata.customerName || session.customer_details?.name || 'Valued Collector';
    const email = metadata.customerEmail || session.customer_details?.email || '';
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

    // Fetch line items from Stripe to reconstruct purchased pieces
    let purchasedItems: Array<{ productId: string; name: string; quantity: number; price: number }> = [];
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      purchasedItems = lineItems.data
        .filter((li) => {
          const desc = (li.description || '').toLowerCase();
          return !desc.includes('shipping') && !desc.includes('sales tax');
        })
        .map((li) => ({
          productId: li.id,
          name: li.description || 'DCHOI Handcrafted Piece',
          quantity: li.quantity || 1,
          price: (li.amount_total || 0) / 100 / (li.quantity || 1),
        }));
    } catch (lineErr) {
      console.warn('Could not fetch line items for session:', lineErr);
    }

    const primaryItemName =
      purchasedItems.length > 0
        ? purchasedItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')
        : 'DCHOI DESIGNS Artisan Piece';

    const newOrder: Order = {
      id: orderId,
      customer,
      email,
      item: primaryItemName,
      items: purchasedItems,
      amount: totalAmount,
      shippingMethod: metadata.shippingMethod || 'Standard Ground',
      carrier: metadata.carrier || 'USPS',
      trackingNumber: '',
      status: 'Paid',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      shippingAddress: {
        street: metadata.shippingStreet || '',
        city: metadata.shippingCity || '',
        state: metadata.shippingState || '',
        zip: metadata.shippingZip || '',
      },
      taxAmount: metadata.taxAmount ? parseFloat(metadata.taxAmount) : 0,
      taxRate: metadata.taxRate ? parseFloat(metadata.taxRate) : 0,
      taxJurisdiction: metadata.taxJurisdiction || '',
    };

    // 1. Persist to Supabase PostgreSQL database
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('orders').upsert({
          id: newOrder.id,
          customer: newOrder.customer,
          email: newOrder.email,
          item: newOrder.item,
          items: newOrder.items,
          amount: newOrder.amount,
          shipping_method: newOrder.shippingMethod,
          carrier: newOrder.carrier,
          status: 'Paid',
          date: newOrder.date,
          shipping_address: newOrder.shippingAddress,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent ? String(session.payment_intent) : null,
        });

        // Add inventory audit log
        await supabase.from('inventory_audit_logs').insert({
          product_id: purchasedItems[0]?.productId || 'online_checkout',
          product_name: purchasedItems[0]?.name || 'Saya / Woodcraft',
          sku: 'ONLINE-STRIPE',
          change: -1,
          reason: 'Stripe Checkout Succeeded (Online Payment Confirmed)',
          reference_id: orderId,
          admin_name: 'Stripe Webhook Gateway',
          note: `Charge of $${totalAmount.toFixed(2)} confirmed by Stripe (${session.id})`,
          timestamp: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('Error persisting order to Supabase:', dbErr);
      }
    }

    // 2. Dispatch Customer Confirmation Email
    if (email) {
      try {
        await dispatchEmail({
          order: newOrder,
          recipientEmail: email,
          recipientName: customer,
          type: 'order_confirmation',
          subject: `Order Confirmation ${newOrder.id} — DCHOI DESIGNS`,
          settings: INITIAL_EMAIL_SETTINGS,
          carrier: newOrder.carrier,
        });
      } catch (mailErr) {
        console.error('Error sending customer order confirmation email:', mailErr);
      }
    }

    // 3. Dispatch Studio Fulfillment Manifest & Packing Slip to David Choi
    try {
      await dispatchEmail({
        order: newOrder,
        recipientEmail: INITIAL_ADMIN_PROFILE.email || 'orders@dchoidesigns.com',
        recipientName: INITIAL_ADMIN_PROFILE.name || 'David Choi',
        type: 'admin_shipping_label',
        subject: `[Paid Order Ready] ${newOrder.id} (${customer}) — Payment Confirmed via Stripe`,
        settings: INITIAL_EMAIL_SETTINGS,
        carrier: newOrder.carrier,
      });
    } catch (adminMailErr) {
      console.error('Error sending admin fulfillment email:', adminMailErr);
    }
  }

  return NextResponse.json({ received: true });
}

