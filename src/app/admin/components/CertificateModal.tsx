'use client';

import { Printer, X } from 'lucide-react';
import { Order, Product } from '@/types/store';

export function CertificateModal({
  order,
  product,
  onClose,
}: {
  order: Order;
  product?: Product;
  onClose: () => void;
}) {
  const lotNumber = product?.sku || `DCH-${order.id.replace('#', '')}`;
  const timberSpecies = product?.woodType || 'Japanese Magnolia (Ho-wood) & Aged Black Walnut';
  const finishDetails = 'Pure 100% Camellia Oil & Organic Studio Beeswax';

  function handlePrint() {
    window.print();
  }

  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div
        className='modal-card certificate-modal-wrap'
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '100%', padding: '0', background: '#fbfaf8', color: '#1d1d1b', border: '1px solid #1d1d1b' }}
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
            background: '#ffffff',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#76746e', fontWeight: 600 }}>
              Studio Documents · Collector Specimen Archive
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '16px', textTransform: 'uppercase' }}>
              Certificate of Authenticity
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type='button'
              onClick={handlePrint}
              className='stereo-solid-btn'
              style={{ width: 'auto', padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={13} /> Print Certificate
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

        {/* Printable Certificate Document Body */}
        <div
          id='certificate-printable-area'
          style={{
            padding: '48px 44px',
            margin: '20px auto',
            maxWidth: '580px',
            background: '#ffffff',
            border: '2px double #1d1d1b',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          {/* Subtle Decorative Architectural Border Accent */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              bottom: '8px',
              border: '1px solid rgba(0,0,0,0.15)',
              pointerEvents: 'none',
            }}
          />

          {/* Studio Wordmark */}
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '11px',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#76746e',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Chicago Workshop · 41°53&apos;N 87°38&apos;W
            </span>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                margin: 0,
                color: '#1d1d1b',
              }}
            >
              DCHOI / DESIGNS
            </h1>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#88847d', margin: '4px 0 0' }}>
              Certificate of Studio Authenticity &amp; Provenance
            </p>
          </div>

          <div style={{ height: '1px', background: '#1d1d1b', width: '60px', margin: '0 auto 28px' }} />

          {/* Collector Statement */}
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#383633', margin: '0 0 24px' }}>
            This document certifies that the specimen designated below was hand-shaped, planed with Japanese kanna,
            and individually fitted in the Chicago studio of David Choi.
          </p>

          {/* Dossier Specifications Table */}
          <div
            style={{
              textAlign: 'left',
              border: '1px solid #1d1d1b',
              padding: '16px 20px',
              background: '#faf9f6',
              marginBottom: '28px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e' }}>Specimen Index:</span>
              <strong style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>LOT / {lotNumber}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e' }}>Commission Piece:</span>
              <strong style={{ textTransform: 'uppercase' }}>{order.item}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e' }}>Crafted For:</span>
              <span>{order.customer}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e' }}>Timber Species:</span>
              <span>{timberSpecies}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e' }}>Finish Treatment:</span>
              <span>{finishDetails}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', padding: '6px 0' }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e' }}>Date of Release:</span>
              <span>{order.date}</span>
            </div>
          </div>

          {/* Maker Sign-off & Seal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', padding: '0 10px' }}>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  border: '1.5px solid #1d1d1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                  fontFamily: 'serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '0.05em',
                  color: '#1d1d1b',
                  background: '#f5f3ec',
                }}
              >
                崔
              </div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#76746e', display: 'block' }}>
                Studio Seal · Choi Mark
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: '22px',
                  borderBottom: '1px solid #1d1d1b',
                  paddingBottom: '4px',
                  marginBottom: '4px',
                  minWidth: '160px',
                  textAlign: 'center',
                }}
              >
                David Choi
              </div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#76746e' }}>
                Master Woodcraftsman &amp; Maker
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

