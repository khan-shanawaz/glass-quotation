'use client';

import React from 'react';
import Link from 'next/link';
import { useQuotation, ProjectStatus, ProjectItem } from '@/context/QuotationContext';
import { formatRupee } from '@/utils/calculator';

interface StatusColumn {
  id: ProjectStatus;
  title: string;
  color: string;
  bgGlow: string;
}

export default function ProjectStatusBoardPage() {
  const { projects, updateProjectStatus, deleteProject } = useQuotation();

  const columns: StatusColumn[] = [
    { id: 'planning', title: 'Planning / Design', color: 'var(--primary)', bgGlow: 'rgba(6, 182, 212, 0.05)' },
    { id: 'production', title: 'In Production', color: 'var(--accent)', bgGlow: 'rgba(99, 102, 241, 0.05)' },
    { id: 'delivery', title: 'Ready for Delivery', color: 'var(--warning)', bgGlow: 'rgba(245, 158, 11, 0.05)' },
    { id: 'installed', title: 'Installed', color: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.05)' },
    { id: 'completed', title: 'Completed', color: 'var(--text-muted)', bgGlow: 'rgba(255, 255, 255, 0.01)' },
  ];

  const handleStatusChange = (projectId: string, currentStatus: ProjectStatus, direction: 'forward' | 'backward') => {
    const statusOrder: ProjectStatus[] = ['planning', 'production', 'delivery', 'installed', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    if (direction === 'forward' && currentIndex < statusOrder.length - 1) {
      updateProjectStatus(projectId, statusOrder[currentIndex + 1]);
    } else if (direction === 'backward' && currentIndex > 0) {
      updateProjectStatus(projectId, statusOrder[currentIndex - 1]);
    }
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter((p) => p.status === status);
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <h1>Production & Projects Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Track active glass door, window, and mirror orders across workflow phases in real-time.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '64px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div>
            <h3>No Active Projects in Pipeline</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Create a quote and convert it to a project inside the **Quotation List** to track production workflows.
            </p>
          </div>
          <Link href="/quotation-list" className="btn btn-secondary">
            View Quotation Archive
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minWidth: '1100px' }}>
          {columns.map((col) => {
            const colProjects = getProjectsByStatus(col.id);
            const totalVal = colProjects.reduce((sum, p) => sum + p.amount, 0);

            return (
              <div
                key={col.id}
                style={{
                  background: 'rgba(8, 11, 17, 0.4)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minHeight: '70vh'
                }}
              >
                {/* Column Title Header */}
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: col.color }}>{col.title}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                      {colProjects.length}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Total: <strong style={{ color: '#10b981' }}>{formatRupee(totalVal)}</strong>
                  </div>
                </div>

                {/* Cards List Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, overflowY: 'auto' }}>
                  {colProjects.map((project) => (
                    <div
                      key={project.id}
                      className="glass-panel"
                      style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.01)',
                        borderColor: 'var(--glass-border)',
                        boxShadow: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {project.quoteNumber}
                        </div>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>
                          {project.customerName}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                          {formatRupee(project.amount)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {project.dateCreated.split(',')[0]}
                        </span>
                      </div>

                      {/* Kanban Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(project.id, project.status, 'backward')}
                          disabled={project.status === 'planning'}
                          className="btn btn-secondary"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            opacity: project.status === 'planning' ? 0.3 : 1,
                            cursor: project.status === 'planning' ? 'not-allowed' : 'pointer'
                          }}
                          title="Move Back"
                        >
                          ◀
                        </button>
                        
                        <Link href={`/quotation-list?id=${project.quoteId}`} style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                          View Invoice
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(project.id, project.status, 'forward')}
                          disabled={project.status === 'completed'}
                          className="btn btn-secondary"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.7rem',
                            opacity: project.status === 'completed' ? 0.3 : 1,
                            cursor: project.status === 'completed' ? 'not-allowed' : 'pointer'
                          }}
                          title="Move Forward"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
