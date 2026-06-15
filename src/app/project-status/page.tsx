'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuotation, ProjectStatus, ProjectItem, ProjectTask } from '@/context/QuotationContext';
import { formatRupee } from '@/utils/calculator';

interface StatusColumn {
  id: ProjectStatus;
  title: string;
  color: string;
  bgGlow: string;
}

export default function ProjectStatusBoardPage() {
  const {
    projects,
    updateProjectStatus,
    deleteProject,
    addProject,
    addProjectTask,
    updateProjectTaskStatus,
    deleteProjectTask
  } = useQuotation();

  // State management
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingTaskColumn, setIsAddingTaskColumn] = useState<ProjectStatus | null>(null);
  const [taskText, setTaskText] = useState('');

  // Form state for new project
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('planning');

  // Auto-select first project on mount or project list change if none selected
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const columns: StatusColumn[] = [
    { id: 'planning', title: 'Planning / Design', color: 'var(--primary)', bgGlow: 'rgba(6, 182, 212, 0.05)' },
    { id: 'production', title: 'In Production', color: 'var(--accent)', bgGlow: 'rgba(99, 102, 241, 0.05)' },
    { id: 'delivery', title: 'Ready for Delivery', color: 'var(--warning)', bgGlow: 'rgba(245, 158, 11, 0.05)' },
    { id: 'installed', title: 'Installed', color: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.05)' },
    { id: 'completed', title: 'Completed', color: 'var(--text-muted)', bgGlow: 'rgba(255, 255, 255, 0.01)' },
  ];

  const handleTaskStatusChange = (taskId: string, currentStatus: ProjectStatus, direction: 'forward' | 'backward') => {
    if (!selectedProjectId) return;
    const statusOrder: ProjectStatus[] = ['planning', 'production', 'delivery', 'installed', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    if (direction === 'forward' && currentIndex < statusOrder.length - 1) {
      updateProjectTaskStatus(selectedProjectId, taskId, statusOrder[currentIndex + 1]);
    } else if (direction === 'backward' && currentIndex > 0) {
      updateProjectTaskStatus(selectedProjectId, taskId, statusOrder[currentIndex - 1]);
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const parsedAmount = parseFloat(newAmount) || 0;
    addProject(newCustomerName, newCustomerPhone, parsedAmount, newStatus);
    
    // Reset form states
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewAmount('');
    setNewStatus('planning');
    setIsModalOpen(false);
  };

  const handleAddTaskSubmit = (columnId: ProjectStatus) => {
    if (!selectedProjectId || !taskText.trim()) return;
    addProjectTask(selectedProjectId, taskText.trim(), columnId);
    setTaskText('');
    setIsAddingTaskColumn(null);
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '85vh' }}>
      
      {/* Header with main controls */}
      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Production & Projects Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage tasks and monitor workflow statuses for your glass and mirror orders.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '64px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <div>
            <h3>No Active Projects in Pipeline</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Create a project using the **Add New Project** button, or convert a quote from the **Quotation List**.
            </p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            Create First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* First Column: Project Selection List */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '78vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Active Projects ({projects.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {projects.map((project) => {
                const isActive = project.id === selectedProjectId;
                const taskCount = project.tasks?.length || 0;
                
                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                    className="project-item-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {project.quoteNumber || 'Manual Project'}
                      </span>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)'
                      }}>
                        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: isActive ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {project.customerName}
                    </strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.75rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>{formatRupee(project.amount)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{project.dateCreated.split(',')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Second Column: Selected Project Detail & Kanban View */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedProject ? (
              <>
                {/* Project Details Banner */}
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{selectedProject.customerName}</h2>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        background: 'rgba(6, 182, 212, 0.1)', 
                        color: 'var(--primary)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                        fontWeight: 600
                      }}>
                        {selectedProject.quoteNumber || 'Manual'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span>📞 {selectedProject.customerPhone}</span>
                      <span>📅 Created: {selectedProject.dateCreated}</span>
                      <span>💰 Value: <strong style={{ color: '#10b981' }}>{formatRupee(selectedProject.amount)}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {selectedProject.quoteId && (
                      <Link href={`/quotation-list?id=${selectedProject.quoteId}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                        View Invoice
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this project?')) {
                          deleteProject(selectedProject.id);
                          setSelectedProjectId(null);
                        }
                      }}
                      className="btn"
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '6px 12px', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      Delete Project
                    </button>
                  </div>
                </div>

                {/* Kanban Task Board */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {columns.map((col) => {
                    const columnTasks = (selectedProject.tasks || []).filter(t => t.status === col.id);
                    
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
                          gap: '12px',
                          minHeight: '60vh',
                          minWidth: '200px'
                        }}
                      >
                        {/* Header */}
                        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: col.color }}>{col.title}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '10px' }}>
                              {columnTasks.length}
                            </span>
                          </div>
                        </div>

                        {/* Task items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1, overflowY: 'auto' }}>
                          {columnTasks.map((task) => (
                            <div
                              key={task.id}
                              className="glass-panel"
                              style={{
                                padding: '10px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                            >
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-word', fontWeight: 550 }}>
                                {task.title}
                              </span>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, task.status, 'backward')}
                                    disabled={task.status === 'planning'}
                                    className="btn btn-secondary"
                                    style={{ padding: '2px 6px', fontSize: '0.65rem', minWidth: 'auto', opacity: task.status === 'planning' ? 0.3 : 1 }}
                                  >
                                    ◀
                                  </button>
                                  <button
                                    onClick={() => handleTaskStatusChange(task.id, task.status, 'forward')}
                                    disabled={task.status === 'completed'}
                                    className="btn btn-secondary"
                                    style={{ padding: '2px 6px', fontSize: '0.65rem', minWidth: 'auto', opacity: task.status === 'completed' ? 0.3 : 1 }}
                                  >
                                    ▶
                                  </button>
                                </div>
                                <button
                                  onClick={() => deleteProjectTask(selectedProject.id, task.id)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    padding: '2px 4px'
                                  }}
                                  title="Delete Task"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Task Control */}
                        {isAddingTaskColumn === col.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                            <input
                              type="text"
                              value={taskText}
                              onChange={(e) => setTaskText(e.target.value)}
                              placeholder="Task description..."
                              style={{ 
                                width: '100%', 
                                padding: '6px', 
                                background: 'rgba(0,0,0,0.2)', 
                                border: '1px solid var(--glass-border)', 
                                color: 'white', 
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTaskSubmit(col.id);
                                if (e.key === 'Escape') setIsAddingTaskColumn(null);
                              }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleAddTaskSubmit(col.id)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', flex: 1 }}>
                                Add
                              </button>
                              <button onClick={() => setIsAddingTaskColumn(null)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setIsAddingTaskColumn(col.id);
                              setTaskText('');
                            }}
                            className="btn btn-secondary"
                            style={{ 
                              width: '100%', 
                              padding: '6px', 
                              fontSize: '0.75rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '4px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px dashed var(--glass-border)'
                            }}
                          >
                            + Add Task
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="glass-panel" style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>No Project Selected</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Please select an active project from the list on the left to view tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Create New Project</h3>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Shanawaz Khan"
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Customer Phone</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 99999 88888"
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Project Amount (₹)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Initial Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                  style={{ width: '100%', padding: '8px', background: '#0a0d14', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                >
                  <option value="planning">Planning / Design</option>
                  <option value="production">In Production</option>
                  <option value="delivery">Ready for Delivery</option>
                  <option value="installed">Installed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Create Project
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
