'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuotation, SavedQuotation } from '@/context/QuotationContext';
import { formatRupee, formatCustomCurrency, calculateQuoteSummary, safeNumber, GlassItemInput, GlassCategory } from '@/utils/calculator';
import { exportToCSV, parseCSV } from '@/utils/csvHelper';

function QuotationListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { savedQuotations, deleteQuotation, convertQuoteToProject, companyProfile, importQuotations, updateQuotation, categories, updateCompanyProfile } = useQuotation();
  
  const [selectedQuote, setSelectedQuote] = useState<SavedQuotation | null>(null);

  // Sync selected quotation with URL query parameter ?id=...
  useEffect(() => {
    const quoteId = searchParams.get('id') || selectedQuote?.id;
    if (quoteId) {
      const found = savedQuotations.find((q) => q.id === quoteId);
      if (found) {
        if (JSON.stringify(found) !== JSON.stringify(selectedQuote)) {
          setSelectedQuote(found);
        }
      } else {
        setSelectedQuote(savedQuotations.length > 0 ? savedQuotations[0] : null);
      }
    } else if (savedQuotations.length > 0 && !selectedQuote) {
      // Default select the first item
      setSelectedQuote(savedQuotations[0]);
    }
  }, [searchParams, savedQuotations, selectedQuote]);

  const handleSelectQuote = (quote: SavedQuotation) => {
    setSelectedQuote(quote);
    router.push(`/quotation-list?id=${quote.id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this quotation record?')) {
      deleteQuotation(id);
      if (selectedQuote?.id === id) {
        setSelectedQuote(null);
        router.push('/quotation-list');
      }
    }
  };

  const handleConvertToProject = (quoteId: string) => {
    convertQuoteToProject(quoteId);
    alert('Quotation successfully converted to an active project! You can track its production workflow under "Projects Status".');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateItem = (itemId: string, updatedFields: Partial<GlassItemInput>) => {
    if (!selectedQuote) return;
    const updatedItems = selectedQuote.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updatedFields };
      }
      return item;
    });
    updateQuotation(selectedQuote.id, { items: updatedItems });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!selectedQuote) return;
    if (selectedQuote.items.length <= 1) {
      alert('A quotation must contain at least one item.');
      return;
    }
    const updatedItems = selectedQuote.items.filter((item) => item.id !== itemId);
    updateQuotation(selectedQuote.id, { items: updatedItems });
  };

  const handleAddRow = () => {
    if (!selectedQuote) return;
    const newItem = {
      id: Math.random().toString(36).substring(7),
      name: 'New Glass Item',
      description: '',
      category: 'custom' as GlassCategory,
      sizeSqFt: 0,
      quantity: 1,
      rate: 0,
      qtyUnit: 'pcs',
      sizeUnit: 'sq.ft',
      currencySymbol: selectedQuote.items[0]?.currencySymbol || '₹',
    };
    updateQuotation(selectedQuote.id, { items: [...selectedQuote.items, newItem] });
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Quote Number',
      'Date',
      'Customer Name',
      'Mobile',
      'Email',
      'Notes',
      'Discount',
      'Is Discount Flat',
      'Transport Charges',
      'Labour Charges',
      'Is Converted To Project',
      'Items'
    ];
    exportToCSV(
      savedQuotations,
      headers,
      (q) => [
        q.id,
        q.quoteNumber,
        q.date,
        q.customerName,
        q.customerPhone,
        q.customerEmail,
        q.notes,
        q.discount,
        q.isDiscountFlat ? 'TRUE' : 'FALSE',
        q.transportCharges || 0,
        q.labourCharges || 0,
        q.isConvertedToProject ? 'TRUE' : 'FALSE',
        JSON.stringify(q.items)
      ],
      'Quotations'
    );
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          alert('The CSV file is empty or invalid.');
          return;
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const idIdx = headers.indexOf('id');
        const quoteNumIdx = headers.indexOf('quote number');
        const dateIdx = headers.indexOf('date');
        const nameIdx = headers.indexOf('customer name');
        const phoneIdx = headers.indexOf('mobile');
        const emailIdx = headers.indexOf('email');
        const notesIdx = headers.indexOf('notes');
        const discountIdx = headers.indexOf('discount');
        const isFlatIdx = headers.indexOf('is discount flat');
        const transportIdx = headers.indexOf('transport charges');
        const labourIdx = headers.indexOf('labour charges');
        const isConvertedIdx = headers.indexOf('is converted to project');
        const itemsIdx = headers.indexOf('items');

        if (quoteNumIdx === -1 || nameIdx === -1 || phoneIdx === -1 || itemsIdx === -1) {
          alert('Invalid quotation CSV structure. Headers must include "Quote Number", "Customer Name", "Mobile", and "Items".');
          return;
        }

        const importedQuotes: SavedQuotation[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 4) continue;

          const id = idIdx !== -1 && row[idIdx] ? row[idIdx] : Math.random().toString(36).substring(7);
          const quoteNumber = row[quoteNumIdx];
          const date = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : new Date().toLocaleDateString('en-IN');
          const customerName = row[nameIdx];
          const customerPhone = phoneIdx !== -1 ? row[phoneIdx] : 'N/A';
          const customerEmail = emailIdx !== -1 ? row[emailIdx] : 'N/A';
          const notes = notesIdx !== -1 ? row[notesIdx] : '';
          const discount = discountIdx !== -1 ? parseFloat(row[discountIdx]) || 0 : 0;
          const isDiscountFlat = isFlatIdx !== -1 ? row[isFlatIdx].toUpperCase() === 'TRUE' : false;
          const transportCharges = transportIdx !== -1 ? parseFloat(row[transportIdx]) || 0 : 0;
          const labourCharges = labourIdx !== -1 ? parseFloat(row[labourIdx]) || 0 : 0;
          const isConvertedToProject = isConvertedIdx !== -1 ? row[isConvertedIdx].toUpperCase() === 'TRUE' : false;

          let items: any[] = [];
          try {
            items = JSON.parse(row[itemsIdx]);
          } catch (err) {
            console.error('Failed to parse items for row', i, err);
          }

          const summary = calculateQuoteSummary(items, companyProfile.taxRate, discount, isDiscountFlat, transportCharges, labourCharges);

          importedQuotes.push({
            id,
            quoteNumber,
            date,
            customerName,
            customerPhone,
            customerEmail,
            notes,
            items,
            discount,
            isDiscountFlat,
            transportCharges,
            labourCharges,
            summary,
            isConvertedToProject
          });
        }

        if (importedQuotes.length > 0) {
          importQuotations(importedQuotes);
          alert(`Successfully imported ${importedQuotes.length} quotations!`);
        } else {
          alert('No valid records found in the CSV file.');
        }
      } catch (err) {
        alert('Failed to parse the CSV file. Please make sure the format is valid.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      {/* Header (Hidden when printing) */}
      <div className="header-container no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Quotation Logs</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Review previous glass estimates, check contract conversions, and print customer copy sheets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <label
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="quotation-layout-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Quotation Logs List (Hidden when printing) */}
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '78vh', overflowY: 'auto' }}>
            <h3>Quotation Archive</h3>
            
            {savedQuotations.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No saved quotes found in history.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {savedQuotations.map((quote) => {
                  const isActive = selectedQuote?.id === quote.id;
                  const paneCount = quote.items.reduce((sum, item) => sum + item.quantity, 0);
                  
                  return (
                    <div
                      key={quote.id}
                      onClick={() => handleSelectQuote(quote)}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'var(--glass-bg-hover)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--primary)' : 'var(--glass-border)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {quote.quoteNumber}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{quote.date.split(',')[0]}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>{quote.customerName}</span>
                        <span>{paneCount} units</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>
                          {formatRupee(quote.summary.grandTotal)}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {quote.isConvertedToProject ? (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              Active Project
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                              Draft Quote
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(quote.id);
                            }}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Quotation Invoice Sheet */}
        <div className="print-sheet-wrapper">
          {selectedQuote ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Sheet Control Options Bar (Hidden when printing) */}
              <div className="glass-panel no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Viewing: <strong>{selectedQuote.quoteNumber}</strong>
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {!selectedQuote.isConvertedToProject && (
                    <button
                      type="button"
                      onClick={() => handleConvertToProject(selectedQuote.id)}
                      className="btn btn-secondary"
                      style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    >
                      Convert to Project
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push(`/print-preview?id=${selectedQuote.id}`)}
                    className="btn btn-secondary"
                    style={{ color: 'var(--primary)', borderColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Export to Edit PDF
                  </button>
                  <button type="button" onClick={handlePrint} className="btn btn-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#030712" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print / PDF
                  </button>
                </div>
              </div>

              {/* Invoice Layout Sheet (Matches official clean style) */}
              <div className="glass-panel print-sheet">
                
                {/* Print Branding Header */}
                <div className="invoice-brand-bar" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '24px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {companyProfile.logoBase64 ? (
                      <img 
                        src={companyProfile.logoBase64} 
                        alt="Logo" 
                        style={{ maxHeight: '56px', maxWidth: '160px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }} 
                      />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '4px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#030712" strokeWidth="2.5">
                          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h2 className="invoice-company-name" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{companyProfile.companyName.toUpperCase()}</h2>
                      <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                        {companyProfile.companyAddress}
                      </p>
                      <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                        Contact: {companyProfile.companyPhone} • Email: {companyProfile.companyEmail}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <h2 className="invoice-title-color" style={{ fontSize: '1.3rem', fontWeight: 800 }}>QUOTATION</h2>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>
                      {selectedQuote.quoteNumber}
                    </p>
                    <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                      Date: {selectedQuote.date}
                    </p>
                  </div>
                </div>

                {/* Client / Business Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '32px', fontSize: '0.9rem' }}>
                  <div className="invoice-blue-accent" style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
                      Prepared For (Party):
                    </span>
                    <div className="no-print">
                      <input
                        type="text"
                        className="table-inline-input"
                        style={{ fontWeight: 700, fontSize: '1.05rem', padding: '2px 4px', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                        value={selectedQuote.customerName}
                        onChange={(e) => updateQuotation(selectedQuote.id, { customerName: e.target.value })}
                        placeholder="Customer Name"
                      />
                    </div>
                    <strong className="print-only" style={{ fontSize: '1.05rem' }}>{selectedQuote.customerName}</strong>
                    
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Mobile No:</span>
                        <div className="no-print" style={{ width: '100%' }}>
                          <input
                            type="text"
                            className="table-inline-input"
                            style={{ padding: '2px 4px', fontSize: '0.9rem', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                            value={selectedQuote.customerPhone}
                            onChange={(e) => updateQuotation(selectedQuote.id, { customerPhone: e.target.value })}
                            placeholder="Phone Number"
                          />
                        </div>
                        <span className="print-only">{selectedQuote.customerPhone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>Email Id:</span>
                        <div className="no-print" style={{ width: '100%' }}>
                          <input
                            type="text"
                            className="table-inline-input"
                            style={{ padding: '2px 4px', fontSize: '0.9rem', width: '100%', borderBottom: '1px dashed var(--glass-border)' }}
                            value={selectedQuote.customerEmail}
                            onChange={(e) => updateQuotation(selectedQuote.id, { customerEmail: e.target.value })}
                            placeholder="Email"
                          />
                        </div>
                        <span className="print-only">{selectedQuote.customerEmail}</span>
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
                          minHeight: '60px', 
                          resize: 'vertical',
                          borderBottom: '1px dashed var(--glass-border)',
                          background: 'transparent'
                        }}
                        value={companyProfile.bankDetails || ''}
                        onChange={(e) => updateCompanyProfile({ ...companyProfile, bankDetails: e.target.value })}
                        placeholder="Configure bank details in Settings..."
                      />
                    </div>
                    <p className="print-only" style={{ fontSize: '0.85rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                      {companyProfile.bankDetails || 'Bank details not configured.'}
                    </p>
                  </div>
                </div>

                {/* Itemized Table of Glass Specifications */}
                <div style={{ marginBottom: '32px' }}>
                  <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr className="invoice-table-header">
                        <th style={{ padding: '8px', fontWeight: 600 }}>Description</th>
                        <th style={{ padding: '8px', fontWeight: 600 }}>Category</th>
                        <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>{selectedQuote.sizeHeading || 'Size (Sq.Ft.)'}</th>
                        <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>{selectedQuote.unitHeading || 'Qty'}</th>
                        <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>Rate / {selectedQuote.sizeHeading || 'Sq.Ft.'}</th>
                        <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>Final Amount</th>
                        <th className="no-print" style={{ padding: '8px', fontWeight: 600, textAlign: 'center', width: '60px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuote.summary.items.map((itemObj) => {
                        const { item, result } = itemObj;
                        return (
                          <tr key={item.id} className="invoice-table-row">
                            <td style={{ padding: '8px', verticalAlign: 'middle' }}>
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
                            <td style={{ padding: '8px', verticalAlign: 'middle' }}>
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
                            <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'middle' }}>
                              <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="table-inline-input font-mono"
                                  style={{ width: '60px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)' }}
                                  value={item.sizeSqFt || ''}
                                  onChange={(e) => handleUpdateItem(item.id!, { sizeSqFt: safeNumber(e.target.value, 0) })}
                                  placeholder="0.00"
                                />
                                <input
                                  type="text"
                                  className="table-inline-input"
                                  style={{ width: '45px', padding: '2px', fontSize: '0.8rem', borderBottom: '1px dashed var(--glass-border)' }}
                                  value={item.sizeUnit || 'sq.ft'}
                                  onChange={(e) => handleUpdateItem(item.id!, { sizeUnit: e.target.value })}
                                />
                              </div>
                              <span className="print-only" style={{ fontFamily: 'monospace' }}>
                                {item.sizeSqFt.toFixed(2)} {item.sizeUnit || 'sq.ft'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'middle' }}>
                              <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                <input
                                  type="number"
                                  min="1"
                                  className="table-inline-input font-mono"
                                  style={{ width: '45px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)' }}
                                  value={item.quantity || ''}
                                  onChange={(e) => handleUpdateItem(item.id!, { quantity: Math.max(0, Math.floor(safeNumber(e.target.value, 1))) })}
                                  placeholder="1"
                                />
                                <input
                                  type="text"
                                  className="table-inline-input"
                                  style={{ width: '35px', padding: '2px', fontSize: '0.8rem', borderBottom: '1px dashed var(--glass-border)' }}
                                  value={item.qtyUnit || 'pcs'}
                                  onChange={(e) => handleUpdateItem(item.id!, { qtyUnit: e.target.value })}
                                />
                              </div>
                              <span className="print-only" style={{ fontWeight: 600 }}>
                                {item.quantity} {item.qtyUnit || 'pcs'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'middle' }}>
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
                                  style={{ width: '60px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)' }}
                                  value={item.rate || ''}
                                  onChange={(e) => handleUpdateItem(item.id!, { rate: safeNumber(e.target.value, 0) })}
                                  placeholder="0"
                                />
                              </div>
                              <span className="print-only" style={{ fontFamily: 'monospace' }}>
                                {formatCustomCurrency(item.rate, item.currencySymbol || '₹')}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', verticalAlign: 'middle' }}>
                              <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                <span style={{ fontSize: '0.85rem' }}>{item.currencySymbol || '₹'}</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="table-inline-input font-mono"
                                  style={{ width: '80px', padding: '2px', textAlign: 'right', fontWeight: 700, borderBottom: '1px dashed var(--glass-border)' }}
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
                            <td className="no-print" style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
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
                    gap: '24px', 
                    marginTop: '16px', 
                    alignItems: 'start' 
                  }}
                >
                  {/* Terms & Conditions Section */}
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }} className="invoice-terms-section">
                    <h4 className="invoice-title-color" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Terms & Conditions:</h4>
                    <div style={{ fontSize: '0.7rem', lineHeight: '1.4', whiteSpace: 'pre-line' }} className="invoice-terms-text">
                      {companyProfile.termsAndConditions || '1. Price is ex-factory. Transportation and installation/labour charges are extra.\n2. 50% advance along with order purchase, balance 50% before delivery.\n3. Goods once sold will not be taken back or exchanged.\n4. Glass breakage after delivery is not our responsibility.\n5. Any disputes are subject to local jurisdiction only.'}
                    </div>
                  </div>

                  {/* Totals & Tax Invoicing Summaries */}
                  {(() => {
                    const quoteCurrency = selectedQuote.items[0]?.currencySymbol || '₹';
                    return (
                      <div className="invoice-totals-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', padding: '12px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Items Subtotal:</span>
                          <span style={{ fontWeight: 600 }}>{formatCustomCurrency(selectedQuote.summary.subtotal, quoteCurrency)}</span>
                        </div>
                        
                        {/* Discount */}
                        <div 
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          className={selectedQuote.summary.discountAmount > 0 ? "" : "no-print"}
                        >
                          <span style={{ color: selectedQuote.summary.discountAmount > 0 ? '#e11d48' : 'inherit' }}>Discount:</span>
                          <div className="no-print" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="number"
                              className="table-inline-input font-mono"
                              style={{ width: '45px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)', fontSize: '0.75rem' }}
                              value={selectedQuote.discount || ''}
                              onChange={(e) => updateQuotation(selectedQuote.id, { discount: safeNumber(e.target.value, 0) })}
                              placeholder="0"
                            />
                            <select
                              className="table-inline-input"
                              style={{ padding: '2px', fontSize: '0.75rem', borderBottom: '1px dashed var(--glass-border)', cursor: 'pointer' }}
                              value={selectedQuote.isDiscountFlat ? 'flat' : 'percent'}
                              onChange={(e) => updateQuotation(selectedQuote.id, { isDiscountFlat: e.target.value === 'flat' })}
                            >
                              <option value="percent" style={{ background: '#0e1420' }}>%</option>
                              <option value="flat" style={{ background: '#0e1420' }}>{quoteCurrency}</option>
                            </select>
                          </div>
                          <span className="print-only" style={{ fontWeight: 600, color: '#e11d48' }}>
                            -{formatCustomCurrency(selectedQuote.summary.discountAmount, quoteCurrency)}
                          </span>
                        </div>

                        {/* Transport */}
                        <div 
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          className={selectedQuote.summary.transportCharges > 0 ? "" : "no-print"}
                        >
                          <span>Transport:</span>
                          <div className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '0.75rem' }}>{quoteCurrency}</span>
                            <input
                              type="number"
                              className="table-inline-input font-mono"
                              style={{ width: '60px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)', fontSize: '0.75rem' }}
                              value={selectedQuote.transportCharges || ''}
                              onChange={(e) => updateQuotation(selectedQuote.id, { transportCharges: safeNumber(e.target.value, 0) })}
                              placeholder="0"
                            />
                          </div>
                          <span className="print-only" style={{ fontWeight: 600 }}>
                            {formatCustomCurrency(selectedQuote.summary.transportCharges, quoteCurrency)}
                          </span>
                        </div>

                        {/* Labour */}
                        <div 
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          className={selectedQuote.summary.labourCharges > 0 ? "" : "no-print"}
                        >
                          <span>Labour/Fitting:</span>
                          <div className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '0.75rem' }}>{quoteCurrency}</span>
                            <input
                              type="number"
                              className="table-inline-input font-mono"
                              style={{ width: '60px', padding: '2px', textAlign: 'right', borderBottom: '1px dashed var(--glass-border)', fontSize: '0.75rem' }}
                              value={selectedQuote.labourCharges || ''}
                              onChange={(e) => updateQuotation(selectedQuote.id, { labourCharges: safeNumber(e.target.value, 0) })}
                              placeholder="0"
                            />
                          </div>
                          <span className="print-only" style={{ fontWeight: 600 }}>
                            {formatCustomCurrency(selectedQuote.summary.labourCharges, quoteCurrency)}
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
                              checked={selectedQuote.isTaxEnabled !== false}
                              onChange={(e) => updateQuotation(selectedQuote.id, { isTaxEnabled: e.target.checked })}
                            />
                            <label htmlFor="list-tax-checkbox" style={{ cursor: 'pointer', userSelect: 'none', fontSize: '0.8rem' }}>
                              GST ({selectedQuote.summary.taxRate}%):
                            </label>
                          </div>
                          <span className="print-only">
                            GST ({selectedQuote.summary.taxRate}%):
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatCustomCurrency(selectedQuote.summary.taxAmount, quoteCurrency)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', fontSize: '1.05rem' }}>
                          <span style={{ fontWeight: 700 }}>Total:</span>
                          <span className="invoice-grand-total" style={{ fontWeight: 800 }}>{formatCustomCurrency(selectedQuote.summary.grandTotal, quoteCurrency)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Signature Lines */}
                <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', fontSize: '0.85rem' }}>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '8px', textAlign: 'center' }} className="invoice-signature-line">
                    Customer Acceptance Signature
                  </div>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '8px', textAlign: 'center' }} className="invoice-signature-line">
                    Authorized Sales Officer
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-muted)' }}>
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p style={{ marginTop: '16px' }}>Select a quotation record from the list to view billing information.</p>
            </div>
          )}
        </div>

      </div>

      <style jsx global>{`
        /* Normal screen styles for invoice preview */
        .print-sheet {
          background: #0b111e !important;
          border: 1px solid var(--glass-border) !important;
          color: var(--text-primary) !important;
          font-family: var(--font-sans);
          padding: 32px !important;
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

        /* Print styles with elegant blue accent design */
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
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
          .quotation-layout-grid {
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
          }
          .table-inline-input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            color: inherit !important;
            font-size: inherit !important;
            font-weight: inherit !important;
            font-family: inherit !important;
            width: auto !important;
            box-shadow: none !important;
            pointer-events: none !important;
          }
          .invoice-brand-bar {
            border-bottom: 3px solid #1e3a88 !important; /* solid corporate blue border */
            padding-bottom: 16px !important;
            margin-bottom: 20px !important;
          }
          .invoice-title-color {
            color: #1e3a88 !important;
          }
          .invoice-company-name {
            color: #0f172a !important;
          }
          .invoice-table-header {
            background: #1e3a88 !important; /* solid blue header bar */
            color: #ffffff !important;
          }
          .invoice-table-header th {
            color: #ffffff !important;
            padding: 10px !important;
            border: none !important;
          }
          .invoice-table-row {
            border-bottom: 1.5px solid #dbeafe !important; /* light blue divider */
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .invoice-table-row td {
            color: #334155 !important;
            border: none !important;
          }
          .table-item-title {
            color: #1e293b !important;
          }
          .invoice-totals-box {
            background: #f0f9ff !important; /* soft ice blue backdrop */
            border: 1.5px solid #bfdbfe !important; /* light blue border */
            padding: 16px !important;
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
            color: #1e3a88 !important; /* solid navy grand total */
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
            margin-top: 8px !important;
            padding-top: 4px !important;
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
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* force colored graphics printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function QuotationListPage() {
  return (
    <Suspense fallback={
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-secondary)' }}>
        Loading quotation log directory...
      </div>
    }>
      <QuotationListContent />
    </Suspense>
  );
}
