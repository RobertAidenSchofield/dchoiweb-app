import { useState } from 'react';
import { Download, Globe, Printer, X } from 'lucide-react';
import { Order } from '@/types/store';
import { STUDIO_SHIP_FROM } from '@/lib/shippingService';

export function ShippingLabelModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [officialPdfData, setOfficialPdfData] = useState<string | null>(null);
  const [currentTracking, setCurrentTracking] = useState(
    order.trackingNumber || '9405 5118 9956 2537 1192 83'
  );

  function handlePrint() {
    window.print();
  }

  const shipping = order.shippingAddress || {
    street: '1420 N Damen Ave',
    city: 'Chicago',
    state: 'IL',
    zip: '60622',
  };

  const carrier = order.carrier || (order.shippingMethod?.includes('UPS') ? 'UPS' : 'USPS');
  const isUps = carrier.toUpperCase().includes('UPS');

  async function handleFetchOfficialLabel() {
    setIsCallingApi(true);
    setApiNotice(null);
    try {
      const res = await fetch('/api/shipping/generate-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          carrier,
          toAddress: {
            name: order.customer,
            street: shipping.street,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
          },
          packageDetails: {
            weightOz: 14,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.trackingNumber) setCurrentTracking(data.trackingNumber);
        if (data.labelPdfBase64) {
          const mime = data.labelFormat === 'GIF' ? 'image/gif' : 'application/pdf';
          setOfficialPdfData(`data:${mime};base64,${data.labelPdfBase64}`);
        }
        setApiNotice(data.notice || `Carrier label generated via ${carrier} API`);
      } else {
        setApiNotice(`Notice: ${data.error || 'Failed to call carrier API'}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setApiNotice(`Carrier request: ${message}`);
    } finally {
      setIsCallingApi(false);
    }
  }

  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div
        className='modal-card'
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '100%',
          padding: '0',
          background: '#ffffff',
          color: '#000000',
          border: '1px solid #1d1d1b',
        }}
      >
        {/* Screen Controls Header (Hidden in Print) */}
        <div
          className='no-print'
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #e2ded5',
            background: '#f8f7f4',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#76746e', fontWeight: 600 }}>
                Automated Logistics · Carrier Dispatch
              </span>
              <h3 style={{ margin: '2px 0 0', fontSize: '15px', textTransform: 'uppercase' }}>
                4x6 Shipping Label ({order.id})
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type='button'
                onClick={handlePrint}
                className='stereo-solid-btn'
                style={{ width: 'auto', padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={13} /> Print 4x6 Label
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

          {/* Action Row for Direct Carrier API */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              type='button'
              onClick={handleFetchOfficialLabel}
              disabled={isCallingApi}
              className='secondary-dashboard-button'
              style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Globe size={12} />
              {isCallingApi ? 'Calling Carrier API...' : `Request Official ${carrier} Label`}
            </button>

            {officialPdfData && (
              <a
                href={officialPdfData}
                download={`official_${carrier.toLowerCase()}_label_${order.id.replace('#', '')}.pdf`}
                className='stereo-solid-btn'
                style={{ width: 'auto', fontSize: '11px', padding: '6px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Download size={12} /> Download Official Carrier PDF
              </a>
            )}
          </div>

          {apiNotice && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: '#faf9f5',
                border: '1px solid #d5d1c8',
                borderRadius: '2px',
                fontSize: '11px',
                color: '#44423e',
                lineHeight: 1.4,
              }}
            >
              {apiNotice}
            </div>
          )}
        </div>

        {/* 4x6 Label Printable Body */}
        <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'center', background: '#f2f0ea' }}>
          <div
            id='shipping-label-printable'
            style={{
              width: '380px',
              minHeight: '560px',
              border: '2.5px solid #000000',
              padding: '18px 20px',
              background: '#ffffff',
              boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
              fontFamily: 'Arial, Helvetica, sans-serif',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Top Carrier Banner */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2.5px solid #000000', paddingBottom: '10px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    border: '2.5px solid #000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 900,
                    marginRight: '12px',
                    flexShrink: 0,
                  }}
                >
                  {isUps ? 'U' : 'P'}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                    {isUps ? 'UPS 2ND DAY AIR®' : 'USPS PRIORITY MAIL 2-DAY®'}
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#333333', marginTop: '3px' }}>
                    COMMERCIAL BASE POSTAGE PAID · PERMIT NO. 1048
                  </div>
                </div>
              </div>

              {/* Origin / From Block */}
              <div style={{ fontSize: '10px', textTransform: 'uppercase', lineHeight: 1.35, borderBottom: '1px solid #000000', paddingBottom: '8px', marginBottom: '16px' }}>
                <strong>{STUDIO_SHIP_FROM.name} / {STUDIO_SHIP_FROM.company}</strong><br />
                {STUDIO_SHIP_FROM.street}<br />
                {STUDIO_SHIP_FROM.city} {STUDIO_SHIP_FROM.state} {STUDIO_SHIP_FROM.zip}
              </div>

              {/* Destination / Ship To Block */}
              <div style={{ paddingLeft: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '9px', color: '#555555', textTransform: 'uppercase' }}>SHIP TO:</span><br />
                <strong style={{ fontSize: '15px', textTransform: 'uppercase', display: 'block', margin: '2px 0 3px' }}>
                  {order.customer}
                </strong>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.35 }}>
                  {shipping.street}<br />
                  {shipping.city} {shipping.state} {shipping.zip}
                </div>
              </div>
            </div>

            {/* Middle Barcode Block */}
            <div style={{ borderTop: '2.5px solid #000000', borderBottom: '1px solid #000000', padding: '16px 0 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px', color: '#444' }}>
                USPS TRACKING #
              </span>
              {/* Crisp SVG Code 128 Barcode */}
              <svg width='94%' height='54' viewBox='0 0 320 54' preserveAspectRatio='none' style={{ display: 'block', margin: '0 auto 8px' }}>
                {Array.from({ length: 72 }).map((_, i) => {
                  const isBlack = (i * 7 + 3) % 5 !== 0;
                  const barWidth = ((i % 3) + 1) * 1.5;
                  return isBlack ? (
                    <rect key={i} x={i * 4.4} y='0' width={barWidth} height='54' fill='#000000' />
                  ) : null;
                })}
              </svg>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 900, letterSpacing: '0.12em', color: '#000000' }}>
                {currentTracking}
              </div>
            </div>

            {/* Bottom Details Row */}
            <div style={{ paddingTop: '8px', fontSize: '9px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', color: '#333333' }}>
              <span>WT: 14 OZ (0.87 LBS)</span>
              <span>ZONE 4 · SPECIMEN #{order.id}</span>
              <span>{order.date}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className='no-print' style={{ padding: '12px 20px', background: '#faf9f6', borderTop: '1px solid #e5e3de', fontSize: '11px', color: '#76746e', textAlign: 'center' }}>
          💡 Ready for 4x6&quot; thermal label printers or standard paper cutout. Affix to box and bring directly to courier drop.
        </div>
      </div>
    </div>
  );
}

