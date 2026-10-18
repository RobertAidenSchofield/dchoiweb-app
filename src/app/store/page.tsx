'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Plus,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { Order, Product, InventoryAuditLog, EmailNotification } from '@/types/store';
import {
  INITIAL_ADMIN_PROFILE,
  INITIAL_EMAIL_SETTINGS,
  INITIAL_PRODUCTS,
  STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from '@/lib/storeManager';
import { dispatchEmail } from '@/lib/emailService';
import { getShippingEstimates, generateCarrierTrackingNumber } from '@/lib/shippingService';
import { calculateDestinationSalesTax } from '@/lib/taxService';
import { useStudioClocks } from '@/hooks/useStudioClocks';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutImg, setCheckoutImg] = useState<string | null>(null);
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ order: Order; emailNotice: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sayas' | 'cutting-boards' | 'custom'>('all');

  // Live Shipping Estimation & Destination Tax State
  const [destinationState, setDestinationState] = useState('IL');
  const [destinationZip, setDestinationZip] = useState('60622');
  const [selectedShippingId, setSelectedShippingId] = useState('usps_priority');

  // Stripe Checkout Gateway State
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [stripeSuccessNotice, setStripeSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('success') === 'true') {
        const orderId = searchParams.get('order_id') || 'Verified';
        const timer = setTimeout(() => {
          setStripeSuccessNotice(
            `Payment Confirmed via Stripe! Order ${orderId} has been placed into the Chicago studio queue.`
          );
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const itemSubtotal = selectedProduct?.price || 0;

  const shippingOptions = useMemo(() => {
    return getShippingEstimates({
      state: destinationState,
      zip: destinationZip,
      subtotal: itemSubtotal,
    });
  }, [destinationState, destinationZip, itemSubtotal]);

  const selectedShippingOption =
    shippingOptions.find((o) => o.id === selectedShippingId) || shippingOptions[0];

  const shippingCost = selectedShippingOption?.price || 0;

  const salesTaxResult = useMemo(() => {
    return calculateDestinationSalesTax({
      state: destinationState,
      zip: destinationZip,
      subtotal: itemSubtotal,
    });
  }, [destinationState, destinationZip, itemSubtotal]);

  const taxAmount = salesTaxResult.taxAmount;
  const orderTotal = Math.round((itemSubtotal + shippingCost + taxAmount) * 100) / 100;

  // Dual Clocks (Chicago & Tokyo)
  const { chicagoTime, tokyoTime } = useStudioClocks();

  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = loadStoredData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      setProducts(loaded);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleOpenOrderModal(product: Product) {
    setSelectedProduct(product);
    setCheckoutImg(product.image || (product.images && product.images[0]) || null);
    setOrderSuccess(null);
    setOrderModalOpen(true);
  }

  function handleCloseOrderModal() {
    setOrderModalOpen(false);
    setOrderSuccess(null);
    setSelectedProduct(null);
    setCheckoutImg(null);
  }

  async function handleStripeCheckout(e: React.MouseEvent) {
    if (!selectedProduct) return;
    const form = (e.currentTarget as HTMLElement).closest('form');
    if (!form) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const customer = String(formData.get('customer'));
    const email = String(formData.get('email'));
    const street = String(formData.get('street'));
    const city = String(formData.get('city'));
    const state = destinationState;
    const zip = destinationZip;

    setIsStripeProcessing(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: selectedProduct.id,
              name: selectedProduct.name,
              price: selectedProduct.price,
              quantity: 1,
              image: selectedProduct.image,
              dimensions: selectedProduct.dimensions,
            },
          ],
          customerEmail: email,
          customerName: customer,
          shippingOption: {
            name: selectedShippingOption.name,
            carrier: selectedShippingOption.carrier,
            cost: shippingCost,
          },
          shippingAddress: { street, city, state, zip },
          taxAmount,
          taxRate: salesTaxResult.taxRate,
          taxJurisdiction: salesTaxResult.taxJurisdiction,
        }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Failed to initialize Stripe payment session.');
      }
    } catch {
      setCheckoutError('Error connecting to payment gateway.');
    } finally {
      setIsStripeProcessing(false);
    }
  }

  async function handleCompleteOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    const customer = String(formData.get('customer'));
    const email = String(formData.get('email'));
    const street = String(formData.get('street'));
    const city = String(formData.get('city'));
    const state = destinationState;
    const zip = destinationZip;

    const orderId = `#${Math.floor(1050 + Math.random() * 8900)}`;
    const trackingNumber = generateCarrierTrackingNumber(selectedShippingOption.carrier);

    const newOrder: Order = {
      id: orderId,
      customer,
      email,
      item: selectedProduct.name,
      items: [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: 1,
          price: selectedProduct.price,
        },
      ],
      subtotal: itemSubtotal,
      shippingMethod: selectedShippingOption.name,
      shippingCost,
      shippingZone: selectedShippingOption.zone,
      taxAmount,
      taxRate: salesTaxResult.taxRate,
      taxJurisdiction: salesTaxResult.taxJurisdiction,
      amount: orderTotal,
      carrier: selectedShippingOption.carrier,
      trackingNumber,
      status: 'Paid',
      date: 'Just now',
      shippingAddress: { street, city, state, zip },
    };

    // 1. Sync order to server database & Supabase via POST /api/orders
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customer,
          email,
          items: newOrder.items,
          shippingMethod: selectedShippingOption.name,
          carrier: selectedShippingOption.carrier,
          trackingNumber,
          shippingAddress: { street, city, state, zip },
        }),
      });
    } catch (apiErr) {
      console.warn('Backend order sync fallback:', apiErr);
    }

    // 2. Decrement inventory and record audit log
    const updatedProducts = products.map((p) => {
      if (p.id === selectedProduct.id) {
        return {
          ...p,
          stock: Math.max(0, p.stock - 1),
          reserved: p.reserved + 1,
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveStoredData(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // 3. Append order to orders list in storage
    const currentOrders = loadStoredData<Order[]>(STORAGE_KEYS.ORDERS, []);
    const updatedOrders = [newOrder, ...currentOrders];
    saveStoredData(STORAGE_KEYS.ORDERS, updatedOrders);

    // 4. Append to inventory audit logs
    const currentAudit = loadStoredData<InventoryAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newAuditLog: InventoryAuditLog = {
      id: `log-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      change: -1,
      previousStock: selectedProduct.stock,
      newStock: Math.max(0, selectedProduct.stock - 1),
      reason: 'Order Placed (Stock Reserved)',
      referenceId: orderId,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }),
      adminName: 'Customer Checkout',
      note: `Online purchase by ${customer} via ${selectedShippingOption.name}`,
    };
    saveStoredData(STORAGE_KEYS.AUDIT_LOGS, [newAuditLog, ...currentAudit]);

    // 5. Provision & dispatch automated customer receipt email
    const emailSettings = loadStoredData(STORAGE_KEYS.EMAIL_SETTINGS, INITIAL_EMAIL_SETTINGS);
    const emailRecord = await dispatchEmail({
      order: newOrder,
      recipientEmail: email,
      recipientName: customer,
      type: 'order_confirmation',
      subject: `Order Confirmation ${newOrder.id} — DCHOI DESIGNS`,
      settings: emailSettings,
      carrier: selectedShippingOption.carrier,
      trackingNumber,
    });

    // 6. AUTOMATE SHIPPING PROCESS: Dispatch admin fulfillment manifest to David Choi
    const adminProfile = loadStoredData(STORAGE_KEYS.ADMIN_PROFILE, INITIAL_ADMIN_PROFILE);
    const adminLabelEmail = await dispatchEmail({
      order: newOrder,
      recipientEmail: adminProfile.email || 'orders@dchoidesigns.com',
      recipientName: adminProfile.name || 'David Choi',
      type: 'admin_shipping_label',
      subject: `[Fulfillment Ready] Order ${newOrder.id} (${customer}) — Label & Packing Slip Enclosed`,
      settings: emailSettings,
      carrier: selectedShippingOption.carrier,
      trackingNumber,
    });

    // Save both notifications to outbox
    const currentOutbox = loadStoredData<EmailNotification[]>(STORAGE_KEYS.OUTBOX, []);
    saveStoredData(STORAGE_KEYS.OUTBOX, [emailRecord, adminLabelEmail, ...currentOutbox]);

    setOrderSuccess({
      order: newOrder,
      emailNotice: `Confirmation dispatched to ${email}. Complete packing slip, carrier label, and care protocol dispatched to studio maker (${adminProfile.email}).`,
    });
  }

  const sayaCount = products.filter((p) => p.category === 'Saya').length;
  const boardCount = products.filter((p) => p.category === 'Cutting board').length;
  const customCount = products.filter((p) => p.category === 'Custom' || p.category === 'Furniture').length;

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === 'sayas') return p.category === 'Saya';
    if (categoryFilter === 'cutting-boards') return p.category === 'Cutting board';
    if (categoryFilter === 'custom') return p.category === 'Custom' || p.category === 'Furniture';
    return true;
  });

  return (
    <div className='stereo-root'>
      {/* ------------------------------------------------------------------- */}
      {/* 1. FLOATING GLASS HEADER                                            */}
      {/* ------------------------------------------------------------------- */}
      <header className='stereo-header-desktop hidden lg:flex'>
        <div className='stereo-glass-pill'>
          <Link href='/' style={{ fontWeight: 600 }}>Home</Link>
          <Link href='/store' style={{ textDecoration: 'underline' }}>Shop</Link>
          <Link href='/#philosophy'>Philosophy</Link>
          <Link href='/#maker'>Meet David</Link>
        </div>

        <Link href='/' className='stereo-center-logo' aria-label='DCHOI DESIGNS'>
          <span
            className='font-stretch-dynamic-center'
            style={{ fontWeight: 800, letterSpacing: '0.22em' }}
          >
            DCHOI / DESIGNS
          </span>
        </Link>

        <div className='stereo-glass-pill'>
          <Link href='/admin' style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Studio Admin <ArrowUpRight size={12} />
          </Link>
          <button type='button' onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
            Bag ({orderSuccess ? '1' : '0'})
          </button>
        </div>
      </header>

      {stripeSuccessNotice && (
        <div
          style={{
            position: 'fixed',
            top: '84px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1b2d26',
            border: '1px solid #3e5a4e',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
            maxWidth: '90vw',
          }}
        >
          <CheckCircle2 size={16} color='#6ee7b7' />
          <span>{stripeSuccessNotice}</span>
          <button
            onClick={() => setStripeSuccessNotice(null)}
            style={{
              background: 'none',
              border: 0,
              color: '#ffffff',
              cursor: 'pointer',
              marginLeft: '8px',
              padding: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. STEREOSCOPE STICKY HERO (75vh Sticky Background)                 */}
      {/* ------------------------------------------------------------------- */}
      <header className='stereo-shop-hero'>
        <Image
          src='https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1706207626590-M2WYZUZ8O0TRJT0UAIK1/large+saya+group+.jpg?format=2500w'
          alt='DCHOI Woodcraft Studio Specimens'
          fill
          priority
          sizes='100vw'
        />
        <div className='stereo-shop-hero-overlay'>
          <div style={{ maxWidth: '980px', width: '100%' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px',
                color: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              Chicago Studio Inventory · 41°53&apos;N 87°38&apos;W
            </span>
            <h1
              className='font-stretch-dynamic'
              style={{
                fontSize: 'clamp(34px, 5.5vw, 68px)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.1,
                margin: '0 0 14px',
                color: '#ffffff',
              }}
            >
              DCHOI / SHOP
            </h1>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.9)',
                maxWidth: '620px',
                margin: 0,
              }}
            >
              Small-batch Japanese magnolia knife sayas, end-grain cutting blocks, and heirloom woodwork.
              Tracked live with Chicago workshop inventory levels.
            </p>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 3. STEREOSCOPE CATEGORY BAR + DYNAMIC FONT STRETCH CONTROLLER       */}
      {/* ------------------------------------------------------------------- */}
      <section className='stereo-shop-nav-bar'>
        <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type='button'
            className={`stereo-shop-filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            <span className='font-stretch-dynamic'>All Specimens ({products.length})</span>
          </button>
          <button
            type='button'
            className={`stereo-shop-filter-btn ${categoryFilter === 'sayas' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('sayas')}
          >
            <span className='font-stretch-dynamic'>Sayas ({sayaCount})</span>
          </button>
          <button
            type='button'
            className={`stereo-shop-filter-btn ${categoryFilter === 'cutting-boards' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('cutting-boards')}
          >
            <span className='font-stretch-dynamic'>Cutting Boards ({boardCount})</span>
          </button>
          <button
            type='button'
            className={`stereo-shop-filter-btn ${categoryFilter === 'custom' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('custom')}
          >
            <span className='font-stretch-dynamic'>Custom Builds ({customCount})</span>
          </button>
        </div>

        {/* Studio Provenance & Batch Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#76746e', fontWeight: 600 }}>
            Chicago Studio 41°53&apos;N · Hand-Shaped to Order
          </span>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4. THE ICONIC 3-COLUMN SOLID BLACK BORDER PRODUCT GRID             */}
      {/* ------------------------------------------------------------------- */}
      <section className='stereo-shop-grid-container' aria-label='DCHOI Catalog Pieces'>
        <div className='stereo-shop-grid'>
          {filteredProducts.map((product) => {
            const isOut = product.stock === 0;
            const isLow = product.stock > 0 && product.stock <= product.lowStockThreshold;
            const allImages = product.images && product.images.length > 0 ? product.images : [product.image];

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className='stereo-shop-card group'
              >
                {/* 3:4 Aspect Image */}
                <div
                  className='stereo-shop-card-image'
                  style={{ backgroundImage: `url('${product.image}')` }}
                >
                  {/* Stock pill in corner */}
                  <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
                    {isOut ? (
                      <span
                        style={{
                          background: '#1d1d1b',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          padding: '4px 8px',
                          borderRadius: '2px',
                        }}
                      >
                        Sold Out
                      </span>
                    ) : isLow ? (
                      <span
                        style={{
                          background: '#fef1cf',
                          color: '#8c6418',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          padding: '4px 8px',
                          borderRadius: '2px',
                        }}
                      >
                        Only {product.stock} Left
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.92)',
                          color: '#1d1d1b',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          padding: '4px 8px',
                          borderRadius: '2px',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {product.stock} In Studio
                      </span>
                    )}
                  </div>

                  {/* Multi-photo indicator tag */}
                  {allImages.length > 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '16px',
                        zIndex: 2,
                        background: 'rgba(29, 29, 27, 0.75)',
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        padding: '2px 7px',
                        borderRadius: '2px',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      📷 {allImages.length} VIEWS
                    </div>
                  )}
                </div>

                {/* Bottom Metadata Bar with Stereoscope Hover Plus Icon */}
                <div className='stereo-shop-card-info'>
                  <div>
                    <h3 className='stereo-shop-card-title'>
                      <span className='font-stretch-dynamic font-stretch-hover'>
                        {product.name}
                      </span>
                    </h3>
                    <p className='stereo-shop-card-price'>
                      <span className='font-stretch-dynamic'>
                        FROM ${product.price.toFixed(2)}
                      </span>
                      {product.woodType && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#76746e' }}>
                          · {product.woodType}
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type='button'
                    className='stereo-plus-icon'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenOrderModal(product);
                    }}
                    title='Quick Checkout'
                    aria-label={`Quick checkout for ${product.name}`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 5. BACK TO TOP STRIP (STEREOSCOPE SECTION)                          */}
      {/* ------------------------------------------------------------------- */}
      <section
        style={{
          width: '100%',
          height: '240px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f7f6f2',
          borderTop: '1px solid #1d1d1b',
          borderBottom: '1px solid #1d1d1b',
          marginTop: '-1px',
          gap: '12px',
        }}
      >
        <button
          type='button'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className='font-stretch-dynamic'
          style={{
            background: 'none',
            border: 0,
            textTransform: 'uppercase',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: '#1d1d1b',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
          }}
        >
          Back to Top ↑
        </button>
        <span style={{ fontSize: '11px', color: '#76746e', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          DCHOI DESIGNS · Chicago Studio
        </span>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 6. ARCHITECTURAL DUAL-TIMEZONE FOOTER                               */}
      {/* ------------------------------------------------------------------- */}
      <footer className='stereo-footer-grid'>
        <div
          style={{
            gridColumn: 'span 6',
            padding: '48px 32px',
            borderRight: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '32px',
          }}
        >
          <div>
            <p className='stereo-section-tag'>Live Workshop Telemetry</p>
            <div style={{ display: 'flex', gap: '36px', flexWrap: 'wrap', marginTop: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#76746e', display: 'block', marginBottom: '4px' }}>
                  CHICAGO STUDIO
                </span>
                <span className='stereo-footer-clock' style={{ fontSize: '18px', fontWeight: 600 }}>
                  {chicagoTime || '12:00:00'}
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: '#22c55e', marginTop: '4px' }}>
                  ● WORKSHOP OPEN
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#76746e', display: 'block', marginBottom: '4px' }}>
                  TOKYO PARTNER
                </span>
                <span className='stereo-footer-clock' style={{ fontSize: '18px', fontWeight: 600 }}>
                  {tokyoTime || '02:00:00'}
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: '#76746e', marginTop: '4px' }}>
                  LUMBER HARVEST
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#66635d', lineHeight: 1.6 }}>
            DCHOI DESIGNS STUDIO<br />
            1420 N Damen Ave, Chicago, IL 60622<br />
            Direct inquiries: David@dchoidesigns.com
          </div>
        </div>

        <div
          style={{
            gridColumn: 'span 6',
            padding: '48px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <p className='stereo-section-tag'>Shop Index</p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '8px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                }}
              >
                <li><Link href='/'>Studio Homepage</Link></li>
                <li><Link href='/store'>All Works</Link></li>
                <li><Link href='/shipping-returns'>Shipping &amp; Returns</Link></li>
                <li><Link href='/terms'>Terms of Service</Link></li>
                <li><Link href='/privacy'>Privacy Policy</Link></li>
                <li><Link href='/admin'>Admin Portal ↗</Link></li>
              </ul>
            </div>

            <div>
              <p className='stereo-section-tag'>Showroom Hours</p>
              <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#1d1d1b', marginTop: '8px' }}>
                Mon &ndash; Fri: 9:00am &ndash; 6:00pm CST<br />
                Sat: 10:00am &ndash; 4:00pm CST<br />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span className='stereo-open-dot' />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                    Showroom Open
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '11px',
              color: '#76746e',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              paddingTop: '16px',
            }}
          >
            <span>© {new Date().getFullYear()} DCHOI DESIGNS. All rights reserved. Handcrafted in Chicago.</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link href='/shipping-returns' style={{ color: '#76746e' }}>Shipping &amp; Care</Link>
              <Link href='/terms' style={{ color: '#76746e' }}>Terms</Link>
              <Link href='/privacy' style={{ color: '#76746e' }}>Privacy</Link>
            </div>
          </div>
        </div>

        {/* Full Width Giant Architectural Wordmark */}
        <div style={{ gridColumn: 'span 12' }} className='stereo-footer-giant-wordmark'>
          <svg viewBox='0 0 1200 120' fill='none' xmlns='http://www.w3.org/2000/svg' style={{ width: '100%', height: 'auto', display: 'block' }}>
            <text
              x='50%'
              y='95'
              textAnchor='middle'
              fill='#1d1d1b'
              fontSize='108'
              fontWeight='900'
              letterSpacing='12'
              fontFamily='system-ui, -apple-system, sans-serif'
            >
              DCHOI DESIGNS
            </text>
          </svg>
        </div>
      </footer>

      {/* ------------------------------------------------------------------- */}
      {/* 7. CUSTOMER CHECKOUT MODAL (WITH MULTI-PHOTO GALLERY)               */}
      {/* ------------------------------------------------------------------- */}
      {isOrderModalOpen && selectedProduct && (
        <div
          className='modal-backdrop'
          role='presentation'
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) handleCloseOrderModal();
          }}
        >
          <section className='product-modal' role='dialog' aria-modal='true' style={{ maxWidth: '620px' }}>
            <div className='modal-heading'>
              <div>
                <p className='dashboard-kicker'>Studio Checkout</p>
                <h2 className='font-stretch-dynamic'>
                  {orderSuccess ? 'Order Placed!' : `Purchase ${selectedProduct.name}`}
                </h2>
              </div>
              <button type='button' onClick={handleCloseOrderModal} aria-label='Close modal'>
                <X size={19} />
              </button>
            </div>

            {orderSuccess ? (
              <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    background: '#1d1d1b',
                    color: '#ffffff',
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: '22px', textTransform: 'uppercase', color: '#1d1d1b', margin: '0 0 8px' }}>
                  Thank you for your order
                </h3>
                <p style={{ fontSize: '13px', color: '#55534e', margin: '0 0 20px' }}>
                  Order reference is <strong>{orderSuccess.order.id}</strong>.
                </p>
                <div
                  style={{
                    background: '#f4f3ef',
                    border: '1px solid #1d1d1b',
                    padding: '14px 18px',
                    borderRadius: '2px',
                    fontSize: '12px',
                    color: '#1d1d1b',
                    marginBottom: '28px',
                  }}
                >
                  ✉️ {orderSuccess.emailNotice}
                </div>
                <button
                  type='button'
                  className='stereo-solid-btn'
                  onClick={handleCloseOrderModal}
                >
                  Return to Collection
                </button>
              </div>
            ) : (
              <form onSubmit={handleCompleteOrder}>
                {/* Product preview banner & multi-photo thumbnails */}
                <div style={{ padding: '0 22px' }}>
                  <div
                    style={{
                      background: '#f7f6f2',
                      padding: '14px 16px',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '14px',
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '2px',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundImage: `url('${checkoutImg || selectedProduct.image}')`,
                        flexShrink: 0,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        className='font-stretch-dynamic'
                        style={{ fontSize: '15px', color: '#1d1d1b', display: 'block', textTransform: 'uppercase' }}
                      >
                        {selectedProduct.name}
                      </strong>
                      <div style={{ fontSize: '11px', color: '#687d71', marginTop: '2px' }}>
                        SKU: {selectedProduct.sku} · {selectedProduct.woodType || 'Japanese Magnolia'}
                      </div>
                    </div>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: '#1d1d1b' }}>
                      ${selectedProduct.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Multi-Photo Picker */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        overflowX: 'auto',
                        paddingBottom: '4px',
                      }}
                    >
                      {selectedProduct.images.map((img, idx) => (
                        <button
                          key={idx}
                          type='button'
                          onClick={() => setCheckoutImg(img)}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '2px',
                            border: (checkoutImg || selectedProduct.image) === img ? '2px solid #1d1d1b' : '1px solid #d5d3cc',
                            padding: 0,
                            backgroundImage: `url('${img}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'border-color 150ms ease',
                          }}
                          title={`View angle ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Dedicated Shipping Address Card */}
                <div style={{ padding: '0 22px' }}>
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d5d3cc',
                      padding: '16px',
                      borderRadius: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#1d1d1b',
                        display: 'block',
                        marginBottom: '12px',
                      }}
                    >
                      Shipping Address &amp; Recipient
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ padding: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#76746e', marginBottom: '4px' }}>
                          Full Name
                        </label>
                        <input
                          name='customer'
                          placeholder='e.g. Maya Chen'
                          required
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ padding: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#76746e', marginBottom: '4px' }}>
                          Email Address
                        </label>
                        <input
                          name='email'
                          type='email'
                          placeholder='e.g. client@domain.com'
                          required
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ padding: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#76746e', marginBottom: '4px' }}>
                          Street Address
                        </label>
                        <input
                          name='street'
                          placeholder='Street Address, Apt / Suite'
                          required
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ padding: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#76746e', marginBottom: '4px' }}>
                            City
                          </label>
                          <input
                            name='city'
                            placeholder='Chicago'
                            required
                            style={{ width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ padding: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#76746e', marginBottom: '4px' }}>
                            State
                          </label>
                          <input
                            name='state'
                            placeholder='IL'
                            value={destinationState}
                            onChange={(e) => setDestinationState(e.target.value.toUpperCase())}
                            required
                            style={{ width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ padding: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#76746e', marginBottom: '4px' }}>
                            Postal Code
                          </label>
                          <input
                            name='zip'
                            placeholder='60622'
                            value={destinationZip}
                            onChange={(e) => setDestinationZip(e.target.value)}
                            required
                            style={{ width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Shipping Speed & Carrier Estimates */}
                <div style={{ padding: '0 22px', marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1d1d1b', display: 'block', marginBottom: '8px' }}>
                    Shipping Method
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          border: selectedShippingId === opt.id ? '1.5px solid #1d1d1b' : '1px solid #d5d3cc',
                          background: selectedShippingId === opt.id ? '#faf9f5' : '#ffffff',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          margin: 0,
                          transition: 'border-color 150ms ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type='radio'
                            name='shippingRadio'
                            value={opt.id}
                            checked={selectedShippingId === opt.id}
                            onChange={() => setSelectedShippingId(opt.id)}
                            style={{ accentColor: '#1d1d1b', cursor: 'pointer' }}
                          />
                          <div>
                            <strong style={{ fontSize: '12px', display: 'block', color: '#1d1d1b' }}>
                              {opt.name}{' '}
                              {opt.recommended && (
                                <span style={{ fontSize: '9px', background: '#1d1d1b', color: '#fff', padding: '1px 5px', borderRadius: '1px', marginLeft: '4px' }}>
                                  RECOMMENDED
                                </span>
                              )}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#76746e' }}>{opt.speed}</span>
                          </div>
                        </div>
                        <strong style={{ fontSize: '12.5px', color: '#1d1d1b' }}>
                          {opt.price === 0 ? 'Complimentary' : `$${opt.price.toFixed(2)}`}
                        </strong>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subtotal + Shipping Cost + Destination Sales Tax Breakdown */}
                <div style={{ padding: '0 22px', marginTop: '14px' }}>
                  <div style={{ background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.08)', padding: '12px 14px', fontSize: '11.5px', borderRadius: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666' }}>
                      <span>Piece Subtotal:</span>
                      <span style={{ fontWeight: 600, color: '#1d1d1b' }}>${itemSubtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#666' }}>
                      <span>
                        Shipping ({selectedShippingOption.name}):
                      </span>
                      <span style={{ fontWeight: 600, color: '#1d1d1b' }}>
                        {shippingCost === 0 ? 'Complimentary' : `$${shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#666' }}>
                      <div>
                        <span>Estimated Sales Tax ({salesTaxResult.taxRatePercent}):</span>
                        <span style={{ display: 'block', fontSize: '10px', color: '#76746e' }}>
                          {salesTaxResult.taxJurisdiction}
                        </span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1d1d1b' }}>
                        {taxAmount === 0 ? '$0.00' : `$${taxAmount.toFixed(2)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d5d3cc', paddingTop: '8px', fontWeight: 700, fontSize: '13px', color: '#1d1d1b' }}>
                      <span>Total Due:</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 22px', marginTop: '10px' }}>
                  <div
                    style={{
                      background: '#f7f6f2',
                      border: '1px solid #1d1d1b',
                      padding: '10px 14px',
                      borderRadius: '2px',
                      fontSize: '11px',
                      color: '#1d1d1b',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Automated Fulfillment:</strong> An official carrier shipping label will be automatically generated and dispatched to David Choi&apos;s Chicago workshop upon completion.
                  </div>
                </div>

                {checkoutError && (
                  <div style={{ padding: '0 22px', marginTop: '10px' }}>
                    <div
                      style={{
                        background: '#fdf0f0',
                        border: '1px solid #f5cfcf',
                        color: '#9c2727',
                        padding: '9px 12px',
                        borderRadius: '2px',
                        fontSize: '11.5px',
                      }}
                    >
                      {checkoutError}
                    </div>
                  </div>
                )}

                <div className='modal-actions' style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    className='secondary-dashboard-button'
                    type='button'
                    onClick={handleCloseOrderModal}
                  >
                    Cancel
                  </button>
                  <button
                    className='stereo-solid-btn'
                    type='button'
                    onClick={handleStripeCheckout}
                    disabled={isStripeProcessing}
                    style={{
                      background: '#263b35',
                      color: '#ffffff',
                      padding: '12px 20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      cursor: isStripeProcessing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <CreditCard size={15} />
                    {isStripeProcessing ? 'Connecting Stripe...' : `Pay with Card / Apple Pay ($${orderTotal.toFixed(2)})`}
                  </button>
                  <button
                    type='submit'
                    style={{
                      background: 'transparent',
                      border: '1px solid #1d1d1b',
                      color: '#1d1d1b',
                      padding: '12px 16px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                    }}
                  >
                    Simulate (Direct Test)
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
