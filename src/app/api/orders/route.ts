import { NextResponse } from 'next/server';
import { dispatchEmail } from '@/lib/emailService';
import { INITIAL_EMAIL_SETTINGS, INITIAL_ADMIN_PROFILE, INITIAL_PRODUCTS, INITIAL_ORDERS } from '@/lib/storeManager';
import { Order, OrderItem } from '@/types/store';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { getShippingEstimates } from '@/lib/shippingService';
import { calculateDestinationSalesTax } from '@/lib/taxService';

// In-memory server cache to keep orders synced between storefront and admin even in local storage mode
const localServerOrders: Order[] = [...INITIAL_ORDERS];

export async function GET() {
  try {
    const isAuthed = await isAuthenticatedAdmin();
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized: Studio administrative authentication required.' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ orders: data, source: 'supabase' });
      }
    }

    return NextResponse.json({ orders: localServerOrders, source: 'local' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching orders';
    console.error('Error fetching orders:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customer,
      email,
      items,
      shippingAddress,
      shippingMethod,
      carrier,
      trackingNumber,
    } = body;

    if (!customer || !email || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required order details' }, { status: 400 });
    }

    // 1. Authoritative Item Validation & Price Calculation
    const validatedItems: OrderItem[] = [];
    let totalWeightOz = 0;

    for (const rawItem of items as Array<{ id?: string; productId?: string; name?: string; price?: number; quantity?: number }>) {
      const lookupId = rawItem.id || rawItem.productId;
      const catalogProduct = INITIAL_PRODUCTS.find(
        (p) => p.id === lookupId || p.sku.toLowerCase() === String(lookupId).toLowerCase()
      );

      const quantity = Math.max(1, Math.floor(rawItem.quantity || 1));

      if (catalogProduct) {
        const isCuttingBoard = catalogProduct.category === 'Cutting board';
        totalWeightOz += (isCuttingBoard ? 128 : 14) * quantity;
        validatedItems.push({
          productId: catalogProduct.id,
          name: catalogProduct.name,
          quantity,
          price: catalogProduct.price,
        });
      } else if (rawItem.name && typeof rawItem.price === 'number') {
        totalWeightOz += 16 * quantity;
        validatedItems.push({
          productId: lookupId || 'custom',
          name: rawItem.name,
          quantity,
          price: rawItem.price,
        });
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json({ error: 'No valid items found for order' }, { status: 400 });
    }

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 2. Authoritative Shipping & Tax Calculation
    const destState = shippingAddress?.state || 'IL';
    const destZip = shippingAddress?.zip || '60622';

    const shippingOptions = getShippingEstimates({
      state: destState,
      zip: destZip,
      subtotal,
      weightOz: totalWeightOz,
    });

    const chosenOption =
      shippingOptions.find((o) => o.name === shippingMethod || o.carrier === carrier) ||
      shippingOptions[0];

    const authoritativeShippingCost = chosenOption.price;

    const taxResult = calculateDestinationSalesTax({
      state: destState,
      zip: destZip,
      subtotal,
    });

    const orderId = body.id || `#${Math.floor(1050 + Math.random() * 8900)}`;
    const calculatedAmount = Math.round((subtotal + authoritativeShippingCost + taxResult.taxAmount) * 100) / 100;
    const primaryItemName = validatedItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');

    const newOrder: Order = {
      id: orderId,
      customer,
      email,
      item: primaryItemName,
      items: validatedItems,
      subtotal,
      shippingMethod: chosenOption.name,
      shippingCost: authoritativeShippingCost,
      shippingZone: chosenOption.zone,
      taxAmount: taxResult.taxAmount,
      taxRate: taxResult.taxRate,
      taxJurisdiction: taxResult.taxJurisdiction,
      amount: calculatedAmount,
      carrier: carrier || chosenOption.carrier || 'USPS',
      trackingNumber: trackingNumber || '',
      status: 'Paid',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      shippingAddress: shippingAddress || {
        street: '1420 N Damen Ave',
        city: 'Chicago',
        state: 'IL',
        zip: '60622',
      },
    };

    // Save to local server cache
    localServerOrders.unshift(newOrder);

    // Save to Supabase if configured
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        const { error: insertError } = await supabase.from('orders').upsert({
          id: newOrder.id,
          customer: newOrder.customer,
          email: newOrder.email,
          item: newOrder.item,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          shipping_method: newOrder.shippingMethod,
          shipping_cost: newOrder.shippingCost,
          tax_amount: newOrder.taxAmount,
          tax_rate: newOrder.taxRate,
          tax_jurisdiction: newOrder.taxJurisdiction,
          amount: newOrder.amount,
          carrier: newOrder.carrier,
          tracking_number: newOrder.trackingNumber,
          status: newOrder.status,
          date: newOrder.date,
          shipping_address: newOrder.shippingAddress,
        });

        if (insertError) {
          console.warn('Failed to insert order to Supabase:', insertError.message);
        }
      } catch (dbErr) {
        console.warn('Supabase DB error during order save:', dbErr);
      }
    }

    // Auto provision order confirmation email to customer
    const emailResult = await dispatchEmail({
      order: newOrder,
      recipientEmail: email,
      recipientName: customer,
      type: 'order_confirmation',
      subject: `Order Confirmation ${newOrder.id} — DCHOI DESIGNS`,
      settings: INITIAL_EMAIL_SETTINGS,
      carrier: newOrder.carrier,
      trackingNumber: newOrder.trackingNumber,
    });

    // Auto provision fulfillment manifest email to David Choi
    await dispatchEmail({
      order: newOrder,
      recipientEmail: INITIAL_ADMIN_PROFILE.email || 'orders@dchoidesigns.com',
      recipientName: INITIAL_ADMIN_PROFILE.name || 'David Choi',
      type: 'admin_shipping_label',
      subject: `[Fulfillment Ready] Order ${newOrder.id} (${customer}) — Packing Slip Enclosed`,
      settings: INITIAL_EMAIL_SETTINGS,
      carrier: newOrder.carrier,
      trackingNumber: newOrder.trackingNumber,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      email: emailResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    console.error('Order creation error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

