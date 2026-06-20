'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotation } from '@/context/QuotationContext';
import {
  calculateItemRow,
  calculateQuoteSummary,
  GlassItemInput,
  GlassCategory,
  safeNumber,
  formatRupee,
  formatCustomCurrency
} from '@/utils/calculator';

export default function QuotationCreatorPage() {
  const router = useRouter();
  const {
    draft,
    companyProfile,
    updateDraftInfo,
    addDraftItem,
    updateDraftItem,
    removeDraftItem,
    clearDraft,
    saveQuotation,
    categories,
    addCategory,
    removeCategory,
    updateCategory
  } = useQuotation();

  const quoteCurrency = draft.items[0]?.currencySymbol || '₹';

  // Local state for the pane currently being configured in the form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GlassCategory>('door');
  const [sizeSqFt, setSizeSqFt] = useState('');
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState('120');
  const [hideSize, setHideSize] = useState(false);
  const [hideQty, setHideQty] = useState(false);

  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // Compute live preview metrics for the current item before adding it
  const [liveResult, setLiveResult] = useState<any>(null);

  useEffect(() => {
    const item: Partial<GlassItemInput> = {
      sizeSqFt: hideSize ? 1 : Math.max(0, safeNumber(sizeSqFt, 0)),
      quantity: hideQty ? 1 : Math.max(1, safeNumber(quantity, 1)),
      rate: Math.max(0, safeNumber(rate, 0)),
      hideSize,
      hideQty
    };
    const res = calculateItemRow(item);
    setLiveResult(res);
  }, [sizeSqFt, quantity, rate, hideSize, hideQty]);

  // Compute cumulative summary of items already in the draft list
  const summary = calculateQuoteSummary(
    draft.items as GlassItemInput[],
    draft.isTaxEnabled !== false ? companyProfile.taxRate : 0,
    draft.discount,
    draft.isDiscountFlat,
    draft.transportCharges,
    draft.labourCharges
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    const size = hideSize ? 1 : (sizeSqFt === '' ? 0 : safeNumber(sizeSqFt, 0));
    const qty = hideQty ? 1 : (quantity === '' ? 1 : safeNumber(quantity, 1));
    const itemRate = safeNumber(rate, 0);

    addDraftItem({
      name: name || `${category.toUpperCase()} Pane`,
      description,
      category,
      sizeSqFt: size,
      quantity: Math.max(0, Math.floor(qty)),
      rate: itemRate,
      qtyUnit: 'pcs',
      sizeUnit: 'sq.ft',
      currencySymbol: '₹',
      hideSize,
      hideQty
    });

    // Reset item configuration form
    setName('');
    setDescription('');
    setSizeSqFt('');
    setQuantity('');
  };

  const handleSaveQuotation = () => {
    if (draft.items.length === 0) {
      alert('Please add at least one item to the quotation sheet first.');
      return;
    }
    const saved = saveQuotation();
    alert(`Quotation ${saved.quoteNumber} saved successfully!`);
    router.push(`/quotation-list?id=${saved.id}`);
  };

  return (
    <div>
      <div className="header-container no-print">
        <div>
          <h1>Glass SaaS Quotation Builder</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Generate instant estimates for glass doors, windows, and mirrors using direct square-footage rates.
          </p>
        </div>
        <button type="button" onClick={clearDraft} className="btn btn-secondary no-print">
          Clear Estimator Draft
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Row Builder Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Glass Item Configuration Form */}
          <div className="glass-panel">
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--primary)' }}>
              Add Glass Item
            </h3>
            
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Item Category</label>
                    <button
                      type="button"
                      onClick={() => setIsEditingCategories(true)}
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', margin: 0 }}
                    >
                      Edit Categories
                    </button>
                  </div>
                  <select
                    className="form-input form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} style={{ background: '#0e1420', textTransform: 'capitalize' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Item Title / Name</label>
                  <button
                    type="button"
                    onClick={() => setName(prev => prev + '\n')}
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', margin: 0 }}
                  >
                    + New Line
                  </button>
                </div>
                <textarea
                  placeholder="e.g., Balcony French Window&#10;Main Bath Mirror"
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: '60px', fontFamily: 'var(--font-sans)' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Specifications</label>
                <input
                  type="text"
                  placeholder="e.g., 12mm Toughened Clear Glass with D-Bracket hinges"
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {hideSize ? (
                  <div 
                    className="form-group" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      border: '1px dashed var(--glass-border)', 
                      borderRadius: 'var(--radius-sm)', 
                      cursor: 'pointer', 
                      height: '100%', 
                      minHeight: '66px',
                      background: 'rgba(255,255,255,0.01)'
                    }} 
                    onClick={() => setHideSize(false)}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>+ Add Size Label</span>
                  </div>
                ) : (
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ margin: 0 }}>{draft.sizeHeading || 'Size (Sq.Ft.)'}</label>
                      <button
                        type="button"
                        onClick={() => setHideSize(true)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px', lineHeight: '1', fontWeight: 700 }}
                        title="Remove Size column"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 19.6"
                      className="form-input font-mono"
                      value={sizeSqFt}
                      onChange={(e) => setSizeSqFt(e.target.value)}
                    />
                  </div>
                )}

                {hideQty ? (
                  <div 
                    className="form-group" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      border: '1px dashed var(--glass-border)', 
                      borderRadius: 'var(--radius-sm)', 
                      cursor: 'pointer', 
                      height: '100%', 
                      minHeight: '66px',
                      background: 'rgba(255,255,255,0.01)'
                    }} 
                    onClick={() => setHideQty(false)}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>+ Add Qty Label</span>
                  </div>
                ) : (
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ margin: 0 }}>{draft.unitHeading || 'Qty (Units)'}</label>
                      <button
                        type="button"
                        onClick={() => setHideQty(true)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px', lineHeight: '1', fontWeight: 700 }}
                        title="Remove Qty column"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder="Qty"
                      className="form-input font-mono"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Price / {hideSize ? (draft.unitHeading || 'Unit') : (draft.sizeHeading || 'Sq.Ft.')}</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', lineHeight: '1' }}>₹</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Rate"
                    className="form-input font-mono"
                    style={{ paddingLeft: '24px', width: '100%' }}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Live Calculations Preview for Single Item */}
              {liveResult && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '16px', marginTop: '8px', fontSize: '0.85rem' }}>
                  {!hideSize && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{draft.sizeHeading || 'Size'}:</span>
                      <span style={{ fontWeight: 600 }}>{safeNumber(sizeSqFt, 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Formula:</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {!hideSize && `${safeNumber(sizeSqFt, 0).toFixed(2)}`}
                      {!hideSize && !hideQty && ` × `}
                      {!hideQty && `${safeNumber(quantity, 1)} qty`}
                      {(!hideSize || !hideQty) && ` × `}
                      ₹{safeNumber(rate, 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '8px', marginTop: '8px', fontSize: '1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Item Total:</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{formatRupee(liveResult.itemTotal)}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Item to Sheet
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Customer Info, Draft Summary & Save */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Customer Details Form */}
          <div className="glass-panel">
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--primary)' }}>
              Party & Client Details
            </h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Party Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Harish Glass Traders, Amit Patel"
                  className="form-input"
                  value={draft.customerName}
                  onChange={(e) => updateDraftInfo({ customerName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 9876543210"
                  className="form-input"
                  value={draft.customerPhone}
                  onChange={(e) => updateDraftInfo({ customerPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Quotation Notes</label>
              <textarea
                placeholder="Include delivery instructions, fitting details, or custom hardware additions..."
                className="form-input"
                style={{ resize: 'vertical', minHeight: '60px', fontFamily: 'var(--font-sans)' }}
                value={draft.notes}
                onChange={(e) => updateDraftInfo({ notes: e.target.value })}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Column Labels</h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Size/Sq.Ft. Label</label>
                  <input
                    type="text"
                    placeholder="e.g., Size (Sq.Ft.) or Rft"
                    className="form-input"
                    value={draft.sizeHeading || ''}
                    onChange={(e) => updateDraftInfo({ sizeHeading: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Qty/Unit Label</label>
                  <input
                    type="text"
                    placeholder="e.g., Qty (Units) or Nos"
                    className="form-input"
                    value={draft.unitHeading || ''}
                    onChange={(e) => updateDraftInfo({ unitHeading: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Draft Itemized List Table */}
          <div className="glass-panel">
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '20px' }}>
              Itemized Quotation Panes
            </h3>

            {draft.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p style={{ fontSize: '0.85rem' }}>No glass items added yet. Configure inputs on the left to add items.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px' }}>Details</th>
                        <th style={{ padding: '8px' }}>Billing Size</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.items.map((itemObj) => {
                        const { item, result } = itemObj;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                              <textarea
                                className="table-inline-input"
                                style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', width: '100%', marginBottom: '4px', resize: 'vertical', minHeight: '36px', height: 'auto', display: 'block', fontFamily: 'var(--font-sans)', borderBottom: '1px dashed var(--glass-border)' }}
                                value={item.name}
                                onChange={(e) => updateDraftItem(item.id!, { name: e.target.value })}
                                placeholder="Item Name"
                              />
                              <input
                                type="text"
                                className="table-inline-input"
                                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                                value={item.description || ''}
                                onChange={(e) => updateDraftItem(item.id!, { description: e.target.value })}
                                placeholder="Specifications (optional)"
                              />
                            </td>
                            <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                {!item.hideQty && (
                                  <>
                                    <input
                                      type="number"
                                      min="1"
                                      className="table-inline-input font-mono"
                                      style={{ width: '38px', padding: '2px', textAlign: 'center', borderBottom: '1px dashed var(--glass-border)' }}
                                      value={item.quantity}
                                      onChange={(e) => updateDraftItem(item.id!, { quantity: Math.max(1, Math.floor(safeNumber(e.target.value, 1))) })}
                                    />
                                    <input
                                      type="text"
                                      className="table-inline-input"
                                      style={{ width: '32px', padding: '2px', textAlign: 'center', fontSize: '0.8rem', borderBottom: '1px dashed var(--glass-border)' }}
                                      value={item.qtyUnit || 'pcs'}
                                      onChange={(e) => updateDraftItem(item.id!, { qtyUnit: e.target.value })}
                                    />
                                  </>
                                )}
                                {!item.hideQty && !item.hideSize && <span>×</span>}
                                {!item.hideSize && (
                                  <>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      className="table-inline-input font-mono"
                                      style={{ width: '50px', padding: '2px', textAlign: 'center', borderBottom: '1px dashed var(--glass-border)' }}
                                      value={item.sizeSqFt}
                                      onChange={(e) => updateDraftItem(item.id!, { sizeSqFt: Math.max(0.01, safeNumber(e.target.value, 0.01)) })}
                                    />
                                    <input
                                      type="text"
                                      className="table-inline-input"
                                      style={{ width: '42px', padding: '2px', textAlign: 'center', fontSize: '0.8rem', borderBottom: '1px dashed var(--glass-border)' }}
                                      value={item.sizeUnit || 'sq.ft'}
                                      onChange={(e) => updateDraftItem(item.id!, { sizeUnit: e.target.value })}
                                    />
                                  </>
                                )}
                                {(item.hideSize && item.hideQty) && (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Flat Item</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem', marginTop: '6px', color: 'var(--primary)', flexWrap: 'wrap' }}>
                                <span>Rate:</span>
                                <input
                                  type="text"
                                  className="table-inline-input font-sans"
                                  style={{ width: '18px', padding: '2px', color: 'var(--primary)', fontWeight: 600, borderBottom: '1px dashed var(--glass-border)', textAlign: 'center' }}
                                  value={item.currencySymbol || '₹'}
                                  onChange={(e) => updateDraftItem(item.id!, { currencySymbol: e.target.value })}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  className="table-inline-input font-mono"
                                  style={{ width: '50px', padding: '2px', color: 'var(--primary)', fontWeight: 600, borderBottom: '1px dashed var(--glass-border)' }}
                                  value={item.rate}
                                  onChange={(e) => updateDraftItem(item.id!, { rate: Math.max(0, safeNumber(e.target.value, 0)) })}
                                />
                                <span>/</span>
                                <input
                                  type="text"
                                  className="table-inline-input"
                                  style={{ width: '42px', padding: '2px', color: 'var(--primary)', fontSize: '0.75rem', borderBottom: '1px dashed var(--glass-border)' }}
                                  value={item.hideSize ? (item.qtyUnit || 'pcs') : (item.sizeUnit || 'sq.ft')}
                                  onChange={(e) => updateDraftItem(item.id!, item.hideSize ? { qtyUnit: e.target.value } : { sizeUnit: e.target.value })}
                                />
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'middle' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', borderBottom: '1px dashed var(--glass-border)' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>{item.currencySymbol || '₹'}</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="table-inline-input font-mono"
                                  style={{ width: '70px', padding: '2px', color: 'var(--primary)', fontWeight: 700, textAlign: 'right', fontSize: '0.9rem' }}
                                  value={item.customTotal !== undefined ? item.customTotal : (result.itemTotal || '')}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : safeNumber(e.target.value, 0);
                                    updateDraftItem(item.id!, { customTotal: val });
                                  }}
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <button
                                type="button"
                                onClick={() => removeDraftItem(item.id!)}
                                className="btn btn-danger"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Additional Pricing Controls: Discount, Transport & Labour */}
                <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Apply Custom Discount</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      placeholder="Value"
                      value={draft.discount || ''}
                      onChange={(e) => updateDraftInfo({ discount: safeNumber(e.target.value, 0) })}
                    />
                    <select
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      value={draft.isDiscountFlat ? 'flat' : 'percent'}
                      onChange={(e) => updateDraftInfo({ isDiscountFlat: e.target.value === 'flat' })}
                    >
                      <option value="percent" style={{ background: '#0e1420' }}>% Percentage</option>
                      <option value="flat" style={{ background: '#0e1420' }}>₹ Flat Rupee</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Transport Charges</span>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1' }}>₹</span>
                      <input
                        type="number"
                        min="0"
                        className="form-input font-mono"
                        style={{ padding: '8px 12px 8px 24px', fontSize: '0.85rem', width: '100%' }}
                        placeholder="Transport Amount"
                        value={draft.transportCharges || ''}
                        onChange={(e) => updateDraftInfo({ transportCharges: safeNumber(e.target.value, 0) })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Labour Charges</span>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1' }}>₹</span>
                      <input
                        type="number"
                        min="0"
                        className="form-input font-mono"
                        style={{ padding: '8px 12px 8px 24px', fontSize: '0.85rem', width: '100%' }}
                        placeholder="Labour/Installation Amount"
                        value={draft.labourCharges || ''}
                        onChange={(e) => updateDraftInfo({ labourCharges: safeNumber(e.target.value, 0) })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                    <input
                      type="checkbox"
                      id="enable-tax-checkbox"
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        cursor: 'pointer',
                        accentColor: 'var(--primary)'
                      }}
                      checked={draft.isTaxEnabled !== false}
                      onChange={(e) => updateDraftInfo({ isTaxEnabled: e.target.checked })}
                    />
                    <label 
                      htmlFor="enable-tax-checkbox" 
                      style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none', color: 'var(--text-primary)' }}
                    >
                      Include GST / VAT ({companyProfile.taxRate}%)
                    </label>
                  </div>

                </div>

                {/* Final Quote Breakdown Invoice */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                    <span>{formatCustomCurrency(summary.subtotal, quoteCurrency)}</span>
                  </div>
                  {summary.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                      <span>Discount:</span>
                      <span>-{formatCustomCurrency(summary.discountAmount, quoteCurrency)}</span>
                    </div>
                  )}
                  {summary.transportCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Transport Charges:</span>
                      <span>{formatCustomCurrency(summary.transportCharges, quoteCurrency)}</span>
                    </div>
                  )}
                  {summary.labourCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Labour Charges:</span>
                      <span>{formatCustomCurrency(summary.labourCharges, quoteCurrency)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>GST / VAT ({summary.taxRate}%):</span>
                    <span>{formatCustomCurrency(summary.taxAmount, quoteCurrency)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: '4px', fontSize: '1.25rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Grand Total:</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{formatCustomCurrency(summary.grandTotal, quoteCurrency)}</span>
                  </div>
                </div>

                {/* Save Quote Button */}
                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px 0', fontSize: '1rem' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#030712" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Generate & Save Quotation
                </button>

              </div>
            )}

          </div>

        </div>

      </div>

      {isEditingCategories && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <h3 style={{ color: 'var(--primary)', margin: 0 }}>Manage Item Categories</h3>
              <button 
                type="button" 
                onClick={() => setIsEditingCategories(false)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px' }}
              >
                Close
              </button>
            </div>

            {/* List of current categories */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', paddingRight: '4px' }}>
              {categories.map((cat, idx) => (
                <div key={cat} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ textTransform: 'capitalize', flex: 1, padding: '6px 12px', fontSize: '0.9rem' }}
                    value={cat}
                    onChange={(e) => updateCategory(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '4px' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* Add Category Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategoryName.trim()) {
                  addCategory(newCategoryName.trim());
                  setNewCategoryName('');
                }
              }}
              style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}
            >
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, fontSize: '0.9rem', padding: '8px 12px' }}
                placeholder="New Category Name (e.g. Shower Glass)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 16px', borderRadius: '4px', whiteSpace: 'nowrap' }}
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
