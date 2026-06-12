'use client';

import React from 'react';
import { useQuotation, CustomerItem } from '@/context/QuotationContext';
import { formatRupee } from '@/utils/calculator';
import { exportToCSV, parseCSV } from '@/utils/csvHelper';

export default function CustomersListPage() {
  const { customers, importCustomers } = useQuotation();

  const totalCustomers = customers.length;
  
  const highValueCustomersCount = customers.filter(
    (c) => c.totalOrdersAmount >= 50000
  ).length;

  const totalBusinessValue = customers.reduce(
    (sum, c) => sum + c.totalOrdersAmount, 
    0
  );

  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Customer Name',
      'Mobile',
      'Email Address',
      'Total Orders Value',
      'Quotes Generated Count',
      'Last Active'
    ];
    exportToCSV(
      customers,
      headers,
      (c) => [
        c.id,
        c.name,
        c.phone,
        c.email,
        c.totalOrdersAmount,
        c.totalQuotationsCount,
        c.lastActive
      ],
      'Customers'
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
        const idIdx = headers.indexOf('customer id');
        const nameIdx = headers.indexOf('customer name');
        const phoneIdx = headers.indexOf('mobile');
        const emailIdx = headers.indexOf('email address');
        const ordersValIdx = headers.indexOf('total orders value');
        const quotesCountIdx = headers.indexOf('quotes generated count');
        const lastActiveIdx = headers.indexOf('last active');

        if (nameIdx === -1 || phoneIdx === -1) {
          alert('Invalid customers CSV structure. Headers must include "Customer Name" and "Mobile".');
          return;
        }

        const importedCustomers: CustomerItem[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 2) continue;

          const id = idIdx !== -1 && row[idIdx] ? row[idIdx] : Math.random().toString(36).substring(7);
          const name = row[nameIdx];
          const phone = row[phoneIdx];
          const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : 'N/A';
          const totalOrdersAmount = ordersValIdx !== -1 ? parseFloat(row[ordersValIdx]) || 0 : 0;
          const totalQuotationsCount = quotesCountIdx !== -1 ? parseInt(row[quotesCountIdx], 10) || 0 : 0;
          const lastActive = lastActiveIdx !== -1 && row[lastActiveIdx] ? row[lastActiveIdx] : new Date().toLocaleDateString('en-IN').split(',')[0];

          importedCustomers.push({
            id,
            name,
            phone,
            email,
            totalOrdersAmount,
            totalQuotationsCount,
            lastActive
          });
        }

        if (importedCustomers.length > 0) {
          importCustomers(importedCustomers);
          alert(`Successfully imported ${importedCustomers.length} customer records!`);
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
      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Customers CRM Directory</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Directory of active glass buyers, contact logs, quotation counters, and gross account valuations.
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

      {/* Metrics Row */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Total Customers
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-header)', color: 'var(--primary)' }}>
            {totalCustomers} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>accounts</span>
          </span>
        </div>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Gross Converted Revenue
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-header)', color: '#10b981' }}>
            {formatRupee(totalBusinessValue)}
          </span>
        </div>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Key Accounts (≥ ₹50,000)
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-header)', color: 'var(--warning)' }}>
            {highValueCustomersCount} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>clients</span>
          </span>
        </div>
      </div>

      {/* Customers List Table */}
      <div className="glass-panel">
        <h3>Master Client Records</h3>
        
        {customers.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No client records logged yet. New customer logs are automatically generated when you save quotations.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Customer Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mobile No.</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email Address</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Quotes Generated</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Total Orders Value</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color var(--transition-fast)' }} className="table-row-hover">
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>
                      {c.phone}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {c.email}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 600 }}>
                      {c.totalQuotationsCount}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: '#10b981' }}>
                      {formatRupee(c.totalOrdersAmount)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                      {c.lastActive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
}
