'use client';

import { useState } from 'react';
import {
  Droplets,
  Plus,
  X,
} from 'lucide-react';
import { TimberLot } from '@/types/store';

export function TimberLotsView({
  timberLots,
  setTimberLots,
  showNotice,
}: {
  timberLots: TimberLot[];
  setTimberLots: React.Dispatch<React.SetStateAction<TimberLot[]>>;
  showNotice: (msg: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalBoardFeet = timberLots.reduce((sum, t) => sum + t.boardFeet, 0);
  const totalValuation = timberLots.reduce((sum, t) => sum + t.boardFeet * t.costPerBoardFoot, 0);
  const avgMoisture =
    timberLots.length > 0
      ? (timberLots.reduce((sum, t) => sum + t.moisturePercent, 0) / timberLots.length).toFixed(1)
      : '7.5';

  function handleCreateLot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newLot: TimberLot = {
      id: `LOT-${String(form.get('species')).slice(0, 3).toUpperCase()}-${Math.floor(20 + Math.random() * 79)}`,
      species: String(form.get('species')),
      origin: String(form.get('origin')),
      harvestYear: String(form.get('harvestYear')),
      boardFeet: parseFloat(String(form.get('boardFeet'))) || 10,
      moisturePercent: parseFloat(String(form.get('moisturePercent'))) || 7.5,
      costPerBoardFoot: parseFloat(String(form.get('costPerBoardFoot'))) || 25,
      supplier: String(form.get('supplier')),
      status: (form.get('status') as TimberLot['status']) || 'Active Milling',
      notes: String(form.get('notes') || ''),
    };

    setTimberLots((current) => [newLot, ...current]);
    showNotice(`Registered timber lot: ${newLot.id} (${newLot.species})`);
    setIsModalOpen(false);
  }

  function adjustBoardFeet(lotId: string, change: number) {
    setTimberLots((current) =>
      current.map((t) => {
        if (t.id !== lotId) return t;
        const newBF = Math.max(0, t.boardFeet + change);
        const status = newBF === 0 ? 'Depleted' : t.status;
        showNotice(`${t.id} board feet updated to ${newBF} BF`);
        return { ...t, boardFeet: newBF, status };
      })
    );
  }

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Raw Material Provenance &amp; Assets</p>
          <h1>Studio Hardwood &amp; Timber Registry</h1>
          <p>
            Track board feet, moisture meter readings (EMC equilibrium 7-9%), harvest provenance, and true lumber acquisition costs.
          </p>
        </div>
        <button
          className='stereo-solid-btn'
          type='button'
          onClick={() => setIsModalOpen(true)}
          style={{ width: 'auto', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} /> Register Timber Lot
        </button>
      </div>

      {/* Metrics Row */}
      <section className='dashboard-panel-grid' style={{ marginBottom: '24px' }}>
        <div className='metric-card'>
          <span className='metric-label'>Lumber Stock on Hand</span>
          <strong className='metric-value'>{totalBoardFeet} BF</strong>
          <span className='metric-trend positive'>{timberLots.length} Active Hardwood Lots</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Raw Timber Valuation</span>
          <strong className='metric-value'>${totalValuation.toFixed(2)}</strong>
          <span className='metric-trend neutral'>Asset acquisition cost basis</span>
        </div>
        <div className='metric-card'>
          <span className='metric-label'>Average Moisture Content</span>
          <strong className='metric-value'>{avgMoisture}% EMC</strong>
          <span className='metric-trend positive'>Optimal knife stability (7-8%)</span>
        </div>
      </section>

      {/* Timber Table */}
      <section className='dashboard-panel table-panel'>
        <div className='table-toolbar'>
          <div>
            <strong>{timberLots.length} Hardwood Lots</strong>
            <span className='toolbar-muted'> · Studio curing &amp; bench milling reserves</span>
          </div>
        </div>
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>Species &amp; Botanical</th>
                <th>Provenance &amp; Harvest</th>
                <th>Moisture (EMC)</th>
                <th>Board Feet (BF)</th>
                <th>Cost / BF</th>
                <th>Total Value</th>
                <th>Milling Status</th>
                <th style={{ textAlign: 'right' }}>BF Stock Adjust</th>
              </tr>
            </thead>
            <tbody>
              {timberLots.map((lot) => (
                <tr key={lot.id}>
                  <td>
                    <strong style={{ fontFamily: 'ui-monospace, monospace' }}>{lot.id}</strong>
                    <div style={{ fontSize: '10px', color: '#76746e' }}>{lot.supplier}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{lot.species}</strong>
                    {lot.notes && (
                      <div style={{ fontSize: '10px', color: '#76746e', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lot.notes}>
                        {lot.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{lot.origin}</div>
                    <div style={{ fontSize: '10px', color: '#76746e' }}>{lot.harvestYear}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '2px',
                        fontWeight: 600,
                        background: lot.moisturePercent <= 8.5 ? '#e8f3ec' : '#f8f5eb',
                        color: lot.moisturePercent <= 8.5 ? '#2b6e41' : '#765922',
                      }}
                    >
                      <Droplets size={10} /> {lot.moisturePercent}%
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{lot.boardFeet} BF</strong>
                  </td>
                  <td>${lot.costPerBoardFoot.toFixed(2)}</td>
                  <td>
                    <strong>${(lot.boardFeet * lot.costPerBoardFoot).toFixed(2)}</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        fontWeight: 600,
                        background:
                          lot.status === 'Active Milling'
                            ? '#e8f3ec'
                            : lot.status === 'In Seasoning'
                            ? '#eef4fa'
                            : '#f9eaea',
                        color:
                          lot.status === 'Active Milling'
                            ? '#2b6e41'
                            : lot.status === 'In Seasoning'
                            ? '#26547c'
                            : '#8c2626',
                      }}
                    >
                      {lot.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button
                        type='button'
                        className='secondary-dashboard-button'
                        style={{ padding: '3px 8px', fontSize: '10px' }}
                        onClick={() => adjustBoardFeet(lot.id, -1)}
                        disabled={lot.boardFeet <= 0}
                        title='Deduct 1 board foot used on bench'
                      >
                        -1 BF
                      </button>
                      <button
                        type='button'
                        className='secondary-dashboard-button'
                        style={{ padding: '3px 8px', fontSize: '10px' }}
                        onClick={() => adjustBoardFeet(lot.id, 5)}
                        title='Add 5 board feet from shop delivery'
                      >
                        +5 BF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* New Lot Modal */}
      {isModalOpen && (
        <div className='modal-backdrop' onClick={() => setIsModalOpen(false)}>
          <div className='modal-card' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
            <div className='modal-header'>
              <h3>Register New Timber Lot</h3>
              <button type='button' onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateLot} className='modal-form'>
              <div className='form-row'>
                <label>
                  Timber Species
                  <input name='species' placeholder='e.g. Japanese Magnolia (Ho-wood)' required />
                </label>
                <label>
                  Provenance / Origin
                  <input name='origin' placeholder='e.g. Gifu Prefecture, Japan' required />
                </label>
              </div>

              <div className='form-row'>
                <label>
                  Harvest / Seasoning Year
                  <input name='harvestYear' placeholder='e.g. 2023 Kiln-Cured' required />
                </label>
                <label>
                  Supplier / Guild
                  <input name='supplier' placeholder='e.g. Hida Woodcraft Syndicate' required />
                </label>
              </div>

              <div className='form-row'>
                <label>
                  Board Feet (BF)
                  <input name='boardFeet' type='number' step='0.5' defaultValue={20} required />
                </label>
                <label>
                  Moisture Meter % (EMC)
                  <input name='moisturePercent' type='number' step='0.1' defaultValue={7.4} required />
                </label>
              </div>

              <div className='form-row'>
                <label>
                  Acquisition Cost per BF ($)
                  <input name='costPerBoardFoot' type='number' step='0.5' defaultValue={32} required />
                </label>
                <label>
                  Status
                  <select name='status' defaultValue='Active Milling' style={{ background: '#ffffff' }}>
                    <option value='Active Milling'>Active Milling</option>
                    <option value='In Seasoning'>In Seasoning</option>
                    <option value='Depleted'>Depleted</option>
                  </select>
                </label>
              </div>

              <label>
                Grain Figure &amp; Shop Notes
                <textarea name='notes' rows={2} placeholder='e.g. Quarter-sawn rift grain with high dimensional stability for knife sheaths.' />
              </label>

              <div className='modal-actions'>
                <button type='button' className='secondary-dashboard-button' onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type='submit' className='stereo-solid-btn' style={{ width: 'auto', padding: '10px 20px' }}>
                  Register Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

