'use client';

import React, { useState } from 'react';
import { roundToMultipleOf6, safeNumber } from '@/utils/calculator';

type ConverterTab = 'inches' | 'mm' | 'feet-inches';

interface PaneRow {
  id: string;
  label: string;
  widthVal1: number; // inches, mm, or feet for width
  widthVal2: number; // inches for width (used in feet-inches mode)
  heightVal1: number; // inches, mm, or feet for height
  heightVal2: number; // inches for height (used in feet-inches mode)
  qty: number;
}

export default function InchToSqFtConverterPage() {
  const [activeTab, setActiveTab] = useState<ConverterTab>('inches');
  
  // State for the Multi-Pane Worksheet
  const [panes, setPanes] = useState<Record<ConverterTab, PaneRow[]>>({
    inches: [
      { id: 'i1', label: 'Window A', widthVal1: 36, widthVal2: 0, heightVal1: 60, heightVal2: 0, qty: 1 }
    ],
    mm: [
      { id: 'm1', label: 'Pane A', widthVal1: 1000, widthVal2: 0, heightVal1: 1500, heightVal2: 0, qty: 1 }
    ],
    'feet-inches': [
      { id: 'f1', label: 'Door A', widthVal1: 3, widthVal2: 0, heightVal1: 6, heightVal2: 8, qty: 1 }
    ]
  });
  
  // State for the Quick Weight Estimator
  const [glassThickness, setGlassThickness] = useState<number>(5); // Default 5mm glass

  const handleAddPane = () => {
    const id = Math.random().toString(36).substring(7);
    const newRow: PaneRow = {
      id,
      label: `Pane ${panes[activeTab].length + 1}`,
      widthVal1: activeTab === 'mm' ? 1000 : activeTab === 'feet-inches' ? 3 : 36,
      widthVal2: 0,
      heightVal1: activeTab === 'mm' ? 1000 : activeTab === 'feet-inches' ? 6 : 60,
      heightVal2: 0,
      qty: 1
    };

    setPanes(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newRow]
    }));
  };

  const handleUpdatePane = (id: string, field: keyof PaneRow, value: any) => {
    setPanes(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(pane => pane.id === id ? { ...pane, [field]: value } : pane)
    }));
  };

  const handleRemovePane = (id: string) => {
    if (panes[activeTab].length > 1) {
      setPanes(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(pane => pane.id !== id)
      }));
    }
  };

  const handleResetWorksheet = () => {
    if (confirm('Are you sure you want to clear this calculator worksheet?')) {
      const id = Math.random().toString(36).substring(7);
      setPanes(prev => ({
        ...prev,
        [activeTab]: [
          {
            id,
            label: 'Window A',
            widthVal1: activeTab === 'mm' ? 1000 : activeTab === 'feet-inches' ? 3 : 36,
            widthVal2: 0,
            heightVal1: activeTab === 'mm' ? 1000 : activeTab === 'feet-inches' ? 6 : 60,
            heightVal2: 0,
            qty: 1
          }
        ]
      }));
    }
  };

  // Calculations per row
  const calculatePaneSqFt = (row: PaneRow): { rawSqFt: number; billedSqFt: number } => {
    let rawSqFt = 0;
    const qty = safeNumber(row.qty, 1);

    if (activeTab === 'inches') {
      const w = safeNumber(row.widthVal1, 0);
      const h = safeNumber(row.heightVal1, 0);
      rawSqFt = (w * h * qty) / 144;
    } else if (activeTab === 'mm') {
      const w = safeNumber(row.widthVal1, 0);
      const h = safeNumber(row.heightVal1, 0);
      // 1 sq.ft = 92903.04 sq.mm
      rawSqFt = (w * h * qty) / 92903.04;
    } else if (activeTab === 'feet-inches') {
      const wFt = safeNumber(row.widthVal1, 0);
      const wIn = safeNumber(row.widthVal2, 0);
      const hFt = safeNumber(row.heightVal1, 0);
      const hIn = safeNumber(row.heightVal2, 0);

      const totalWIn = (wFt * 12) + wIn;
      const totalHIn = (hFt * 12) + hIn;
      rawSqFt = (totalWIn * totalHIn * qty) / 144;
    }

    if (isNaN(rawSqFt) || !isFinite(rawSqFt) || rawSqFt <= 0) {
      return { rawSqFt: 0, billedSqFt: 0 };
    }

    // Applying Multiple of 6 Rounding Rule per item
    // In Feet-Inches, we round rawSqFt (which includes Qty) or per piece?
    // In glass calculator, we round the area of a single pane, then multiply by quantity.
    // Let's calculate the single piece rawSqFt:
    const singlePaneSqFt = rawSqFt / qty;
    const singleBilledSqFt = roundToMultipleOf6(singlePaneSqFt);
    const billedSqFt = singleBilledSqFt * qty;

    return {
      rawSqFt: parseFloat(rawSqFt.toFixed(2)),
      billedSqFt: parseFloat(billedSqFt.toFixed(2))
    };
  };

  // Totals calculations across active tab worksheet
  const totals = panes[activeTab].reduce(
    (acc, row) => {
      const res = calculatePaneSqFt(row);
      return {
        totalRawSqFt: acc.totalRawSqFt + res.rawSqFt,
        totalBilledSqFt: acc.totalBilledSqFt + res.billedSqFt
      };
    },
    { totalRawSqFt: 0, totalBilledSqFt: 0 }
  );

  // Glass Weight formula: Billed Sq.Ft * thickness * 0.232 = weight in kg
  // Alternatively in lbs: Billed Sq.Ft * thickness * 0.51 = weight in lbs
  const estimatedWeightKg = parseFloat((totals.totalBilledSqFt * glassThickness * 0.232).toFixed(1));
  const estimatedWeightLbs = parseFloat((totals.totalBilledSqFt * glassThickness * 0.51).toFixed(1));

  return (
    <div>
      <div className="header-container no-print">
        <div>
          <h1>Scratchpad Dimensions Converter</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Convert fractional Inches, MM, or Feet & Inches to Square Footage with standard multiple of 6 sheet rounding.
          </p>
        </div>
        <button type="button" onClick={handleResetWorksheet} className="btn btn-secondary">
          Reset Worksheet
        </button>
      </div>

      {/* Tabs Row (Inches, MM, Feet+Inches) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }} className="no-print">
        <button
          type="button"
          onClick={() => setActiveTab('inches')}
          className={`btn ${activeTab === 'inches' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          Inches to Sq.Ft
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mm')}
          className={`btn ${activeTab === 'mm' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          MM to Sq.Ft
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('feet-inches')}
          className={`btn ${activeTab === 'feet-inches' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          Feet & Inches to Sq.Ft
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Main Measurement Worksheet (Left Column) */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {activeTab === 'feet-inches' ? 'Feet & Inches' : activeTab} Calculator Worksheet
            </span>
            <button 
              onClick={handleAddPane}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Row
            </button>
          </div>

          {/* Worksheet Items Table/List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '52vh', overflowY: 'auto', paddingRight: '4px' }}>
            {panes[activeTab].map((pane) => {
              const res = calculatePaneSqFt(pane);
              return (
                <div 
                  key={pane.id} 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: activeTab === 'feet-inches' 
                      ? '2fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr 0.5fr' 
                      : '2.5fr 2fr 0.3fr 2fr 1.5fr 2fr 2fr 0.5fr', 
                    gap: '8px', 
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--glass-border)'
                  }}
                >
                  {/* Label/Location Input */}
                  <div>
                    <input 
                      type="text" 
                      placeholder="Location" 
                      className="form-input"
                      style={{ padding: '8px 10px', fontSize: '0.8rem', width: '100%' }}
                      value={pane.label}
                      onChange={(e) => handleUpdatePane(pane.id, 'label', e.target.value)}
                    />
                  </div>

                  {/* Width Inputs */}
                  {activeTab === 'feet-inches' ? (
                    <>
                      <div>
                        <input 
                          type="number" 
                          placeholder="W (ft)" 
                          className="form-input font-mono"
                          style={{ padding: '8px 8px', fontSize: '0.8rem', width: '100%' }}
                          value={pane.widthVal1 || ''}
                          onChange={(e) => handleUpdatePane(pane.id, 'widthVal1', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          placeholder="W (in)" 
                          className="form-input font-mono"
                          style={{ padding: '8px 8px', fontSize: '0.8rem', width: '100%' }}
                          value={pane.widthVal2 || ''}
                          onChange={(e) => handleUpdatePane(pane.id, 'widthVal2', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>×</div>
                      <div>
                        <input 
                          type="number" 
                          placeholder="H (ft)" 
                          className="form-input font-mono"
                          style={{ padding: '8px 8px', fontSize: '0.8rem', width: '100%' }}
                          value={pane.heightVal1 || ''}
                          onChange={(e) => handleUpdatePane(pane.id, 'heightVal1', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          placeholder="H (in)" 
                          className="form-input font-mono"
                          style={{ padding: '8px 8px', fontSize: '0.8rem', width: '100%' }}
                          value={pane.heightVal2 || ''}
                          onChange={(e) => handleUpdatePane(pane.id, 'heightVal2', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <input 
                          type="number" 
                          placeholder={activeTab === 'mm' ? 'W (mm)' : 'W (in)'} 
                          className="form-input font-mono"
                          style={{ padding: '8px 10px', fontSize: '0.8rem', width: '100%' }}
                          value={pane.widthVal1 || ''}
                          onChange={(e) => handleUpdatePane(pane.id, 'widthVal1', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>×</div>
                      <div>
                        <input 
                          type="number" 
                          placeholder={activeTab === 'mm' ? 'H (mm)' : 'H (in)'} 
                          className="form-input font-mono"
                          style={{ padding: '8px 10px', fontSize: '0.8rem', width: '100%' }}
                          value={pane.heightVal1 || ''}
                          onChange={(e) => handleUpdatePane(pane.id, 'heightVal1', e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}

                  {/* Quantity Input */}
                  <div>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Qty" 
                      className="form-input font-mono"
                      style={{ padding: '8px 10px', fontSize: '0.8rem', width: '100%' }}
                      value={pane.qty || ''}
                      onChange={(e) => handleUpdatePane(pane.id, 'qty', e.target.value === '' ? 1 : Math.max(1, Math.floor(Number(e.target.value))))}
                    />
                  </div>

                  {/* Raw area */}
                  <div style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {res.rawSqFt.toFixed(2)} <span style={{ fontSize: '0.65rem' }}>sq.ft</span>
                  </div>

                  {/* Billed (rounded multiple of 6) */}
                  <div style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary)' }}>
                    {res.billedSqFt.toFixed(1)} <span style={{ fontSize: '0.65rem', fontWeight: 400 }}>sq.ft</span>
                  </div>

                  {/* Delete Row button */}
                  <div style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => handleRemovePane(pane.id)}
                      disabled={panes[activeTab].length <= 1}
                      className="btn btn-danger"
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '0.7rem', 
                        borderRadius: '4px',
                        opacity: panes[activeTab].length <= 1 ? 0.3 : 1,
                        cursor: panes[activeTab].length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                      title="Delete row"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--glass-border)', paddingTop: '12px', marginTop: '4px', lineHeight: '1.4' }}>
            <div>* <strong>Rounding Rule:</strong> Square footage is rounded up to the nearest multiple of 6 per pane (e.g. 19.6 or 23.5 Sq.Ft. becomes 24.0 Sq.Ft.).</div>
            {activeTab === 'mm' && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>* Conversion formula: (Width (mm) × Height (mm) × Qty) / 92903.04</div>}
            {activeTab === 'inches' && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>* Conversion formula: (Width (in) × Height (in) × Qty) / 144</div>}
            {activeTab === 'feet-inches' && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>* Conversion formula: (Width (inches) × Height (inches) × Qty) / 144 (where 1 Foot = 12 Inches)</div>}
          </div>
        </div>

        {/* Sidebar Summary & Weight Config Panel (Right Column) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Accumulated Billed Area Card */}
          <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid var(--primary)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              Billed Area (Total)
            </span>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-header)', marginTop: '8px', color: 'var(--primary)' }}>
              {totals.totalBilledSqFt.toFixed(1)} <span style={{ fontSize: '1.25rem', fontWeight: 400, color: 'var(--text-primary)' }}>Sq.Ft.</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Raw Calculated Sum: {totals.totalRawSqFt.toFixed(2)} Sq.Ft.
            </div>
          </div>

          {/* Logistics Weight Config Card */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              Logistics Weight Estimator
            </h4>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Glass Thickness</label>
              <select 
                className="form-input form-select"
                style={{ width: '100%', background: '#0e1420' }}
                value={glassThickness}
                onChange={(e) => setGlassThickness(Number(e.target.value))}
              >
                <option value={4}>4 mm (Standard Window / Mirror)</option>
                <option value={5}>5 mm (Sturdy Window Panels)</option>
                <option value={6}>6 mm (Heavy Mirror / Tabletop)</option>
                <option value={8}>8 mm (Partition Wall Glass)</option>
                <option value={10}>10 mm (Heavy Shower Screen)</option>
                <option value={12}>12 mm (Toughened Shop Front Door)</option>
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Weight (Metric):</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--warning)' }}>
                  {estimatedWeightKg} kg
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Weight (Imperial):</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {estimatedWeightLbs} lbs
                </strong>
              </div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong>Logistics Carrying Guide:</strong>
              <div style={{ marginTop: '4px' }}>
                {estimatedWeightKg === 0 ? (
                  "Input measurements to view logistics recommendations."
                ) : estimatedWeightKg < 40 ? (
                  "🟢 Light load (< 40kg). Can be safely carried by 1 installer."
                ) : estimatedWeightKg < 80 ? (
                  "🟡 Medium load (40kg - 80kg). Requires at least 2 installers to lift."
                ) : (
                  "🔴 Heavy load (> 80kg). Requires 3-4 installers and specialized delivery suction cups."
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
