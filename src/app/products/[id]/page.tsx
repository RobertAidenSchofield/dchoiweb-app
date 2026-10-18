'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react';
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

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('210mm Gyuto');
  const [quantity, setQuantity] = useState(1);
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ order: Order; emailNotice: string } | null>(null);

  // Live Shipping Estimation State
  const [destinationState, setDestinationState] = useState('IL');
  const [destinationZip, setDestinationZip] = useState('60622');
  const [selectedShippingId, setSelectedShippingId] = useState('usps_priority');

  // Live Studio Dual Clocks
  const { chicagoTime, tokyoTime } = useStudioClocks();

  useEffect(() => {
    const timer = setTimeout(() => {
      const loaded = loadStoredData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      setProducts(loaded);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function handleOpenOrderModal() {
    setOrderSuccess(null);
    setOrderModalOpen(true);
  }

  function handleCloseOrderModal() {
    setOrderModalOpen(false);
    setOrderSuccess(null);
  }

  const currentIndex = products.findIndex(
    (p) => p.id === resolvedParams.id || p.sku.toLowerCase() === resolvedParams.id.toLowerCase()
  );

  const product = currentIndex >= 0 ? products[currentIndex] : products[0];

  const prevProduct = currentIndex > 0 ? products[currentIndex - 1] : products[products.length - 1];
  const nextProduct = currentIndex < products.length - 1 ? products[currentIndex + 1] : products[0];

  const images = product?.images && product.images.length > 0 ? product.images : [product?.image || ''];
  const currentImage = images[activeImageIndex] || images[0];

  const relatedProducts = products.filter((p) => p.id !== product?.id).slice(0, 3);

  const subtotal = (product?.price || 0) * quantity;

  const shippingOptions = useMemo(() => {
    return getShippingEstimates({
      state: destinationState,
      zip: destinationZip,
      subtotal,
      weightOz: 14 * quantity,
    });
  }, [destinationState, destinationZip, subtotal, quantity]);

  const selectedShippingOption =
    shippingOptions.find((o) => o.id === selectedShippingId) || shippingOptions[0];

  const shippingCost = selectedShippingOption?.price || 0;

  const salesTaxResult = useMemo(() => {
    return calculateDestinationSalesTax({
      state: destinationState,
      zip: destinationZip,
      subtotal,
    });
  }, [destinationState, destinationZip, subtotal]);

  const taxAmount = salesTaxResult.taxAmount;
  const orderTotal = Math.round((subtotal + shippingCost + taxAmount) * 100) / 100;

  async function handleCompleteOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;

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
      item: `${product.name} (${selectedSize})`,
      items: [
        {
          productId: product.id,
          name: `${product.name} (${selectedSize})`,
          quantity,
          price: product.price * quantity,
        },
      ],
      subtotal,
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

    // 2. Decrement inventory
    const updatedProducts = products.map((p) => {
      if (p.id === product.id) {
        return {
          ...p,
          stock: Math.max(0, p.stock - quantity),
          reserved: p.reserved + quantity,
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveStoredData(STORAGE_KEYS.PRODUCTS, updatedProducts);

    // 3. Append order
    const currentOrders = loadStoredData<Order[]>(STORAGE_KEYS.ORDERS, []);
    saveStoredData(STORAGE_KEYS.ORDERS, [newOrder, ...currentOrders]);

    // 4. Append to inventory audit logs
    const currentAudit = loadStoredData<InventoryAuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newAuditLog: InventoryAuditLog = {
      id: `log-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      change: -quantity,
      previousStock: product.stock,
      newStock: Math.max(0, product.stock - quantity),
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

    // 5. Dispatch automated customer confirmation email
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

    // 6. AUTOMATE SHIPPING PROCESS: Dispatch admin fulfillment manifest (label & packing slip) to David Choi
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

    const currentOutbox = loadStoredData<EmailNotification[]>(STORAGE_KEYS.OUTBOX, []);
    saveStoredData(STORAGE_KEYS.OUTBOX, [emailRecord, adminLabelEmail, ...currentOutbox]);

    setOrderSuccess({
      order: newOrder,
      emailNotice: `Confirmation dispatched to ${email}. Complete packing slip, carrier label, and care protocol dispatched to studio maker (${adminProfile.email}).`,
    });
  }

  if (!product) {
    return (
      <div className='stereo-root' style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2>Specimen Not Found</h2>
        <Link href='/store' className='stereo-outline-btn' style={{ marginTop: '20px' }}>
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className='stereo-root'>
      {/* ------------------------------------------------------------------- */}
      {/* 1. FLOATING HEADER                                                  */}
      {/* ------------------------------------------------------------------- */}
      <header className='stereo-header-desktop hidden lg:flex'>
        <div className='stereo-glass-pill'>
          <Link href='/'>Home</Link>
          <Link href='/store' style={{ textDecoration: 'underline' }}>Shop</Link>
          <Link href='/#philosophy'>Philosophy</Link>
          <Link href='/#maker'>Meet David</Link>
        </div>

        <Link href='/' className='stereo-center-logo' aria-label='DCHOI DESIGNS'>
          <span className='font-stretch-dynamic-center' style={{ fontWeight: 800, letterSpacing: '0.22em' }}>
            DCHOI / DESIGNS
          </span>
        </Link>

        <div className='stereo-glass-pill'>
          <Link href='/admin' style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Studio Admin <ArrowUpRight size={12} />
          </Link>
          <button type='button' onClick={() => setOrderModalOpen(true)}>
            Bag ({orderSuccess ? '1' : '0'})
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className='stereo-header-mobile flex lg:hidden'>
        <Link href='/' style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          DCHOI<span>/</span>DESIGNS
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href='/store' style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            Shop ↗
          </Link>
          <button type='button' onClick={() => setOrderModalOpen(true)} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            Bag ({orderSuccess ? '1' : '0'})
          </button>
        </div>
      </header>

      <div style={{ height: '70px' }} />

      {/* ------------------------------------------------------------------- */}
      {/* 2. STEREOSCOPE MAIN PRODUCT SPLIT GRID                              */}
      {/* ------------------------------------------------------------------- */}
      <main className='stereo-product-main-grid'>
        {/* Left Column: Main Swiper / Gallery View */}
        <section className='stereo-product-gallery-pane'>
          <div
            className='stereo-product-main-image'
            style={{ backgroundImage: `url('${currentImage}')` }}
          />

          {/* Floating Thumbnail Switcher Strip */}
          {images.length > 1 && (
            <div className='stereo-product-thumb-strip'>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type='button'
                  className={`stereo-product-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                  style={{ backgroundImage: `url('${img}')` }}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View angle ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Spec Dossier Card + Buy Box */}
        <section className='stereo-product-info-pane'>
          {/* Top Dossier Card */}
          <div className='stereo-product-spec-card'>
            <span className='stereo-product-index-num'>
              LOT / {product.sku || 'DCH-SPECIMEN'}
            </span>
            <h1 className='stereo-product-heading font-stretch-dynamic'>
              {product.name}
            </h1>
            <p className='stereo-product-wood-type'>
              {product.woodType || 'Japanese Magnolia (Ho-wood) & Aged Walnut'}
            </p>

            <span className='stereo-product-notes-pill font-stretch-dynamic'>
              Hand-Planed · Friction-Fit Tolerance · Gaboon Ebony Pin
            </span>

            {/* Spec Table */}
            <div className='stereo-spec-table'>
              <div className='stereo-spec-row'>
                <span className='stereo-spec-label'>Origin</span>
                <span className='stereo-spec-val'>Chicago Studio (41°53&apos;N)</span>
              </div>
              <div className='stereo-spec-row'>
                <span className='stereo-spec-label'>Timber</span>
                <span className='stereo-spec-val'>{product.woodType || 'Japanese Magnolia (Ho-wood)'}</span>
              </div>
              <div className='stereo-spec-row'>
                <span className='stereo-spec-label'>Dimensions</span>
                <span className='stereo-spec-val'>{product.dimensions || '210mm – 240mm (Bespoke Bevel)'}</span>
              </div>
              <div className='stereo-spec-row'>
                <span className='stereo-spec-label'>Finishing</span>
                <span className='stereo-spec-val'>100% Pure Camellia Oil &amp; Organic Beeswax</span>
              </div>
              <div className='stereo-spec-row'>
                <span className='stereo-spec-label'>Saya Pin</span>
                <span className='stereo-spec-val'>Hand-Carved Gaboon Ebony (Included)</span>
              </div>
            </div>
          </div>

          {/* Bottom Split: Narrative + Buy Box */}
          <div className='stereo-product-bottom-split'>
            {/* Narrative Column */}
            <div className='stereo-product-narrative-col'>
              <p style={{ margin: '0 0 14px' }}>
                {product.description ||
                  `This single-artisan piece is hand-shaped in David Choi's Chicago studio. Each saya is scribed directly to the knife's unique spine taper, hand-planed with Japanese kanna to achieve a whisper-quiet friction fit, and sealed to breathe naturally.`}
              </p>
              <p style={{ margin: 0, color: '#76746e', fontSize: '12px' }}>
                * Due to organic variations in hardwood grain and moisture content, every sheath possesses an individual character and grain contour.
              </p>
            </div>

            {/* Purchasing Column */}
            <div className='stereo-product-buy-col'>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1d1d1b', display: 'block' }}>
                  Configuration / Blade Profile
                </span>
                <div className='stereo-option-pills'>
                  {['210mm Gyuto', '240mm Gyuto', '165mm Santoku'].map((size) => (
                    <button
                      key={size}
                      type='button'
                      className={`stereo-option-pill-label ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {/* Quantity Stepper */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#76746e' }}>
                    Quantity
                  </span>
                  <div className='stereo-stepper'>
                    <button
                      type='button'
                      className='stereo-stepper-btn'
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label='Decrease quantity'
                    >
                      <Minus size={12} />
                    </button>
                    <div className='stereo-stepper-val'>{quantity}</div>
                    <button
                      type='button'
                      className='stereo-stepper-btn'
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label='Increase quantity'
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Total
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#1d1d1b' }}>
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </div>

                <button
                  type='button'
                  className='stereo-solid-btn'
                  onClick={handleOpenOrderModal}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <ShoppingBag size={14} /> Add to Bag &middot; Purchase
                </button>

                <p style={{ fontSize: '10.5px', color: '#76746e', textAlign: 'center', margin: '8px 0 0' }}>
                  Tax included &middot; Ships within 1&ndash;2 business days via USPS Priority
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* 3. PREVIOUS / NEXT NAVIGATION BAR                                   */}
      {/* ------------------------------------------------------------------- */}
      <section className='stereo-prev-next-bar'>
        <Link href={`/products/${prevProduct.id}`}>
          <ArrowLeft size={13} /> Previous: {prevProduct.name}
        </Link>
        <Link href={`/products/${nextProduct.id}`}>
          Next: {nextProduct.name} <ArrowRight size={13} />
        </Link>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 4. RELATED WORKS GRID (STEREOSCOPE SECTION)                         */}
      {/* ------------------------------------------------------------------- */}
      <section style={{ padding: '64px 32px', background: '#ffffff', borderBottom: '1px solid #1d1d1b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Companion Studio Pieces
          </h2>
          <Link href='/store' style={{ fontSize: '11px', textTransform: 'uppercase', textDecoration: 'underline' }}>
            View All Collection ↗
          </Link>
        </div>

        <div className='stereo-shop-grid' style={{ border: '1px solid #1d1d1b' }}>
          {relatedProducts.map((rel) => (
            <Link key={rel.id} href={`/products/${rel.id}`} className='stereo-shop-card group'>
              <div
                className='stereo-shop-card-image'
                style={{ backgroundImage: `url('${rel.image}')` }}
              />
              <div className='stereo-shop-card-info'>
                <div>
                  <h3 className='stereo-shop-card-title'>
                    <span className='font-stretch-dynamic font-stretch-hover'>{rel.name}</span>
                  </h3>
                  <p className='stereo-shop-card-price'>FROM ${rel.price.toFixed(2)}</p>
                </div>
                <div className='stereo-plus-icon'>
                  <Plus size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* 5. ARCHITECTURAL DUAL-TIMEZONE FOOTER                               */}
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
              <p className='stereo-section-tag'>Index</p>
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
              fontSize: '11px',
              color: '#76746e',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              paddingTop: '16px',
            }}
          >
            <span>© {new Date().getFullYear()} DCHOI DESIGNS. All rights reserved.</span>
            <span>Made slowly in Chicago.</span>
          </div>
        </div>

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
      {/* 6. CHECKOUT MODAL                                                   */}
      {/* ------------------------------------------------------------------- */}
      {isOrderModalOpen && (
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
                  {orderSuccess ? 'Order Placed!' : `Purchase ${product.name}`}
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
                        backgroundImage: `url('${currentImage}')`,
                        flexShrink: 0,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong
                        className='font-stretch-dynamic'
                        style={{ fontSize: '15px', color: '#1d1d1b', display: 'block', textTransform: 'uppercase' }}
                      >
                        {product.name} ({selectedSize})
                      </strong>
                      <div style={{ fontSize: '11px', color: '#687d71', marginTop: '2px' }}>
                        Qty: {quantity} · ${product.price.toFixed(2)} each
                      </div>
                    </div>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: '#1d1d1b' }}>
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                  </div>
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
                      <span>Piece Subtotal ({quantity} {quantity > 1 ? 'items' : 'item'}):</span>
                      <span style={{ fontWeight: 600, color: '#1d1d1b' }}>${subtotal.toFixed(2)}</span>
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
                    <strong>Direct Studio Allocation:</strong> Hand-crafted and custom fitted in our Chicago studio. You will receive an automated dispatch notification with order tracking.
                  </div>
                </div>

                <div className='modal-actions'>
                  <button
                    className='secondary-dashboard-button'
                    type='button'
                    onClick={handleCloseOrderModal}
                  >
                    Cancel
                  </button>
                  <button className='stereo-solid-btn' type='submit' style={{ width: 'auto', padding: '12px 24px' }}>
                    <ShoppingBag size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Complete Purchase (${orderTotal.toFixed(2)})
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

