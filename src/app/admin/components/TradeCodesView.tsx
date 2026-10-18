'use client';

import { useState } from 'react';
import {
  Copy,
  Plus,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { TradeAccessCode } from '@/types/store';

export function TradeCodesView({
  promoCodes,
  setPromoCodes,
  showNotice,
}: {
  promoCodes: TradeAccessCode[];
  setPromoCodes: React.Dispatch<React.SetStateAction<TradeAccessCode[]>>;
  showNotice: (msg: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function toggleActive(id: string) {
    setPromoCodes((current) =>
      current.map((p) => {
        if (p.id !== id) return p;
        const newActive = !p.active;
        showNotice(`Code ${p.code} is now ${newActive ? 'Active' : 'Inactive'}`);
        return { ...p, active: newActive };
      })
    );
  }

  function copyCode(code: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      showNotice(`Copied code "${code}" to clipboard`);
    }
  }

  function handleCreateCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newCode: TradeAccessCode = {
      id: `promo-${Date.now()}`,
      code: String(form.get('code')).trim().toUpperCase(),
      description: String(form.get('description')),
      discountType: (form.get('discountType') as TradeAccessCode['discountType']) || 'percentage',
      discountValue: parseFloat(String(form.get('discountValue'))) || 10,
      recipientOrPartner: String(form.get('recipientOrPartner')),
      usesCount: 0,
      maxUses: parseInt(String(form.get('maxUses')), 10) || 25,
      active: true,
    };

    setPromoCodes((current) => [newCode, ...current]);
    showNotice(`Created new access code: ${newCode.code}`);
    setIsModalOpen(false);
  }

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Collector Allocations &amp; Trade Relationships</p>
          <h1>VIP Collector &amp; Restaurant Trade Codes</h1>
          <p>
            Manage private access codes for recurring knife collectors, knife sharpeners, and culinary restaurant partners (e.g., Chicago fine dining trade allocations).
          </p>
        </div>
        <button
          className='stereo-solid-btn'
          type='button'
          onClick={() => setIsModalOpen(true)}
          style={{ width: 'auto', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} /> New Trade Code
        </button>
      </div>

      <section className='dashboard-panel table-panel'>
        <div className='table-toolbar'>
          <div>
            <strong>{promoCodes.length} active trade &amp; collector codes</strong>
            <span className='toolbar-muted'> · Private allocations</span>
          </div>
        </div>

        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Access Code</th>
                <th>Benefit / Value</th>
                <th>Recipient / Culinary Partner</th>
                <th>Redemption Count</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', letterSpacing: '0.06em' }}>
                        {item.code}
                      </strong>
                      <button
                        type='button'
                        onClick={() => copyCode(item.code)}
                        style={{ background: 'none', border: 0, cursor: 'pointer', color: '#76746e', padding: '2px' }}
                        title='Copy code'
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: '11px', color: '#55534e' }}>{item.description}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>
                      {item.discountType === 'percentage' ? `${item.discountValue}% OFF` : `$${item.discountValue} CREDIT`}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.recipientOrPartner}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {item.usesCount} / {item.maxUses || '∞'} uses
                    </span>
                  </td>
                  <td>
                    <button
                      type='button'
                      onClick={() => toggleActive(item.id)}
                      style={{
                        background: 'none',
                        border: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: item.active ? '#2b6e41' : '#76746e',
                      }}
                    >
                      {item.active ? (
                        <>
                          <ToggleRight size={20} color='#2b6e41' /> Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={20} color='#99958d' /> Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type='button'
                      className='secondary-dashboard-button'
                      style={{ padding: '4px 10px', fontSize: '10px' }}
                      onClick={() => copyCode(item.code)}
                    >
                      Copy Link / Code
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* New Code Modal */}
      {isModalOpen && (
        <div className='modal-backdrop' onClick={() => setIsModalOpen(false)}>
          <div className='modal-card' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '100%' }}>
            <div className='modal-header'>
              <h3>Generate VIP Collector / Trade Code</h3>
              <button type='button' onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCode} className='modal-form'>
              <div className='form-row'>
                <label>
                  Access Code
                  <input name='code' placeholder='e.g. KASAMA-CHEF-15' required style={{ textTransform: 'uppercase' }} />
                </label>
                <label>
                  Partner / Recipient
                  <input name='recipientOrPartner' placeholder='e.g. Kasama Culinary Team' required />
                </label>
              </div>

              <div className='form-row'>
                <label>
                  Benefit Type
                  <select name='discountType' defaultValue='percentage' style={{ background: '#ffffff' }}>
                    <option value='percentage'>Percentage (%)</option>
                    <option value='fixed'>Fixed Credit ($)</option>
                  </select>
                </label>
                <label>
                  Discount Amount (e.g. 15 or 50)
                  <input name='discountValue' type='number' defaultValue={15} required />
                </label>
              </div>

              <label>
                Max Redemptions
                <input name='maxUses' type='number' defaultValue={30} required />
              </label>

              <label>
                Description / Purpose
                <input name='description' placeholder='e.g. Private 15% allowance for Michelin culinary brigade members.' required />
              </label>

              <div className='modal-actions'>
                <button type='button' className='secondary-dashboard-button' onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type='submit' className='stereo-solid-btn' style={{ width: 'auto', padding: '10px 20px' }}>
                  Create Access Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

