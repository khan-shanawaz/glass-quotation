'use client';

import React from 'react';
import Link from 'next/link';
import { useQuotation, ProjectStatus, ProjectItem } from '@/context/QuotationContext';
import { formatRupee } from '@/utils/calculator';
import { exportToCSV, parseCSV } from '@/utils/csvHelper';

export default function ProjectsListPage() {
  const { projects, updateProjectStatus, deleteProject, importProjects } = useQuotation();

  const totalActiveJobs = projects.filter((p) => p.status !== 'completed').length;
  const totalCompletedJobs = projects.filter((p) => p.status === 'completed').length;
  const activeValue = projects
    .filter((p) => p.status !== 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadgeStyles = (status: ProjectStatus) => {
    switch (status) {
      case 'planning':
        return { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' };
      case 'production':
        return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
      case 'delivery':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'installed':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'completed':
        return { color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)' };
      default:
        return { color: '#f8fafc', bg: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Project ID',
      'Quote ID',
      'Quote Number',
      'Customer Name',
      'Mobile',
      'Amount',
      'Status',
      'Date Created'
    ];
    exportToCSV(
      projects,
      headers,
      (p) => [
        p.id,
        p.quoteId,
        p.quoteNumber,
        p.customerName,
        p.customerPhone,
        p.amount,
        p.status,
        p.dateCreated
      ],
      'Projects'
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
        const idIdx = headers.indexOf('project id');
        const quoteIdIdx = headers.indexOf('quote id');
        const quoteNumIdx = headers.indexOf('quote number');
        const nameIdx = headers.indexOf('customer name');
        const phoneIdx = headers.indexOf('mobile');
        const amountIdx = headers.indexOf('amount');
        const statusIdx = headers.indexOf('status');
        const dateIdx = headers.indexOf('date created');

        if (quoteNumIdx === -1 || nameIdx === -1 || phoneIdx === -1) {
          alert('Invalid projects CSV structure. Headers must include "Quote Number", "Customer Name", and "Mobile".');
          return;
        }

        const importedProjects: ProjectItem[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 3) continue;

          const id = idIdx !== -1 && row[idIdx] ? row[idIdx] : Math.random().toString(36).substring(7);
          const quoteId = quoteIdIdx !== -1 && row[quoteIdIdx] ? row[quoteIdIdx] : Math.random().toString(36).substring(7);
          const quoteNumber = row[quoteNumIdx];
          const customerName = row[nameIdx];
          const customerPhone = phoneIdx !== -1 ? row[phoneIdx] : 'N/A';
          const amount = amountIdx !== -1 ? parseFloat(row[amountIdx]) || 0 : 0;
          const status = (statusIdx !== -1 && row[statusIdx] ? row[statusIdx].toLowerCase() : 'planning') as ProjectStatus;
          const dateCreated = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : new Date().toLocaleDateString('en-IN');

          importedProjects.push({
            id,
            quoteId,
            quoteNumber,
            customerName,
            customerPhone,
            amount,
            status,
            dateCreated
          });
        }

        if (importedProjects.length > 0) {
          importProjects(importedProjects);
          alert(`Successfully imported ${importedProjects.length} projects!`);
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
          <h1>Active Projects Archive</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Browse and manage all customer jobs in progress, view histories, and update progress pipelines.
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

      {/* Stats Cards Row */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Active Projects
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-header)', color: 'var(--primary)' }}>
            {totalActiveJobs} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>jobs</span>
          </span>
        </div>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Pipeline Valuation
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-header)', color: '#10b981' }}>
            {formatRupee(activeValue)}
          </span>
        </div>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            Completed Contracts
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-header)', color: 'var(--text-secondary)' }}>
            {totalCompletedJobs} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>jobs</span>
          </span>
        </div>
      </div>

      {/* Projects Table List */}
      <div className="glass-panel">
        <h3>Master Projects Directory</h3>
        
        {projects.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No projects registered. Convert quotations into projects from the **Quotation List** to view them here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Reference No.</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Party Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date Started</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Workflow Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const badge = getStatusBadgeStyles(project.status);
                  return (
                    <tr key={project.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color var(--transition-fast)' }} className="table-row-hover">
                      <td style={{ padding: '16px', fontWeight: 600 }}>
                        <Link href={`/quotation-list?id=${project.quoteId}`} style={{ color: 'var(--primary)' }}>
                          {project.quoteNumber}
                        </Link>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div>{project.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{project.customerPhone}</div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{project.dateCreated}</td>
                      <td style={{ padding: '16px', fontWeight: 700, textAlign: 'right', color: '#10b981' }}>
                        {formatRupee(project.amount)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ color: badge.color, background: badge.bg, padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                          {project.status === 'planning' ? 'Planning / Design' : project.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="form-input"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', background: '#0e1420', margin: 0 }}
                            value={project.status}
                            onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                          >
                            <option value="planning">Planning / Design</option>
                            <option value="production">In Production</option>
                            <option value="delivery">Ready for Delivery</option>
                            <option value="installed">Installed</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => deleteProject(project.id)}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                            title="Delete project"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
