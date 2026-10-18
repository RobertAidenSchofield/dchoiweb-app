'use client';

import { Download } from 'lucide-react';
import { Order } from '@/types/store';

export function AccountingView({
  orders,
  showNotice,
}: {
  orders: Order[];
  showNotice: (msg: string) => void;
}) {
  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  const totalProductRevenue = validOrders.reduce((sum, o) => sum + (o.subtotal || o.amount), 0);
  const totalShippingCollected = validOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const totalTaxCollected = validOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);

  // Illinois (physical nexus origin studio in Cook County, Chicago)
  const ilOrders = validOrders.filter((o) => o.shippingAddress?.state.toUpperCase() === 'IL');
  const ilTaxCollected = ilOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
  const outOfStateOrders = validOrders.filter(
    (o) => !o.shippingAddress || o.shippingAddress.state.toUpperCase() !== 'IL'
  );
  const outOfStateTaxCollected = outOfStateOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);

  // Estimated timber & consumables COGS (approx 14% of product subtotal)
  const estimatedLumberCOGS = totalProductRevenue * 0.14;
  const netContribution = totalProductRevenue - estimatedLumberCOGS;

  function exportOrdersCsv() {
    const headers = [
      'Order Ref',
      'Date',
      'Customer',
      'Email',
      'Street',
      'City',
      'State',
      'Zip',
      'Item',
      'Subtotal ($)',
      'Shipping Cost ($)',
      'Shipping Zone',
      'Sales Tax ($)',
      'Tax Rate',
      'Tax Jurisdiction',
      'Total Paid ($)',
      'Status',
      'Carrier',
      'Tracking Number',
    ];

    const rows = validOrders.map((o) => {
      const address = o.shippingAddress || { street: '', city: '', state: '', zip: '' };
      const subtotal = (o.subtotal || o.amount).toFixed(2);
      const shipping = (o.shippingCost || 0).toFixed(2);
      const tax = (o.taxAmount || 0).toFixed(2);
      const rateStr = o.taxRate !== undefined ? `${(o.taxRate * 100).toFixed(2)}%` : '0.00%';
      const jurisdiction = o.taxJurisdiction || 'Exempt / Unspecified';
      const zoneStr = o.shippingZone ? `Zone ${o.shippingZone}` : 'N/A';

      return [
        `"${o.id}"`,
        `"${o.date}"`,
        `"${o.customer.replace(/"/g, '""')}"`,
        `"${o.email}"`,
        `"${address.street.replace(/"/g, '""')}"`,
        `"${address.city}"`,
        `"${address.state}"`,
        `"${address.zip}"`,
        `"${o.item.replace(/"/g, '""')}"`,
        subtotal,
        shipping,
        `"${zoneStr}"`,
        tax,
        `"${rateStr}"`,
        `"${jurisdiction.replace(/"/g, '""')}"`,
        o.amount.toFixed(2),
        `"${o.status}"`,
        `"${o.carrier || ''}"`,
        `"${o.trackingNumber || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCHOI_DESIGNS_Orders_Tax_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotice('Exported studio sales & tax CSV for accountant / QuickBooks');
  }

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Financial Reporting &amp; Compliance</p>
          <h1>Studio Accounting &amp; Illinois Sales Tax</h1>
          <p>
            Audit gross woodwork receipts, calculate Chicago/Illinois local sales tax vs out-of-state exempt shipments, and export clean CSV ledgers.
          </p>
        </div>
        <button
          className='stereo-solid-btn'
          type='button'
          onClick={exportOrdersCsv}
          style={{ width: 'auto', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={14} /> Export CSV Ledger
        </button>
      </div>

      {/* Metrics Row */}
      <section className='dashboard-panel-grid' style={{ marginBottom: '24px' }}>
        <div className='metric-card'>
          <span className='metric-label'>Gross Order Volume</span>
          <strong className='metric-value'>${(totalProductRevenue + totalShippingCollected + totalTaxCollected).toFixed(2)}</strong>
          <span className='metric-trend positive'>{validOrders.length} Paid Studio Orders</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Woodwork Product Sales</span>
          <strong className='metric-value'>${totalProductRevenue.toFixed(2)}</strong>
          <span className='metric-trend positive'>Net of Shipping &amp; Sales Tax</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Sales Tax Collected</span>
          <strong className='metric-value'>${totalTaxCollected.toFixed(2)}</strong>
          <span className='metric-trend neutral'>IL: ${ilTaxCollected.toFixed(2)} · Out-of-State: ${outOfStateTaxCollected.toFixed(2)}</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Shipping Fees Collected</span>
          <strong className='metric-value'>${totalShippingCollected.toFixed(2)}</strong>
          <span className='metric-trend neutral'>Carrier freight pass-through</span>
        </div>
      </section>

      {/* Tax Breakdown Panel */}
      <section className='dashboard-panel table-panel' style={{ marginBottom: '24px' }}>
        <div className='table-toolbar'>
          <div>
            <strong>Sales Tax Jurisdictions &amp; Filing Breakdown</strong>
            <span className='toolbar-muted'> · Illinois Form ST-1 Ready</span>
          </div>
        </div>
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Filing Jurisdiction</th>
                <th>Rate</th>
                <th>Taxable Volume</th>
                <th>Estimated Tax Liability</th>
                <th>Filing Frequency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Illinois (Cook County &amp; Chicago Municipal)</strong>
                  <div style={{ fontSize: '11px', color: '#76746e' }}>In-state physical nexus studio delivery (10.25%)</div>
                </td>
                <td>
                  <strong>10.25%</strong>
                </td>
                <td>${ilOrders.reduce((s, o) => s + (o.subtotal || o.amount), 0).toFixed(2)}</td>
                <td>
                  <strong style={{ color: '#2b6e41' }}>${ilTaxCollected.toFixed(2)}</strong>
                </td>
                <td>Monthly / Quarterly</td>
                <td>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', background: '#e8f3ec', color: '#2b6e41', padding: '2px 6px', fontWeight: 600 }}>
                    IL Form ST-1
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Destination-Based Out-of-State Shipments</strong>
                  <div style={{ fontSize: '11px', color: '#76746e' }}>State-specific sales tax calculated based on delivery destination</div>
                </td>
                <td>Varies by State</td>
                <td>${outOfStateOrders.reduce((s, o) => s + (o.subtotal || o.amount), 0).toFixed(2)}</td>
                <td>
                  <strong style={{ color: '#2b6e41' }}>${outOfStateTaxCollected.toFixed(2)}</strong>
                </td>
                <td>Remote Nexus</td>
                <td>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', background: '#f5f3ec', color: '#76746e', padding: '2px 6px', fontWeight: 600 }}>
                    Itemized
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Material Margins Panel */}
      <section className='dashboard-panel'>
        <div className='panel-header'>
          <div>
            <h3>Studio Contribution &amp; Lumber Margins</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#76746e' }}>
              High-end bespoke knife sheaths and end-grain blocks operate at 82–88% gross margin over raw hardwood timber.
            </p>
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ borderLeft: '3px solid #1d1d1b', paddingLeft: '14px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e', display: 'block' }}>
                Est. Lumber &amp; Consumables COGS
              </span>
              <strong style={{ fontSize: '20px', color: '#1d1d1b' }}>${estimatedLumberCOGS.toFixed(2)}</strong>
              <div style={{ fontSize: '11px', color: '#55534e' }}>Japanese Magnolia, Walnut, Camellia Oil</div>
            </div>
            <div style={{ borderLeft: '3px solid #2b6e41', paddingLeft: '14px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e', display: 'block' }}>
                Net Studio Margin Contribution
              </span>
              <strong style={{ fontSize: '20px', color: '#2b6e41' }}>${netContribution.toFixed(2)}</strong>
              <div style={{ fontSize: '11px', color: '#55534e' }}>~86% Artisan Labor &amp; Workshop Return</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

