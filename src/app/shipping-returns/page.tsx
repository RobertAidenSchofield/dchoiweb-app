import Link from 'next/link';

export const metadata = {
  title: 'Shipping, Returns & Care Policy | DCHOI DESIGNS',
  description: 'Shipping lead times, studio packaging, return policies, and wood maintenance guidelines for DCHOI DESIGNS.',
};

export default function ShippingReturnsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#faf9f6', color: '#1d1d1b', padding: '60px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <Link href='/store' style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#445b50', textDecoration: 'none', fontWeight: 600 }}>
          ← Return to Studio Storefront
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '24px 0 8px', letterSpacing: '-0.01em' }}>Shipping, Returns &amp; Care Policy</h1>
        <p style={{ fontSize: '12px', color: '#7a7872', marginBottom: '36px' }}>Hand-crafted in Chicago · Insured Domestic &amp; Worldwide Delivery</p>

        <div style={{ lineHeight: '1.7', fontSize: '14.5px', color: '#333', display: 'flex', flexDirection: 'column', gap: '26px' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>1. Lead Times &amp; Studio Fulfillment</h2>
            <p>
              <strong>In-Stock Studio Inventory:</strong> Pieces from our regular catalog (Santoku/Gyuto sayas, standard cutting boards) are inspected, final-honed, and packaged within <strong>2 to 4 business days</strong>.
            </p>
            <p style={{ marginTop: '8px' }}>
              <strong>Custom &amp; Bespoke Commissions:</strong> Custom sayas requiring knife caliper measurements and timber book-matching generally require <strong>2 to 3 weeks</strong> from measurement confirmation to final dispatch.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>2. Carriers &amp; Tracking</h2>
            <p>
              All shipments depart directly from our Chicago studio via <strong>USPS Priority Mail</strong> or <strong>UPS Ground</strong>. Every package includes full carrier tracking and transit insurance. Once dispatched, an official carrier tracking link is automatically emailed to your inbox.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>3. Returns &amp; Exchanges Policy</h2>
            <p>
              <strong>Standard In-Stock Catalog Items:</strong> We accept returns of unmarred, unconditioned standard catalog pieces within <strong>14 days of confirmed delivery</strong>. The collector is responsible for return shipping in original protective packaging.
            </p>
            <p style={{ marginTop: '8px' }}>
              <strong>Custom &amp; Bespoke Knife Sayas:</strong> Because custom sayas are carved to fit the unique distal taper, spine geometry, and heel contour of an individual collector&apos;s knife, custom bespoke pieces are <strong>final sale</strong> once fabricated. If a fitment variance occurs due to knife measurement discrepancies, we are glad to re-plane or adjust the inner channel upon request.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>4. Blade &amp; Wood Care Protocol</h2>
            <p>
              To maintain natural wood tone and protect knife steel:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Never place wooden sayas or cutting boards in a dishwasher.</li>
              <li>Ensure knives are clean and thoroughly dried before sliding into wooden sheaths.</li>
              <li>Recondition the timber exterior twice a year with food-safe mineral oil or natural beeswax paste.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>5. Studio Support Contact</h2>
            <p>
              Questions regarding existing tracking numbers or custom sheath fittings may be directed to David Choi at{' '}
              <a href='mailto:orders@dchoidesigns.com' style={{ color: '#263b35', fontWeight: 600 }}>orders@dchoidesigns.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

