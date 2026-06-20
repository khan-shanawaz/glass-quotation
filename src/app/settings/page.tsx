'use client';

import React, { useState, useEffect } from 'react';
import { useQuotation, CompanyProfile } from '@/context/QuotationContext';

export default function SettingsPage() {
  const { 
    companyProfile, 
    updateCompanyProfile, 
    resetCompanyProfile,
    isSyncing,
    lastSynced,
    syncStatus,
    syncData
  } = useQuotation();

  const [activeTab, setActiveTab] = useState<'profile' | 'terms' | 'bank' | 'database' | 'offlineDb'>('profile');

  // Local state for configuration form fields
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [logoBase64, setLogoBase64] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [bankDetails, setBankDetails] = useState('');

  // Local state for database configuration credentials
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [tursoUrl, setTursoUrl] = useState('');
  const [tursoToken, setTursoToken] = useState('');

  // Offline directory states
  const [folderName, setFolderName] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('Never');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state with Context when component mounts or config changes
  useEffect(() => {
    if (companyProfile) {
      setCompanyName(companyProfile.companyName);
      setCompanyAddress(companyProfile.companyAddress);
      setCompanyPhone(companyProfile.companyPhone);
      setCompanyEmail(companyProfile.companyEmail);
      setTaxRate(String(companyProfile.taxRate));
      setLogoBase64(companyProfile.logoBase64 || '');
      setTermsAndConditions(companyProfile.termsAndConditions || '');
      setBankDetails(companyProfile.bankDetails || '');
    }

    // Load custom database credentials from localStorage
    setSupabaseUrl(localStorage.getItem('glass_saas_supabase_url') || 'https://rdeoheklhcwccixwaeox.supabase.co');
    setSupabaseKey(localStorage.getItem('glass_saas_supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZW9oZWtsaGN3Y2NpeHdhZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQxNjEsImV4cCI6MjA5NjgyMDE2MX0.dLgKJ8Ay7zo91K4vyXC2uKMuAKhzj8rUPUb3b7PBKoA');
    setTursoUrl(localStorage.getItem('glass_saas_turso_url') || 'libsql://glassquote-khan-shanawaz.aws-ap-south-1.turso.io');
    setTursoToken(localStorage.getItem('glass_saas_turso_token') || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEzMzE5MDAsImlkIjoiMDE5ZWJmYTctODYwMS03ODBkLTgwMzgtMTBhMjU2NTNmZDY4IiwicmlkIjoiZjBhN2M4MTMtMTgyYS00YzRjLTg1ZjEtMjZlNWRmMjJhNjdkIn0.-XJMdBrnP9jumN18a7yNIKsHfD0QZMkWf787iEAi0bN_tQtB8qBAbF-dKWAZyZIkV7p8cI--JQHpZd10PWbWCA');

    // Load offline directory metadata
    setFolderName(localStorage.getItem('duckdb_local_folder_name') || '');
    setLastSyncTime(localStorage.getItem('duckdb_last_sync_timestamp') || 'Never');

    const checkPermission = async () => {
      try {
        const { getFolderHandle } = await import('@/utils/duckdb');
        const handle = await getFolderHandle();
        if (handle) {
          const opts = { mode: 'readwrite' as const };
          const permission = await (handle as any).queryPermission(opts);
          setIsAuthorized(permission === 'granted');
          if (permission === 'granted') {
            (window as any).localDatabaseFolderHandle = handle;
          }
        }
      } catch (e) {
        console.error('Failed to load folder handle or query permission:', e);
      }
    };
    checkPermission();
  }, [companyProfile]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('File size exceeds the 1.5MB limit. Please upload a smaller image file for logo.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoBase64('');
    // Reset file input value
    const fileInput = document.getElementById('logo-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rate = Number(taxRate);
    const cleanTaxRate = isNaN(rate) || !isFinite(rate) ? 18 : Math.max(0, rate);

    const newProfile: CompanyProfile = {
      companyName: companyName.trim() || 'GlassFlow Solutions',
      companyAddress: companyAddress.trim() || 'N/A',
      companyPhone: companyPhone.trim() || 'N/A',
      companyEmail: companyEmail.trim() || 'N/A',
      taxRate: cleanTaxRate,
      logoBase64,
      termsAndConditions: termsAndConditions.trim(),
      bankDetails: bankDetails.trim(),
    };

    updateCompanyProfile(newProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveDatabase = (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem('glass_saas_supabase_url', supabaseUrl.trim());
    localStorage.setItem('glass_saas_supabase_key', supabaseKey.trim());
    localStorage.setItem('glass_saas_turso_url', tursoUrl.trim());
    localStorage.setItem('glass_saas_turso_token', tursoToken.trim());

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all company configurations and logo to standard defaults?')) {
      resetCompanyProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSelectFolder = async () => {
    try {
      if (!(window as any).showDirectoryPicker) {
        alert('Your current browser environment does not support the File System Access API. Please use a modern Chromium browser.');
        return;
      }
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const { storeFolderHandle, syncDuckDBToFileStorage } = await import('@/utils/duckdb');
      await storeFolderHandle(handle);
      (window as any).localDatabaseFolderHandle = handle;
      localStorage.setItem('duckdb_local_folder_name', handle.name);
      setFolderName(handle.name);
      setIsAuthorized(true);
      alert(`Successfully linked workspace to your computer folder: "${handle.name}"`);
      
      // Execute initial flush
      await syncDuckDBToFileStorage();
      setLastSyncTime(localStorage.getItem('duckdb_last_sync_timestamp') || 'Never');
    } catch (err) {
      console.error('Folder selection rejected:', err);
    }
  };

  const handleGrantPermission = async () => {
    try {
      const { getFolderHandle, verifyFolderPermission, syncDuckDBToFileStorage } = await import('@/utils/duckdb');
      const handle = await getFolderHandle();
      if (handle) {
        const granted = await verifyFolderPermission(handle);
        setIsAuthorized(granted);
        if (granted) {
          (window as any).localDatabaseFolderHandle = handle;
          alert('Permission granted successfully.');
          await syncDuckDBToFileStorage();
          setLastSyncTime(localStorage.getItem('duckdb_last_sync_timestamp') || 'Never');
        } else {
          alert('Permission denied.');
        }
      }
    } catch (err) {
      console.error('Failed to grant folder permission:', err);
    }
  };

  const handleManualFlush = async () => {
    try {
      const { syncDuckDBToFileStorage } = await import('@/utils/duckdb');
      const success = await syncDuckDBToFileStorage();
      if (success) {
        setLastSyncTime(localStorage.getItem('duckdb_last_sync_timestamp') || 'Never');
        alert('Database snapshot successfully flushed to offline folder.');
      } else {
        alert('Failed to flush database. Make sure you have granted permission to access the folder.');
      }
    } catch (err) {
      console.error('Failed to flush database to file:', err);
    }
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <h1>Company Setup & Billing Configurations</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure your corporate profiles, set up default tax rates, and manage invoice database sync settings.
          </p>
        </div>
        <button type="button" onClick={handleReset} className="btn btn-secondary no-print">
          Reset Profile Defaults
        </button>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--glass-border)', marginBottom: '24px' }} className="no-print">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          Company Profile & Logo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'terms' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'terms' ? 'var(--primary)' : 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          Terms & Conditions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'bank' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'bank' ? 'var(--primary)' : 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          Bank Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('database')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'database' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'database' ? 'var(--primary)' : 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          Cloud Database Config
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('offlineDb')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'offlineDb' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'offlineDb' ? 'var(--primary)' : 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all var(--transition-fast)'
          }}
        >
          Offline Storage
        </button>
      </div>

      {saveSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', color: '#a7f3d0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Configurations saved successfully!
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Card: Company Profile Inputs */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
              Company Credentials
            </h3>

            <div className="form-group">
              <label className="form-label">Company / Firm Name</label>
              <input
                type="text"
                placeholder="e.g. GlassFlow Industries Pvt. Ltd."
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Billing Address</label>
              <textarea
                placeholder="Include State, City, Zip Code, and GSTIN/VAT numbers..."
                className="form-input"
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'var(--font-sans)' }}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone / Mobile</label>
                <input
                  type="text"
                  placeholder="e.g., +91 98765 43210"
                  className="form-input font-mono"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="billing@company.com"
                  className="form-input"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ maxWidth: '200px' }}>
                <label className="form-label">Default GST Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="form-input font-mono"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Save Configurations
              </button>
            </div>
          </div>

          {/* Right Card: Company Logo Uploader */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
              Company Logo Setup
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Upload custom corporate letterheads or logos to print on quotations. Supports PNG and JPG (Max 1.5MB).
            </p>

            {/* Logo visualizer uploader field */}
            <div 
              style={{ 
                border: '2px dashed var(--glass-border)', 
                borderRadius: 'var(--radius-md)', 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '180px',
                background: 'rgba(0,0,0,0.1)'
              }}
            >
              {logoBase64 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                  <img 
                    src={logoBase64} 
                    alt="Company Logo Preview" 
                    style={{ 
                      maxHeight: '100px', 
                      maxWidth: '100%', 
                      objectFit: 'contain',
                      background: '#ffffff',
                      padding: '8px',
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }} 
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <label 
                      htmlFor="logo-upload-input" 
                      className="btn btn-secondary" 
                      style={{ cursor: 'pointer', display: 'inline-flex', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', borderColor: 'var(--primary)' }}
                    >
                      Choose Logo File
                    </label>
                    <input 
                      id="logo-upload-input"
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.7rem' }}>Supports PNG, JPG, or GIF up to 1.5MB</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
              * This image is stored locally inside your browser and is not uploaded to any remote server.
            </p>
          </div>
        </form>
      )}

      {activeTab === 'terms' && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Card: Terms & Conditions Input */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
              Company Standard Terms & Conditions
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Specify standard billing terms, breakages policies, and legal clauses. They will automatically be printed on all generated quotation copies.
            </p>

            <div className="form-group">
              <label className="form-label">Terms & Conditions text</label>
              <textarea
                placeholder="Write payment terms, warranty rules, delivery conditions..."
                className="form-input"
                style={{ resize: 'vertical', minHeight: '220px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: '1.6' }}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Save Terms & Conditions
              </button>
            </div>
          </div>

          {/* Right Card: Terms and Conditions guide */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--warning)' }}>
              Industry Standard Tips
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>Consider including the following terms to protect your operations:</p>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Advance:</strong> Always ask for 50% payment before glass custom cutting/toughening.</li>
                <li><strong>Breakage:</strong> Clearly state that glass is fragile and not covered once successfully delivered.</li>
                <li><strong>Timeframe:</strong> Toughening can take up to 7-12 working days.</li>
                <li><strong>Loading/Transport:</strong> Standard transport and crane lifters are charged extra.</li>
              </ul>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'bank' && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Card: Bank Details Input */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
              Company Bank Account Details
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Specify your company's bank account details to display on quotations for receiving client payments.
            </p>

            <div className="form-group">
              <label className="form-label">Bank Details</label>
              <textarea
                placeholder="Bank Name: ...&#10;Account Holder: ...&#10;Account Number: ...&#10;IFSC Code: ...&#10;Branch Name: ..."
                className="form-input"
                style={{ resize: 'vertical', minHeight: '220px', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: '1.6' }}
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Save Bank Details
              </button>
            </div>
          </div>

          {/* Right Card: Payment Tips */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--warning)' }}>
              Payment Information Tips
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>To avoid delay in payment processing, ensure the following fields are clearly listed:</p>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Beneficiary Name:</strong> Your registered legal company name.</li>
                <li><strong>Bank Name & Branch:</strong> Detailed location of the branch.</li>
                <li><strong>Account Number:</strong> Double-check for accuracy.</li>
                <li><strong>IFSC Code:</strong> Required for domestic bank transfers.</li>
                <li><strong>SWIFT/BIC Code:</strong> Include if you accept international payments.</li>
              </ul>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'database' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Card: Database Config Form */}
          <form onSubmit={handleSaveDatabase} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
              Supabase & Turso Credentials
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Configure your cloud database URLs and keys to store quotations, projects, and client records securely in the cloud.
            </p>

            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supabase Config</h4>
            <div className="form-group">
              <label className="form-label">Supabase URL</label>
              <input
                type="text"
                placeholder="e.g. https://xxxxxx.supabase.co"
                className="form-input font-mono"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="Anon/Publishable key"
                className="form-input font-mono"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>

            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Turso Config</h4>
            <div className="form-group">
              <label className="form-label">Turso Database URL</label>
              <input
                type="text"
                placeholder="e.g. libsql://xxxxxx.turso.io"
                className="form-input font-mono"
                value={tursoUrl}
                onChange={(e) => setTursoUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Turso Auth Token</label>
              <input
                type="password"
                placeholder="Database token"
                className="form-input font-mono"
                value={tursoToken}
                onChange={(e) => setTursoToken(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Save Database Config
              </button>
            </div>
          </form>

          {/* Right Card: Manual Sync Trigger */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
              Manual Data Synchronization
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Force upload all local quotations, custom categories, profile setups, and customers from the browser's local memory to your configured cloud databases.
            </p>

            <button
              onClick={syncData}
              disabled={isSyncing}
              className={`btn-sync ${syncStatus === 'success' ? 'btn-sync-success' : syncStatus === 'error' ? 'btn-sync-error' : ''}`}
              style={{ padding: '14px 20px', fontSize: '1rem', width: '100%', borderRadius: 'var(--radius-sm)' }}
            >
              <svg className={isSyncing ? 'animate-spin' : ''} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isSyncing ? 'Synchronizing Cloud Databases...' : 'Sync & Update Database'}
            </button>

            {lastSynced && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px' }}>
                <strong>Last Synced At:</strong> {lastSynced}
              </p>
            )}

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <h5 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Sync Details:</h5>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Rewrites the current local invoice database state to both Turso and Supabase.</li>
                <li>Verify your network connection and credentials if the sync indicators turn red.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'offlineDb' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
              Local PC File Sync Engine (Offline Directory)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Link a folder on your computer to save quotations offline. When online sync occurs or when manually triggered, a snapshot of your database will be written to this folder.
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>LINKED DIRECTORY:</span>
                <span style={{ fontWeight: 700, color: folderName ? 'var(--text-primary)' : 'var(--danger)' }}>
                  {folderName || '🔴 NO FOLDER SELECTED'}
                </span>
              </div>
              {folderName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ACCESS STATUS:</span>
                  <span style={{ fontWeight: 700, color: isAuthorized ? 'var(--success)' : 'var(--warning)' }}>
                    {isAuthorized ? '🟢 AUTHORIZED / CONNECTED' : '🟡 UNAUTHORIZED (REQUIRES GRANTED PERMISSION)'}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleSelectFolder}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                📁 Locate & Connect Storage Folder
              </button>

              {folderName && !isAuthorized && (
                <button
                  type="button"
                  onClick={handleGrantPermission}
                  className="btn btn-warning"
                  style={{ flex: 1, padding: '12px' }}
                >
                  🔓 Grant Write Permission
                </button>
              )}
            </div>

            {folderName && isAuthorized && (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleManualFlush}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  💾 Flush Database Snapshot to Local File
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Last Local Backup:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lastSyncTime}</span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--warning)' }}>
              Offline Directory Instructions
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.5' }}>
              <p>The offline storage mode runs locally inside your browser:</p>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Privacy First:</strong> Your database resides in the browser's Origin Private File System (OPFS) and is completely private.</li>
                <li><strong>Local Backups:</strong> Linking a folder allows the app to dump a backup file (`glass_quotations_local.duckdb`) directly to your hard drive.</li>
                <li><strong>Permission Restrictions:</strong> Security rules require you to authorize the directory connection each time you restart the browser. Click the "Grant Write Permission" button to re-authorize when needed.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
