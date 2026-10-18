'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  Radio,
  Send,
  X,
} from 'lucide-react';
import { EmailSettings, Product, WaitlistEntry } from '@/types/store';
import { dispatchEmail } from '@/lib/emailService';

export function WaitlistView({
  waitlist,
  setWaitlist,
  products,
  emailSettings,
  showNotice,
}: {
  waitlist: WaitlistEntry[];
  setWaitlist: React.Dispatch<React.SetStateAction<WaitlistEntry[]>>;
  products: Product[];
  emailSettings: EmailSettings;
  showNotice: (msg: string) => void;
}) {
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [dropMessage, setDropMessage] = useState(
    'A fresh studio batch of Japanese Magnolia sayas has completed final oil cure and is now live on the storefront.'
  );
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const pendingCount = waitlist.filter((w) => !w.notified).length;
  const targetProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const matchingWaitlist = waitlist.filter((w) => w.productId === targetProduct?.id && !w.notified);

  async function handleBroadcastDrop() {
    if (!targetProduct || matchingWaitlist.length === 0) {
      showNotice('No pending collectors on waitlist for this piece');
      return;
    }

    setIsBroadcasting(true);
    let sentCount = 0;

    for (const entry of matchingWaitlist) {
      try {
        await dispatchEmail({
          product: targetProduct,
          recipientEmail: entry.customerEmail,
          recipientName: entry.customerName,
          type: 'order_confirmation', // Used as base delivery
          subject: `[Small Batch Drop] ${targetProduct.name} is Now in Stock — DCHOI DESIGNS`,
          settings: emailSettings,
        });
        sentCount++;
      } catch (e) {
        console.error('Failed to notify waitlist user:', e);
      }
    }

    // Mark entries as notified
    const nowStr = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    setWaitlist((current) =>
      current.map((w) => (w.productId === targetProduct.id ? { ...w, notified: true, notifiedAt: nowStr } : w))
    );

    setIsBroadcasting(false);
    setIsDropModalOpen(false);
    showNotice(`Batch announcement broadcast to ${sentCount} waitlisted collectors!`);
  }

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Collector Demand &amp; Scarcity</p>
          <h1>Small-Batch Drop &amp; Restock Waitlist</h1>
          <p>
            Capture collector demand when studio batches sell out. Trigger automated 1-click batch notifications the moment you restock inventory.
          </p>
        </div>
        <button
          className='stereo-solid-btn'
          type='button'
          onClick={() => setIsDropModalOpen(true)}
          style={{ width: 'auto', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Radio size={14} /> Broadcast Batch Drop
        </button>
      </div>

      {/* Metrics Grid */}
      <section className='dashboard-panel-grid' style={{ marginBottom: '24px' }}>
        <div className='metric-card'>
          <span className='metric-label'>Pending Waitlist Collectors</span>
          <strong className='metric-value'>{pendingCount}</strong>
          <span className='metric-trend positive'>Awaiting batch restocks</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Most Requested Specimen</span>
          <strong className='metric-value'>Nakiri Saya</strong>
          <span className='metric-trend neutral'>2 Active Inquiries</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Drop Conversion Rate</span>
          <strong className='metric-value'>68%</strong>
          <span className='metric-trend positive'>Collectors purchasing within 48h</span>
        </div>
      </section>

      {/* Waitlist Registry Table */}
      <section className='dashboard-panel table-panel'>
        <div className='table-toolbar'>
          <div>
            <strong>{waitlist.length} collector inquiries</strong>
            <span className='toolbar-muted'> · Total recorded allocation demand</span>
          </div>
        </div>
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Collector</th>
                <th>Requested Piece</th>
                <th>Registered Date</th>
                <th>Allocation Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className='customer-cell'>
                      <strong>{item.customerName}</strong>
                      <span>{item.customerEmail}</span>
                    </div>
                  </td>
                  <td>
                    <strong>{item.productName}</strong>
                  </td>
                  <td>{item.requestedAt}</td>
                  <td>
                    {item.notified ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#2b6e41',
                          background: '#e8f3ec',
                          padding: '3px 8px',
                          borderRadius: '2px',
                          fontWeight: 600,
                        }}
                      >
                        <Check size={11} /> Notified ({item.notifiedAt || 'Dispatched'})
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#765922',
                          background: '#f8f5eb',
                          padding: '3px 8px',
                          borderRadius: '2px',
                          fontWeight: 600,
                        }}
                      >
                        <Bell size={11} /> Waiting for Restock
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!item.notified && (
                      <button
                        type='button'
                        className='secondary-dashboard-button'
                        style={{ padding: '5px 10px', fontSize: '10px' }}
                        onClick={() => {
                          setSelectedProductId(item.productId);
                          setIsDropModalOpen(true);
                        }}
                      >
                        <Send size={11} /> Trigger Alert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Broadcast Modal */}
      {isDropModalOpen && (
        <div className='modal-backdrop' onClick={() => setIsDropModalOpen(false)}>
          <div className='modal-card' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '100%' }}>
            <div className='modal-header'>
              <h3>Broadcast Small-Batch Drop Alert</h3>
              <button type='button' onClick={() => setIsDropModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', fontSize: '13px' }}>
              <p style={{ margin: '0 0 16px', color: '#55534e' }}>
                Select the restocked specimen. All collectors waiting for this piece will receive a direct studio email announcement.
              </p>

              <label style={{ display: 'block', marginBottom: '14px' }}>
                Restocked Specimen:
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '6px', border: '1px solid #1d1d1b', background: '#ffffff' }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  background: '#f8f7f4',
                  border: '1px solid rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                  borderRadius: '2px',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e', display: 'block' }}>
                  Target Recipients:
                </span>
                <strong style={{ fontSize: '14px', color: '#1d1d1b' }}>
                  {matchingWaitlist.length} pending collector{matchingWaitlist.length === 1 ? '' : 's'}
                </strong>
                {matchingWaitlist.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#687d71', marginTop: '4px' }}>
                    {matchingWaitlist.map((m) => m.customerName).join(', ')}
                  </div>
                )}
              </div>

              <label style={{ display: 'block', marginBottom: '16px' }}>
                Studio Announcement Note:
                <textarea
                  rows={3}
                  value={dropMessage}
                  onChange={(e) => setDropMessage(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', marginTop: '6px', border: '1px solid #d5d3cc', fontSize: '12px' }}
                />
              </label>

              <div className='modal-actions'>
                <button type='button' className='secondary-dashboard-button' onClick={() => setIsDropModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleBroadcastDrop}
                  disabled={isBroadcasting || matchingWaitlist.length === 0}
                  className='stereo-solid-btn'
                  style={{ width: 'auto', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} />
                  {isBroadcasting ? 'Broadcasting...' : `Send Drop Alert (${matchingWaitlist.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

