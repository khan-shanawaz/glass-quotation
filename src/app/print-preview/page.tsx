'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuotation, SavedQuotation } from '@/context/QuotationContext';
import { formatRupee, formatCustomCurrency, calculateQuoteSummary, safeNumber, GlassItemInput, GlassCategory } from '@/utils/calculator';

function PrintPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { savedQuotations, updateQuotation, companyProfile, categories } = useQuotation();

  // Selected Quotation state
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [localQuote, setLocalQuote] = useState<SavedQuotation | null>(null);

  // Printing Layout Configurations
  const [fontSize, setFontSize] = useState<string>('0.85rem');
  const [paddingSize, setPaddingSize] = useState<string>('8px');
  const [marginSize, setMarginSize] = useState<string>('15mm');
  const [forceSinglePage, setForceSinglePage] = useState<boolean>(false);

  // Local Company Overrides (specifically for this printout)
  const [localCompanyName, setLocalCompanyName] = useState<string>('');
  const [localCompanyAddress, setLocalCompanyAddress] = useState<string>('');
  const [localCompanyPhone, setLocalCompanyPhone] = useState<string>('');
  const [localCompanyEmail, setLocalCompanyEmail] = useState<string>('');
  const [localTerms, setLocalTerms] = useState<string>('');
  const [localBankDetails, setLocalBankDetails] = useState<string>('');

  // Synchronize local states when the selected quotation or company profile changes
  useEffect(() => {
    const id = searchParams.get('id') || selectedQuoteId;
    let found: SavedQuotation | undefined;
    
    if (id) {
      found = savedQuotations.find((q) => q.id === id);
    }
    
    if (!found && savedQuotations.length > 0) {
      found = savedQuotations[0];
    }
 
    if (found) {
      // Deep copy to allow offline edit sessions without corrupting original state until saved
      setLocalQuote(JSON.parse(JSON.stringify(found)));
      setSelectedQuoteId(found.id);
    }
  }, [searchParams, savedQuotations]);
 
  useEffect(() => {
    if (companyProfile) {
      setLocalCompanyName(companyProfile.companyName);
      setLocalCompanyAddress(companyProfile.companyAddress);
      setLocalCompanyPhone(companyProfile.companyPhone);
      setLocalCompanyEmail(companyProfile.companyEmail);
      setLocalTerms(companyProfile.termsAndConditions);
      setLocalBankDetails(companyProfile.bankDetails || '');
    }
  }, [companyProfile]);

  // Dropdown quote switcher handler
  const handleSelectQuote = (id: string) => {
    setSelectedQuoteId(id);
    router.push(`/print-preview?id=${id}`);
  };

  // Helper to trigger context recalculations when local quote fields change
  const triggerRecalculation = (updatedFields: Partial<SavedQuotation>) => {
    if (!localQuote) return;
    const merged = { ...localQuote, ...updatedFields };
    
    const summary = calculateQuoteSummary(
      merged.items,
      merged.isTaxEnabled !== false ? companyProfile.taxRate : 0,
      merged.discount,
      merged.isDiscountFlat,
      merged.transportCharges,
      merged.labourCharges
    );

    setLocalQuote({
      ...merged,
      summary
    });
  };

  // In-place item update handler
  const handleUpdateItem = (itemId: string, updatedFields: Partial<GlassItemInput>) => {
    if (!localQuote) return;
    const updatedItems = localQuote.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updatedFields };
      }
      return item;
    });
    triggerRecalculation({ items: updatedItems });
  };

  // In-place item deletion handler
  const handleRemoveItem = (itemId: string) => {
    if (!localQuote) return;
    if (localQuote.items.length <= 1) {
      alert('A quotation must contain at least one item.');
      return;
    }
    const updatedItems = localQuote.items.filter((item) => item.id !== itemId);
    triggerRecalculation({ items: updatedItems });
  };

  // In-place item row addition handler
  const handleAddRow = () => {
    if (!localQuote) return;
    const newItem: GlassItemInput = {
      id: Math.random().toString(36).substring(7),
      name: 'New Glass Item',
      description: '',
      category: 'custom',
      sizeSqFt: 0,
      quantity: 1,
      rate: 0,
      qtyUnit: 'pcs',
      sizeUnit: 'sq.ft',
      currencySymbol: localQuote.items[0]?.currencySymbol || '₹',
    };
    triggerRecalculation({ items: [...localQuote.items, newItem] });
  };

  // Persists edited details back to localstorage logs permanently
  const handleSaveChanges = () => {
    if (!localQuote) return;
    updateQuotation(localQuote.id, localQuote);
    alert('Changes saved successfully to quotation logs history!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!localQuote) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p style={{ marginTop: '16px' }}>No saved quotations found to preview. Please create a quotation first.</p>
      </div>
    );
  }

  const quoteCurrency = localQuote.items[0]?.currencySymbol || '₹';

  return (
    <div>
      {/* Page Header (Hidden on Print) */}
      <div className="header-container no-print" style={{ marginBottom: '24px' }}>
        <div>
          <h1>Interactive Print Workbench</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Fine-tune fonts, margins, and spacing to scale your quotation perfectly. Edit all details live before exporting to PDF.
          </p>
        </div>
      </div>

      {/* Main Grid: Control Panel (left) & Live Sheet (right) */}
      <div className="print-preview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Adjuster Toolbar (Hidden on Print) */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Print Configurations</h3>
            
            {/* Quote Selector dropdown */}
            <div className="form-group">
              <label className="form-label">Select Quotation</label>
              <select
                className="form-input form-select"
                value={selectedQuoteId}
                onChange={(e) => handleSelectQuote(e.target.value)}
              >
                {savedQuotations.map((q) => (
                  <option key={q.id} value={q.id} style={{ background: '#0e1420' }}>
                    {q.quoteNumber} - {q.customerName}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size Adjuster */}
            <div className="form-group">
              <label className="form-label">Font Scale: {fontSize}</label>
              <select
                className="form-input form-select"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              >
                <option value="0.75rem" style={{ background: '#0e1420' }}>Very Compact (12px)</option>
                <option value="0.85rem" style={{ background: '#0e1420' }}>Compact (14px) - Recommended</option>
                <option value="0.95rem" style={{ background: '#0e1420' }}>Normal (15px)</option>
                <option value="1.05rem" style={{ background: '#0e1420' }}>Large (17px)</option>
                <option value="1.15rem" style={{ background: '#0e1420' }}>Extra Large (19px)</option>
              </select>
            </div>

            {/* Row Padding Adjuster */}
            <div className="form-group">
              <label className="form-label">Row Spacing</label>
              <select
                className="form-input form-select"
                value={paddingSize}
                onChange={(e) => setPaddingSize(e.target.value)}
              >
                <option value="4px" style={{ background: '#0e1420' }}>Very Compact (4px)</option>
                <option value="8px" style={{ background: '#0e1420' }}>Compact (8px)</option>
                <option value="12px" style={{ background: '#0e1420' }}>Normal (12px)</option>
                <option value="16px" style={{ background: '#0e1420' }}>Spacious (16px)</option>
              </select>
            </div>

            {/* Page Margins Adjuster */}
            <div className="form-group">
              <label className="form-label">Page Margins</label>
              <select
                className="form-input form-select"
                value={marginSize}
                onChange={(e) => setMarginSize(e.target.value)}
              >
                <option value="6mm" style={{ background: '#0e1420' }}>Narrow (6mm)</option>
                <option value="12mm" style={{ background: '#0e1420' }}>Normal (12mm)</option>
                <option value="18mm" style={{ background: '#0e1420' }}>Wide (18mm)</option>
                <option value="24mm" style={{ background: '#0e1420' }}>Extra Wide (24mm)</option>
              </select>
            </div>

            {/* Force Single Page Scaling Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <input
                type="checkbox"
                id="force-page-checkbox"
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                checked={forceSinglePage}
                onChange={(e) => setForceSinglePage(e.target.checked)}
              />
              <label htmlFor="force-page-checkbox" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                Force Single Page Layout
              </label>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 0', fontSize: '0.95rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#030712" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save PDF
            </button>
            
            <button
              type="button"
              onClick={handleSaveChanges}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px 0', fontSize: '0.95rem' }}
            >
              Save Edits to History
            </button>
          </div>
        </div>

        {/* Right Column: Live WYSIWYG Print Sheet Preview */}
        <div className="print-sheet-wrapper" style={{ overflowX: 'auto' }}>
          
          {/* Print Sheet container: WYSIWYG styles applied via inline states */}
          <div 
            className="glass-panel print-sheet"
            style={{ 
              fontSize: fontSize, 
              padding: forceSinglePage ? '16px' : '32px',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {/* Branding Header Area */}
            <div className="invoice-brand-bar" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: forceSinglePage ? '12px' : '24px', marginBottom: forceSinglePage ? '12px' : '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {companyProfile.logoBase64 ? (
                  <img 
                    src={companyProfile.logoBase64} 
                    alt="Logo" 
                    style={{ maxHeight: forceSinglePage ? '40px' : '56px', maxWidth: '160px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }} 
                  />
                ) : (
                  <div style={{ width: forceSinglePage ? '36px' : '48px', height: forceSinglePage ? '36px' : '48px', borderRadius: '4px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#030712" strokeWidth="2.5">
                      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                    </svg>
                  </div>
                )}
                <div>
                  <div className="no-print">
                    <input
                      type="text"
                      className="table-inline-input"
                      style={{ fontSize: '1.4rem', fontWeight: 800, padding: '2px 4px', width: '280px', borderBottom: '1px dashed var(--glass-border)' }}
                      value={localCompanyName}
                      onChange={(e) => setLocalCompanyName(e.target.value)}
                      placeholder="Company Name"
                    />
                    <input
                      type="text"
                      className="table-inline-input"
                      style={{ fontSize: '0.75rem', display: 'block', width: '380px', marginTop: '2px', borderBottom: '1px dashed var(--glass-border)' }}
                      value={localCompanyAddress}
                      onChange={(e) => setLocalCompanyAddress(e.target.value)}
                      placeholder="Company Address"
                    />
                    <input
                      type="text"
                      className="table-inline-input"
                      style={{ fontSize: '0.75rem', display: 'block', width: '380px', marginTop: '2px', borderBottom: '1px dashed var(--glass-border)' }}
                      value={localCompanyPhone}
                      onChange={(e) => setLocalCompanyPhone(e.target.value)}
                      placeholder="Contact Details"
                    />
                  </div>
                  <div className="print-only">
                    <h2 className="invoice-company-name" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{localCompanyName.toUpperCase()}</h2>
                    <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>{localCompanyAddress}</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>Contact: {localCompanyPhone} • Email: {localCompanyEmail}</p>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {/* Document Title */}
                <div className="no-print" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="table-inline-input"
                    style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 800, 
                      color: 'var(--primary)', 
                      textAlign: 'right', 
                      width: '100%', 
                      textTransform: 'uppercase',
                      borderBottom: '1px dashed var(--glass-border)',
                      background: 'transparent'
                    }}
                    value={localQuote.documentTitle || 'QUOTATION'}
                    onChange={(e) => triggerRecalculation({ documentTitle: e.target.value })}
                    placeholder="QUOTATION"
                  />
                </div>
                <h2 className="invoice-title-color print-only" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  {(localQuote.documentTitle || 'QUOTATION').toUpperCase()}
                </h2>

                {/* Serial/Quotation Code */}
                <div className="no-print" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="table-inline-input"
                    style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 700, 
                      textAlign: 'right', 
                      width: '100%',
                      borderBottom: '1px dashed var(--glass-border)',
                      background: 'transparent'
                    }}
                    value={localQuote.quoteNumber}
                    onChange={(e) => triggerRecalculation({ quoteNumber: e.target.value })}
                    placeholder="Quotation Number"
                  />
                </div>
                <p className="print-only" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>
                  {localQuote.quoteNumber}
                </p>

                {/* Date */}
                <div className="no-print" style={{ width: '100%' }}>
                  <input
                    type="text"
                    className="table-inline-input"
                    style={{ 
                      fontSize: '0.75rem', 
                      textAlign: 'right', 
                      width: '100%',
                      borderBottom: '1px dashed var(--glass-border)',
                      background: 'transparent'
                    }}
                    value={localQuote.date}
                    onChange={(e) => triggerRecalculation({ date: e.target.value })}
                    placeholder="Date"
                  />
                </div>
                <p className="print-only" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  Date: {localQuote.date}
                </p>
              </div>
            </div>

            {/* Client / Business Details (Prepared For) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: forceSinglePage ? '16px' : '32px', fontSize: '0.9rem' }}>
              <div className="invoice-blue-accent" style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                  Prepared For (Party):
                </span>
                <div className="no-print">
                  <input
                    type="text"
                    className="table-inline-input"
                    style={{ fontWeight: 700, fontSize: '1.05rem', padding: '2px 4px', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                    value={localQuote.customerName}
                    onChange={(e) => triggerRecalculation({ customerName: e.target.value })}
                    placeholder="Customer Name"
                  />
                </div>
                <strong className="print-only" style={{ fontSize: '1.05rem' }}>{localQuote.customerName}</strong>
                
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Mobile No:</span>
                    <div className="no-print" style={{ width: '100%' }}>
                      <input
                        type="text"
                        className="table-inline-input"
                        style={{ padding: '2px 4px', fontSize: '0.9rem', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                        value={localQuote.customerPhone}
                        onChange={(e) => triggerRecalculation({ customerPhone: e.target.value })}
                        placeholder="Phone Number"
                      />
                    </div>
                    <span className="print-only">{localQuote.customerPhone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Email Id:</span>
                    <div className="no-print" style={{ width: '100%' }}>
                      <input
                        type="text"
                        className="table-inline-input"
                        style={{ padding: '2px 4px', fontSize: '0.9rem', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                        value={localQuote.customerEmail}
                        onChange={(e) => triggerRecalculation({ customerEmail: e.target.value })}
                        placeholder="Email"
                      />
                    </div>
                    <span className="print-only">{localQuote.customerEmail}</span>
                  </div>
                </div>
              </div>
              <div className="invoice-muted-border" style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                  Bank Details:
                </span>
                <div className="no-print">
                  <textarea
                    className="table-inline-input"
                    style={{ 
                      fontSize: '0.85rem', 
                      lineHeight: '1.4', 
                      padding: '4px', 
                      width: '100%', 
                      minHeight: '50px', 
                      resize: 'vertical',
                      borderBottom: '1px dashed var(--glass-border)',
                      background: 'transparent'
                    }}
                    value={localBankDetails}
                    onChange={(e) => setLocalBankDetails(e.target.value)}
                    placeholder="Bank details..."
                  />
                </div>
                <p className="print-only" style={{ fontSize: '0.85rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {localBankDetails || 'Bank details not configured.'}
                </p>
              </div>
            </div>

            {/* Itemized Table of Glass Specifications */}
            <div style={{ marginBottom: forceSinglePage ? '16px' : '32px' }}>
              <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr className="invoice-table-header">
                    <th style={{ padding: paddingSize, fontWeight: 600 }}>Description</th>
                    <th style={{ padding: paddingSize, fontWeight: 600 }}>Category</th>
                    <th style={{ padding: paddingSize, fontWeight: 600, textAlign: 'right' }}>{localQuote.sizeHeading || 'Size (Sq.Ft.)'}</th>
                    <th style={{ padding: paddingSize, fontWeight: 600, textAlign: 'right' }}>{localQuote.unitHeading || 'Qty'}</th>
                    <th style={{ padding: paddingSize, fontWeight: 600, textAlign: 'right' }}>Rate / {localQuote.sizeHeading || 'Sq.Ft.'}</th>
                    <th style={{ padding: paddingSize, fontWeight: 600, textAlign: 'right' }}>Final Amount</th>
                    <th className="no-print" style={{ padding: paddingSize, fontWeight: 600, textAlign: 'center', width: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {localQuote.summary.items.map((itemObj) => {
                    const { item, result } = itemObj;
                    return (
                      <tr key={item.id} className="invoice-table-row">
                        <td style={{ padding: paddingSize, verticalAlign: 'middle' }}>
                          <div className="no-print">
                            <input
                              type="text"
                              className="table-inline-input"
                              style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', width: '100%', marginBottom: '4px', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.name}
                              onChange={(e) => handleUpdateItem(item.id!, { name: e.target.value })}
                              placeholder="Item Name"
                            />
                            <input
                              type="text"
                              className="table-inline-input"
                              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.description || ''}
                              onChange={(e) => handleUpdateItem(item.id!, { description: e.target.value })}
                              placeholder="Specifications (optional)"
                            />
                          </div>
                          <div className="print-only">
                            <strong className="table-item-title">{item.name}</strong>
                            <div style={{ fontSize: '0.75rem', marginTop: '2px', color: '#475569' }}>
                              {item.description || 'No custom specs'}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: paddingSize, verticalAlign: 'middle' }}>
                          <div className="no-print">
                            <select
                              className="table-inline-input"
                              style={{ textTransform: 'capitalize', width: '100%', padding: '2px', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.category}
                              onChange={(e) => handleUpdateItem(item.id!, { category: e.target.value })}
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat} style={{ background: '#0e1420', textTransform: 'capitalize' }}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="print-only" style={{ textTransform: 'capitalize' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: paddingSize, textAlign: 'right', verticalAlign: 'middle' }}>
                          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="table-inline-input font-mono"
                              style={{ width: '55px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.sizeSqFt || ''}
                              onChange={(e) => handleUpdateItem(item.id!, { sizeSqFt: safeNumber(e.target.value, 0) })}
                              placeholder="0.00"
                            />
                            <input
                              type="text"
                              className="table-inline-input"
                              style={{ width: '40px', padding: '2px', fontSize: '0.8rem', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.sizeUnit || 'sq.ft'}
                              onChange={(e) => handleUpdateItem(item.id!, { sizeUnit: e.target.value })}
                            />
                          </div>
                          <span className="print-only" style={{ fontFamily: 'monospace' }}>
                            {item.sizeSqFt.toFixed(2)} {item.sizeUnit || 'sq.ft'}
                          </span>
                        </td>
                        <td style={{ padding: paddingSize, textAlign: 'right', verticalAlign: 'middle' }}>
                          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                            <input
                              type="number"
                              min="1"
                              className="table-inline-input font-mono"
                              style={{ width: '40px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.quantity || ''}
                              onChange={(e) => handleUpdateItem(item.id!, { quantity: Math.max(0, Math.floor(safeNumber(e.target.value, 1))) })}
                              placeholder="1"
                            />
                            <input
                              type="text"
                              className="table-inline-input"
                              style={{ width: '30px', padding: '2px', fontSize: '0.8rem', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.qtyUnit || 'pcs'}
                              onChange={(e) => handleUpdateItem(item.id!, { qtyUnit: e.target.value })}
                            />
                          </div>
                          <span className="print-only" style={{ fontWeight: 600 }}>
                            {item.quantity} {item.qtyUnit || 'pcs'}
                          </span>
                        </td>
                        <td style={{ padding: paddingSize, textAlign: 'right', verticalAlign: 'middle' }}>
                          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                            <input
                              type="text"
                              className="table-inline-input"
                              style={{ width: '18px', padding: '2px', textAlign: 'center', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.currencySymbol || '₹'}
                              onChange={(e) => handleUpdateItem(item.id!, { currencySymbol: e.target.value })}
                            />
                            <input
                              type="number"
                              min="0"
                              className="table-inline-input font-mono"
                              style={{ width: '55px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.rate || ''}
                              onChange={(e) => handleUpdateItem(item.id!, { rate: safeNumber(e.target.value, 0) })}
                              placeholder="0"
                            />
                          </div>
                          <span className="print-only" style={{ fontFamily: 'monospace' }}>
                            {formatCustomCurrency(item.rate, item.currencySymbol || '₹')}
                          </span>
                        </td>
                        <td style={{ padding: paddingSize, textAlign: 'right', verticalAlign: 'middle' }}>
                          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                            <span style={{ fontSize: '0.85rem' }}>{item.currencySymbol || '₹'}</span>
                            <input
                              type="number"
                              min="0"
                              className="table-inline-input font-mono"
                              style={{ width: '75px', padding: '2px', textAlign: 'right', fontWeight: 700, borderBottom: '1px dashed var(--glass-border)' }}
                              value={item.customTotal !== undefined ? item.customTotal : (result.itemTotal || '')}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : safeNumber(e.target.value, 0);
                                handleUpdateItem(item.id!, { customTotal: val });
                              }}
                              placeholder="0.00"
                            />
                          </div>
                          <span className="print-only" style={{ fontWeight: 700 }}>
                            {formatCustomCurrency(result.itemTotal, item.currencySymbol || '₹')}
                          </span>
                        </td>
                        <td className="no-print" style={{ padding: paddingSize, textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id!)}
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
              <button
                type="button"
                onClick={handleAddRow}
                className="btn btn-secondary no-print"
                style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 16px' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Item Row
              </button>
            </div>

            {/* Side-by-Side: Terms & Conditions and Totals */}
            <div 
              className="invoice-footer-grid" 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1.2fr 1fr', 
                gap: forceSinglePage ? '16px' : '24px', 
                marginTop: '16px', 
                alignItems: 'start' 
              }}
            >
              {/* Terms and Conditions (Editable WYSIWYG) */}
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }} className="invoice-terms-section">
                <h4 className="invoice-title-color" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Terms & Conditions:</h4>
                <div className="no-print">
                  <textarea
                    className="table-inline-input"
                    style={{ 
                      fontSize: '0.7rem', 
                      lineHeight: '1.4', 
                      width: '100%', 
                      minHeight: '80px', 
                      resize: 'vertical',
                      borderBottom: '1px dashed var(--glass-border)',
                      background: 'transparent',
                      whiteSpace: 'pre-line'
                    }}
                    value={localTerms}
                    onChange={(e) => setLocalTerms(e.target.value)}
                    placeholder="Terms and Conditions..."
                  />
                </div>
                <div className="invoice-terms-text" style={{ fontSize: '0.7rem', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                  <div className="print-only">{localTerms}</div>
                </div>
              </div>

              {/* Totals cards box */}
              <div className="invoice-totals-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', padding: '12px', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Items Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{formatCustomCurrency(localQuote.summary.subtotal, quoteCurrency)}</span>
                </div>
                
                {/* Discount */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className={localQuote.summary.discountAmount > 0 ? "" : "no-print"}
                >
                  <span style={{ color: localQuote.summary.discountAmount > 0 ? '#e11d48' : 'inherit' }}>Discount:</span>
                  <div className="no-print" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="table-inline-input font-mono"
                      style={{ width: '45px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)', fontSize: '0.75rem' }}
                      value={localQuote.discount || ''}
                      onChange={(e) => triggerRecalculation({ discount: safeNumber(e.target.value, 0) })}
                      placeholder="0"
                    />
                    <select
                      className="table-inline-input"
                      style={{ padding: '2px', fontSize: '0.75rem', borderBottom: '1px dashed var(--glass-border)', cursor: 'pointer' }}
                      value={localQuote.isDiscountFlat ? 'flat' : 'percent'}
                      onChange={(e) => triggerRecalculation({ isDiscountFlat: e.target.value === 'flat' })}
                    >
                      <option value="percent" style={{ background: '#0e1420' }}>%</option>
                      <option value="flat" style={{ background: '#0e1420' }}>{quoteCurrency}</option>
                    </select>
                  </div>
                  <span className="print-only" style={{ fontWeight: 600, color: '#e11d48' }}>
                    -{formatCustomCurrency(localQuote.summary.discountAmount, quoteCurrency)}
                  </span>
                </div>

                {/* Transport */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className={localQuote.summary.transportCharges > 0 ? "" : "no-print"}
                >
                  <span>Transport:</span>
                  <div className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem' }}>{quoteCurrency}</span>
                    <input
                      type="number"
                      className="table-inline-input font-mono"
                      style={{ width: '60px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)', fontSize: '0.75rem' }}
                      value={localQuote.transportCharges || ''}
                      onChange={(e) => triggerRecalculation({ transportCharges: safeNumber(e.target.value, 0) })}
                      placeholder="0"
                    />
                  </div>
                  <span className="print-only" style={{ fontWeight: 600 }}>
                    {formatCustomCurrency(localQuote.summary.transportCharges, quoteCurrency)}
                  </span>
                </div>

                {/* Labour */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className={localQuote.summary.labourCharges > 0 ? "" : "no-print"}
                >
                  <span>Labour/Fitting:</span>
                  <div className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '0.75rem' }}>{quoteCurrency}</span>
                    <input
                      type="number"
                      className="table-inline-input font-mono"
                      style={{ width: '60px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)', fontSize: '0.75rem' }}
                      value={localQuote.labourCharges || ''}
                      onChange={(e) => triggerRecalculation({ labourCharges: safeNumber(e.target.value, 0) })}
                      placeholder="0"
                    />
                  </div>
                  <span className="print-only" style={{ fontWeight: 600 }}>
                    {formatCustomCurrency(localQuote.summary.labourCharges, quoteCurrency)}
                  </span>
                </div>

                {/* GST */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
                  className="invoice-totals-divider"
                >
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      id="list-tax-checkbox"
                      style={{ width: '12px', height: '12px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      checked={localQuote.isTaxEnabled !== false}
                      onChange={(e) => triggerRecalculation({ isTaxEnabled: e.target.checked })}
                    />
                    <label htmlFor="list-tax-checkbox" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '0.8rem' }}>
                      GST ({localQuote.summary.taxRate}%):
                    </label>
                  </div>
                  <span className="print-only">
                    GST ({localQuote.summary.taxRate}%):
                  </span>
                  <span style={{ fontWeight: 600 }}>{formatCustomCurrency(localQuote.summary.taxAmount, quoteCurrency)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontSize: '1.05rem' }}>
                  <span style={{ fontWeight: 700 }}>Total:</span>
                  <span className="invoice-grand-total" style={{ fontWeight: 800 }}>{formatCustomCurrency(localQuote.summary.grandTotal, quoteCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Signature Lines */}
            <div style={{ marginTop: forceSinglePage ? '24px' : '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', fontSize: '0.85rem' }}>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '8px', textAlign: 'center' }} className="invoice-signature-line">
                Customer Acceptance Signature
              </div>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '8px', textAlign: 'center' }} className="invoice-signature-line">
                Authorized Sales Officer
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Styled JSX to apply live scaling overrides globally for printing and screen preview */}
      <style jsx global>{`
        /* Normal screen styles for invoice preview */
        .print-sheet {
          background: #0b111e !important;
          border: 1px solid var(--glass-border) !important;
          color: var(--text-primary) !important;
          border-radius: var(--radius-md);
        }
        .invoice-brand-bar {
          border-bottom: 2px solid var(--glass-border);
        }
        .invoice-title-color {
          color: var(--primary) !important;
        }
        .invoice-company-name {
          color: var(--text-primary) !important;
        }
        .invoice-table-header {
          border-bottom: 2px solid var(--glass-border);
          color: var(--text-secondary);
        }
        .invoice-table-row {
          border-bottom: 1px solid var(--glass-border);
        }
        .invoice-totals-box {
          background: rgba(6, 182, 212, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-sm);
        }
        .invoice-grand-total {
          color: #10b981 !important;
        }
        .invoice-blue-accent {
          border-left: 3px solid var(--primary);
        }
        .invoice-muted-border {
          border-left: 3px solid var(--glass-border);
        }
        .invoice-totals-divider {
          border-bottom: 1px solid var(--glass-border);
        }
        .invoice-terms-section {
          border-top: 1px dashed var(--glass-border);
        }
        .invoice-signature-line {
          border-top: 1px solid var(--glass-border);
          color: var(--text-secondary);
        }

        /* Live configuration overrides visible on screen */
        .print-sheet .invoice-table td {
          padding: ${paddingSize} !important;
        }
        .print-sheet .invoice-table th {
          padding: ${paddingSize} !important;
        }

        /* Print styles applying customized margin and font-size configurations */
        @media print {
          @page {
            size: A4 portrait;
            margin: ${marginSize} !important;
          }
          html, body, .layout-container, .main-content {
            height: auto !important;
            min-height: auto !important;
            max-height: initial !important;
            overflow: visible !important;
            overflow-y: visible !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .layout-container {
            display: block !important;
            width: 100% !important;
          }
          html, body, .main-content {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-preview-grid {
            display: block !important;
            width: 100% !important;
            gap: 0 !important;
          }
          .print-sheet-wrapper, .print-sheet {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
          }
          .print-sheet {
            background: #ffffff !important;
            border: none !important;
            color: #1e293b !important;
            box-shadow: none !important;
            font-size: ${fontSize} !important;
            padding: ${forceSinglePage ? '0px' : '12px'} !important;
          }
          .invoice-brand-bar {
            border-bottom: 3px solid #1e3a88 !important;
            padding-bottom: ${forceSinglePage ? '6px' : '16px'} !important;
            margin-bottom: ${forceSinglePage ? '10px' : '20px'} !important;
          }
          .invoice-title-color {
            color: #1e3a88 !important;
          }
          .invoice-company-name {
            color: #0f172a !important;
          }
          .invoice-table-header {
            background: #1e3a88 !important;
            color: #ffffff !important;
          }
          .invoice-table-header th {
            color: #ffffff !important;
            border: none !important;
            padding: ${paddingSize} !important;
          }
          .invoice-table-row {
            border-bottom: 1.5px solid #dbeafe !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .invoice-table-row td {
            color: #334155 !important;
            border: none !important;
            padding: ${paddingSize} !important;
          }
          .table-item-title {
            color: #1e293b !important;
          }
          .invoice-totals-box {
            background: #f0f9ff !important;
            border: 1.5px solid #bfdbfe !important;
            padding: ${forceSinglePage ? '8px' : '16px'} !important;
            border-radius: 8px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .invoice-totals-box * {
            color: #1e293b !important;
          }
          .invoice-totals-divider {
            border-bottom: 1.5px solid #bfdbfe !important;
          }
          .invoice-grand-total {
            color: #1e3a88 !important;
            font-weight: 800 !important;
          }
          .invoice-blue-accent {
            border-left: 3.5px solid #1d4ed8 !important;
          }
          .invoice-muted-border {
            border-left: 3.5px solid #64748b !important;
          }
          .invoice-terms-section {
            border-top: 1.5px solid #bfdbfe !important;
            margin-top: ${forceSinglePage ? '8px' : '16px'} !important;
            padding-top: ${forceSinglePage ? '4px' : '8px'} !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .invoice-footer-grid {
            display: grid !important;
            grid-template-columns: 1.2fr 1fr !important;
            gap: 16px !important;
            width: 100% !important;
            margin-top: 16px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .invoice-terms-text {
            color: #475569 !important;
          }
          .invoice-signature-line {
            border-top: 1.5px solid #94a3b8 !important;
            color: #475569 !important;
            margin-top: ${forceSinglePage ? '20px' : '36px'} !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintPreviewPage() {
  return (
    <Suspense fallback={
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-secondary)' }}>
        Loading print configuration preview...
      </div>
    }>
      <PrintPreviewContent />
    </Suspense>
  );
}
