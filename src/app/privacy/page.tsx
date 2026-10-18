import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | DCHOI DESIGNS',
  description: 'Privacy policy and data protection practices for DCHOI DESIGNS.',
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#faf9f6', color: '#1d1d1b', padding: '60px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <Link href='/store' style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#445b50', textDecoration: 'none', fontWeight: 600 }}>
          ← Return to Studio Storefront
        </Link>

        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '24px 0 8px', letterSpacing: '-0.01em' }}>Privacy Policy</h1>
        <p style={{ fontSize: '12px', color: '#7a7872', marginBottom: '36px' }}>Last updated: October 2026 · DCHOI DESIGNS Chicago Studio</p>

        <div style={{ lineHeight: '1.7', fontSize: '14.5px', color: '#333', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>1. Information We Collect</h2>
            <p>
              When you purchase a handcrafted piece from DCHOI DESIGNS or submit a custom knife measurement, we collect:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li><strong>Contact Information:</strong> Name, email address, and delivery shipping address.</li>
              <li><strong>Order Details:</strong> Products selected, blade geometry inquiries, and delivery tracking records.</li>
              <li><strong>Payment Information:</strong> Handled securely and tokenized directly by Stripe. DCHOI DESIGNS does not store or process your raw credit card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>2. How Your Information Is Used</h2>
            <p>
              Your information is exclusively utilized to:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li>Fulfill and securely dispatch your physical order with USPS or UPS tracking.</li>
              <li>Transmit your automated order confirmation receipt, care guides, and tracking notices.</li>
              <li>Communicate regarding bespoke knife saya measurements or wood selection approvals.</li>
            </ul>
            <p style={{ marginTop: '8px' }}>
              We never sell, rent, or monetize collector details or email addresses to third parties.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>3. Third-Party Service Providers</h2>
            <p>
              We partner with trusted technical services strictly to facilitate store operations:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li><strong>Stripe:</strong> Encrypted payment tokenization and card processing.</li>
              <li><strong>USPS / UPS:</strong> Commercial parcel postage purchasing and delivery routing.</li>
              <li><strong>Resend / SendGrid:</strong> Automated transactional email dispatch.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1d1d1b', marginBottom: '8px' }}>4. Data Inquiries &amp; Deletion</h2>
            <p>
              To inspect, modify, or request deletion of your order records or waitlist entries, contact David Choi at{' '}
              <a href='mailto:orders@dchoidesigns.com' style={{ color: '#263b35', fontWeight: 600 }}>orders@dchoidesigns.com</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

