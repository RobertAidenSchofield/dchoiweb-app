'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  X,
} from 'lucide-react';
import { BespokeCommission, CommissionStage } from '@/types/store';

const STAGES: CommissionStage[] = [
  'Inquiry',
  'Measurements Verified',
  'Scribing Spine',
  'Kanna Hand-Planing',
  'Friction-Fit Testing',
  'Camellia Oil Finishing',
  'Ready for Dispatch',
  'Completed',
];

export function BespokeCommissionsView({
  commissions,
  setCommissions,
  showNotice,
}: {
  commissions: BespokeCommission[];
  setCommissions: React.Dispatch<React.SetStateAction<BespokeCommission[]>>;
  showNotice: (msg: string) => void;
}) {
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = commissions.filter((c) => {
    const matchesStage = stageFilter === 'All' || c.stage === stageFilter;
    const matchesSearch =
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.knifeMaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.bladeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const totalCommissionsValue = commissions.reduce((sum, c) => sum + c.quotedAmount, 0);
  const inProgressCount = commissions.filter((c) => c.stage !== 'Completed').length;

  function advanceStage(commissionId: string) {
    setCommissions((current) =>
      current.map((c) => {
        if (c.id !== commissionId) return c;
        const currentIdx = STAGES.indexOf(c.stage);
        if (currentIdx < STAGES.length - 1) {
          const nextStage = STAGES[currentIdx + 1];
          showNotice(`${c.id} advanced to ${nextStage}`);
          return { ...c, stage: nextStage };
        }
        return c;
      })
    );
  }

  function toggleDeposit(commissionId: string) {
    setCommissions((current) =>
      current.map((c) => {
        if (c.id !== commissionId) return c;
        const depositPaid = !c.depositPaid;
        showNotice(`${c.id} deposit marked as ${depositPaid ? 'Paid' : 'Unpaid'}`);
        return { ...c, depositPaid };
      })
    );
  }

  function toggleFinal(commissionId: string) {
    setCommissions((current) =>
      current.map((c) => {
        if (c.id !== commissionId) return c;
        const finalPaid = !c.finalPaid;
        showNotice(`${c.id} final balance marked as ${finalPaid ? 'Paid' : 'Unpaid'}`);
        return { ...c, finalPaid };
      })
    );
  }

  function handleCreateCommission(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newComm: BespokeCommission = {
      id: `COMM-2026-${Math.floor(11 + Math.random() * 89)}`,
      clientName: String(form.get('clientName')),
      clientEmail: String(form.get('clientEmail')),
      clientPhone: String(form.get('clientPhone') || ''),
      knifeMaker: String(form.get('knifeMaker')),
      bladeType: String(form.get('bladeType')),
      bladeSteel: String(form.get('bladeSteel') || 'High Carbon San-Mai'),
      spineHeelThickness: String(form.get('spineHeelThickness')),
      heelHeight: String(form.get('heelHeight')),
      requestedWood: String(form.get('requestedWood')),
      stage: 'Inquiry',
      quotedAmount: parseFloat(String(form.get('quotedAmount'))) || 295,
      depositAmount: (parseFloat(String(form.get('quotedAmount'))) || 295) / 2,
      depositPaid: false,
      finalPaid: false,
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      targetCompletion: String(form.get('targetCompletion') || '3-4 Weeks'),
      notes: String(form.get('notes') || ''),
    };

    setCommissions((current) => [newComm, ...current]);
    showNotice(`Recorded custom commission: ${newComm.id} for ${newComm.clientName}`);
    setIsModalOpen(false);
  }

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Artisan Bespoke Pipeline</p>
          <h1>Bespoke Commissions &amp; Custom Knife Intake</h1>
          <p>
            Track precision knife measurements, spine distal tapers, wood selections, and craft progression from kanna planing to friction-fit completion.
          </p>
        </div>
        <button
          className='stereo-solid-btn'
          type='button'
          onClick={() => setIsModalOpen(true)}
          style={{ width: 'auto', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} /> New Custom Intake
        </button>
      </div>

      {/* Metric Cards Row */}
      <section className='dashboard-panel-grid' style={{ marginBottom: '24px' }}>
        <div className='metric-card'>
          <span className='metric-label'>Active Studio Commissions</span>
          <strong className='metric-value'>{inProgressCount}</strong>
          <span className='metric-trend positive'>In bench queue</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Total Commission Pipeline</span>
          <strong className='metric-value'>${totalCommissionsValue.toFixed(2)}</strong>
          <span className='metric-trend neutral'>Gross custom quotes</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Average Craft Lead Time</span>
          <strong className='metric-value'>12-16 Days</strong>
          <span className='metric-trend neutral'>Single artisan bench pace</span>
        </div>
      </section>

      {/* Main Table Panel */}
      <section className='dashboard-panel table-panel'>
        <div className='table-toolbar' style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76746e', fontWeight: 600 }}>
              Stage Filter:
            </span>
            {['All', 'Inquiry', 'Measurements Verified', 'Kanna Hand-Planing', 'Ready for Dispatch', 'Completed'].map((s) => (
              <button
                key={s}
                type='button'
                onClick={() => setStageFilter(s)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '2px',
                  border: stageFilter === s ? '1px solid #1d1d1b' : '1px solid #d5d3cc',
                  background: stageFilter === s ? '#1d1d1b' : '#ffffff',
                  color: stageFilter === s ? '#ffffff' : '#1d1d1b',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: '#76746e' }} />
              <input
                type='text'
                placeholder='Search client, maker, knife...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 12px 6px 30px', fontSize: '12px', border: '1px solid #d5d3cc', borderRadius: '2px', width: '220px' }}
              />
            </div>
          </div>
        </div>

        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Commission ID</th>
                <th>Client &amp; Contact</th>
                <th>Knife Spec &amp; Smith</th>
                <th>Spine &amp; Dimensions</th>
                <th>Timber Chosen</th>
                <th>Craft Stage</th>
                <th>Deposit / Final</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comm) => (
                <tr key={comm.id}>
                  <td>
                    <strong style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>{comm.id}</strong>
                    <div style={{ fontSize: '10px', color: '#76746e' }}>Target: {comm.targetCompletion}</div>
                  </td>
                  <td>
                    <div className='customer-cell'>
                      <strong>{comm.clientName}</strong>
                      <span>{comm.clientEmail}</span>
                      {comm.clientPhone && <span style={{ fontSize: '10px', color: '#76746e' }}>{comm.clientPhone}</span>}
                    </div>
                  </td>
                  <td>
                    <strong style={{ textTransform: 'uppercase', fontSize: '12px' }}>{comm.knifeMaker}</strong>
                    <div style={{ color: '#55534e' }}>{comm.bladeType}</div>
                    <div style={{ fontSize: '10px', color: '#76746e' }}>{comm.bladeSteel}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>Spine: {comm.spineHeelThickness}</div>
                    <div style={{ fontSize: '11px', color: '#55534e' }}>Heel: {comm.heelHeight}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#1d1d1b', fontWeight: 500 }}>{comm.requestedWood}</div>
                    {comm.notes && (
                      <div style={{ fontSize: '10px', color: '#76746e', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={comm.notes}>
                        Note: {comm.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        borderRadius: '2px',
                        background:
                          comm.stage === 'Completed'
                            ? '#e8f3ec'
                            : comm.stage === 'Ready for Dispatch'
                            ? '#eef4fa'
                            : '#f6f4ed',
                        color:
                          comm.stage === 'Completed'
                            ? '#2b6e41'
                            : comm.stage === 'Ready for Dispatch'
                            ? '#26547c'
                            : '#665934',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    >
                      {comm.stage}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', fontWeight: 700 }}>${comm.quotedAmount.toFixed(2)}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <button
                        type='button'
                        onClick={() => toggleDeposit(comm.id)}
                        style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          border: '1px solid',
                          borderColor: comm.depositPaid ? '#2b6e41' : '#d5d3cc',
                          background: comm.depositPaid ? '#e8f3ec' : '#ffffff',
                          color: comm.depositPaid ? '#2b6e41' : '#76746e',
                          borderRadius: '1px',
                          cursor: 'pointer',
                        }}
                      >
                        {comm.depositPaid ? 'Dep: ✓ Paid' : 'Dep: Unpaid'}
                      </button>
                      <button
                        type='button'
                        onClick={() => toggleFinal(comm.id)}
                        style={{
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          border: '1px solid',
                          borderColor: comm.finalPaid ? '#2b6e41' : '#d5d3cc',
                          background: comm.finalPaid ? '#e8f3ec' : '#ffffff',
                          color: comm.finalPaid ? '#2b6e41' : '#76746e',
                          borderRadius: '1px',
                          cursor: 'pointer',
                        }}
                      >
                        {comm.finalPaid ? 'Bal: ✓ Paid' : 'Bal: Due'}
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type='button'
                      className='secondary-dashboard-button'
                      style={{ padding: '5px 10px', fontSize: '10px' }}
                      onClick={() => advanceStage(comm.id)}
                      disabled={comm.stage === 'Completed'}
                      title='Advance piece to the next bench craft stage'
                    >
                      Advance Stage ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* New Custom Intake Modal */}
      {isModalOpen && (
        <div className='modal-backdrop' onClick={() => setIsModalOpen(false)}>
          <div className='modal-card' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%' }}>
            <div className='modal-header'>
              <h3>New Bespoke Saya / Woodcraft Intake</h3>
              <button type='button' onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCommission} className='modal-form'>
              <div className='form-row'>
                <label>
                  Client Name
                  <input name='clientName' placeholder='e.g. Marcus Vance' required />
                </label>
                <label>
                  Client Email
                  <input name='clientEmail' type='email' placeholder='client@domain.com' required />
                </label>
              </div>

              <div className='form-row'>
                <label>
                  Phone (Optional)
                  <input name='clientPhone' placeholder='312-555-0199' />
                </label>
                <label>
                  Quoted Price ($)
                  <input name='quotedAmount' type='number' defaultValue={295} required />
                </label>
              </div>

              <div className='form-row'>
                <label>
                  Knife Maker / Blacksmith
                  <input name='knifeMaker' placeholder='e.g. Yoshikane Hamono' required />
                </label>
                <label>
                  Blade Profile / Type
                  <input name='bladeType' placeholder='e.g. 240mm Gyuto' required />
                </label>
              </div>

              <div className='form-row'>
                <label>
                  Spine Thickness / Taper
                  <input name='spineHeelThickness' placeholder='e.g. 3.8mm distal taper to 1.1mm' required />
                </label>
                <label>
                  Heel Height
                  <input name='heelHeight' placeholder='e.g. 52mm' required />
                </label>
              </div>

              <label>
                Selected Timber Species &amp; Retention Pin
                <input name='requestedWood' placeholder='e.g. Japanese Magnolia (Ho-wood) & Gaboon Ebony pin' required />
              </label>

              <div className='form-row'>
                <label>
                  Blade Steel &amp; Finish
                  <input name='bladeSteel' placeholder='e.g. Aogami Super Kurouchi' />
                </label>
                <label>
                  Estimated Completion
                  <input name='targetCompletion' defaultValue='2-3 Weeks' />
                </label>
              </div>

              <label>
                Bench Notes &amp; Special Tolerances
                <textarea name='notes' rows={3} placeholder='e.g. Client requested slightly tighter friction pin clearance and camellia oil saturation.' />
              </label>

              <div className='modal-actions'>
                <button type='button' className='secondary-dashboard-button' onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type='submit' className='stereo-solid-btn' style={{ width: 'auto', padding: '10px 20px' }}>
                  Record Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

