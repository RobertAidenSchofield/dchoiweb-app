'use client';

import { Printer, X } from 'lucide-react';
import { Order } from '@/types/store';

export function PackingSlipModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  function handlePrint() {
    window.print();
  }

  const shipping = order.shippingAddress || {
    street: '1420 N Damen Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60622',
  };

  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div
        className='modal-card'
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '100%', padding: '0', background: '#ffffff', color: '#1d1d1b', border: '1px solid #1d1d1b' }}
      >
        {/* Screen Controls Header (Hidden in Print) */}
        <div
          className='no-print'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #e2ded5',
            background: '#f8f7f4',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#76746e', fontWeight: 600 }}>
              Order Fulfillment · Logistics
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '16px', textTransform: 'uppercase' }}>
              Packing Slip &amp; Care Protocol ({order.id})
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type='button'
              onClick={handlePrint}
              className='stereo-solid-btn'
              style={{ width: 'auto', padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={13} /> Print Packing Slip
            </button>
            <button
              type='button'
              onClick={onClose}
              style={{ background: 'none', border: 0, cursor: 'pointer', padding: '6px', color: '#76746e' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Packing Slip Area */}
        <div style={{ padding: '36px 32px', fontSize: '12px', lineHeight: 1.6 }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1d1d1b', paddingBottom: '18px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
                DCHOI / DESIGNS
              </h2>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#76746e', display: 'block', marginTop: '2px' }}>
                Chicago Studio · 41°53&apos;N 87°38&apos;W · david@dchoidesigns.com
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
                PACKING SLIP {order.id}
              </div>
              <span style={{ fontSize: '11px', color: '#76746e' }}>Date: {order.date}</span>
            </div>
          </div>

          {/* Recipient Details Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e5e3de' }}>
            <div>
              <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e', display: 'block', marginBottom: '4px' }}>
                Ship To:
              </strong>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{order.customer}</div>
              <div style={{ color: '#55534e' }}>{order.email}</div>
              <div style={{ color: '#55534e', marginTop: '4px' }}>
                {shipping.street}<br />
                {shipping.city}, {shipping.state} {shipping.zip}
              </div>
            </div>
            <div>
              <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e', display: 'block', marginBottom: '4px' }}>
                Fulfillment &amp; Carrier:
              </strong>
              <div>Carrier: <strong>{order.carrier || 'USPS Priority Mail / Insured'}</strong></div>
              <div>Tracking: <span style={{ fontFamily: 'monospace' }}>{order.trackingNumber || 'Assigned at dispatch'}</span></div>
              <div>Status: <strong>{order.status.toUpperCase()}</strong></div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
            <thead>
              <tr style={{ background: '#f5f3ec', borderTop: '1px solid #1d1d1b', borderBottom: '1px solid #1d1d1b', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '8px 12px' }}>Specimen / Item</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e3de' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{it.quantity}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>${(it.price * it.quantity).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr style={{ borderBottom: '1px solid #e5e3de' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{order.item}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>${order.amount.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              {order.subtotal !== undefined && (
                <tr>
                  <td colSpan={2} style={{ padding: '6px 12px', textAlign: 'right', color: '#666', fontSize: '11px' }}>Piece Subtotal:</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>${order.subtotal.toFixed(2)}</td>
                </tr>
              )}
              {order.shippingCost !== undefined && (
                <tr>
                  <td colSpan={2} style={{ padding: '4px 12px', textAlign: 'right', color: '#666', fontSize: '11px' }}>
                    Shipping ({order.shippingMethod || 'Carrier'}):
                  </td>
                  <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: 600 }}>
                    {order.shippingCost === 0 ? 'Complimentary' : `$${order.shippingCost.toFixed(2)}`}
                  </td>
                </tr>
              )}
              {order.taxAmount !== undefined && (
                <tr>
                  <td colSpan={2} style={{ padding: '4px 12px', textAlign: 'right', color: '#666', fontSize: '11px' }}>
                    Sales Tax ({order.taxRate ? `${(order.taxRate * 100).toFixed(2)}%` : '0.00%'} · {order.taxJurisdiction || 'Destination Tax'}):
                  </td>
                  <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: 600 }}>
                    ${order.taxAmount.toFixed(2)}
                  </td>
                </tr>
              )}
              <tr style={{ borderTop: '1.5px solid #1d1d1b' }}>
                <td colSpan={2} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase' }}>Total Paid:</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: '15px' }}>${order.amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Hardwood & Saya Care Protocol Guide */}
          <div
            style={{
              background: '#faf9f6',
              border: '1px solid #1d1d1b',
              padding: '16px 20px',
              borderRadius: '1px',
            }}
          >
            <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
              ✦ Studio Care Protocol &amp; Warranty Guidelines:
            </strong>
            <ul style={{ margin: 0, paddingLeft: '16px', color: '#44423e', fontSize: '11px', lineHeight: 1.6 }}>
              <li><strong>Moisture Tolerance:</strong> Never submerge the saya or cutting block in water. Wipe clean with a dry or lightly damp cloth and dry immediately.</li>
              <li><strong>Camellia Oil Maintenance:</strong> Apply 2-3 drops of 100% pure Camellia oil (tsubaki-abura) to the hardwood every 2-3 months to preserve fiber suppleness.</li>
              <li><strong>Friction Fit &amp; Pin:</strong> The Gaboon ebony pin is precision-carved to hold under light finger pressure. Do not force or overtighten.</li>
              <li><strong>Knife Cleanliness:</strong> Always thoroughly dry the knife blade before sheathing to prevent humidity transfer to the interior hollow.</li>
            </ul>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: '#76746e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Thank you for supporting slow, single-artisan American woodcraft.
          </div>
        </div>
      </div>
    </div>
  );
}

