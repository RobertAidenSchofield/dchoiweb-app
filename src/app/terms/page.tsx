import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | DCHOI DESIGNS',
  description: 'Terms of service and studio policies for DCHOI DESIGNS handcrafted sayas and bespoke woodwork.',
};

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#faf9f6', color: '#1d1d1b', padding: '60px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <Link href='/store' style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#445b50', textDecoration: 'none', fontWeight: 600 }}>
          ← Return to Studio Storefront
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '24px 0 8px', letterSpacing: '-0.01em' }}>Terms of Service</h1>
        <p style={{ fontSize: '12px', color: '#7a7872', marginBottom: '36px' }}>Last updated: October 2026 · DCHOI DESIGNS Chicago Studio</p>

        <div style={{ lineHeight: '1.7', fontSize: '14.5px', color: '#333', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>1. Artisan &amp; Handcrafted Craftsmanship</h2>
            <p>
              Every wooden knife saya (sheath), magnetic blade guard, end-grain cutting board, and furniture commission from DCHOI DESIGNS is individually hand-shaped in our Chicago workshop. Natural wood grain, figuring, curl, color tone, and micro-dimensional variations are inherent attributes of natural timber and are celebrated as marks of authentic craftsmanship.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>2. Knife Fitment &amp; Saya Specifications</h2>
            <p>
              Standard sayas are shaped according to standard artisan blade geometries (Santoku, Gyuto, Petty, Nakiri). Because forged Japanese and artisan kitchen knives vary in spine distal taper and heel height, we recommend reviewing provided millimeter dimensions prior to acquisition. For knives with non-standard distal tapers, please submit a bespoke commission request with caliper measurements.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>3. Orders &amp; Payment Processing</h2>
            <p>
              Payments are securely encrypted and processed directly via Stripe (accepting major credit cards, Apple Pay, and Google Pay). All pricing is denominated in USD. Order confirmation receipts are dispatched automatically upon successful transaction clearance.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>4. Limitation of Liability</h2>
            <p>
              DCHOI DESIGNS shall not be liable for incidental or consequential damages resulting from the misuse of cutleries, blade storage sheaths, or wood condition pucks. Knives stored in sayas must be thoroughly dried and clean to protect both blade steel and inner wooden sheath channels.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>5. Studio Inquiries &amp; Maker Contact</h2>
            <p>
              For studio inquiries, custom wood selections, or order questions, contact David Choi directly at{' '}
              <a href='mailto:orders@dchoidesigns.com' style={{ color: '#263b35', fontWeight: 600 }}>orders@dchoidesigns.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

