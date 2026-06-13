'use client';

import React, { useState, useEffect } from 'react';
import { useQuotation, CompanyProfile } from '@/context/QuotationContext';

export default function SettingsPage() {
  const { companyProfile, updateCompanyProfile, resetCompanyProfile } = useQuotation();

  const [activeTab, setActiveTab] = useState<'profile' | 'terms' | 'bank'>('profile');

  // Local state for configuration form fields
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [logoBase64, setLogoBase64] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [bankDetails, setBankDetails] = useState('');

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

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all company configurations and logo to standard defaults?')) {
      resetCompanyProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <h1>Company Setup & Billing Configurations</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure your corporate profiles, set up default tax rates, and manage invoice header logo displays.
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
      </div>

      {saveSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', color: '#a7f3d0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Configurations saved successfully! These details will render on all newly generated printed invoice sheets.
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
    </div>
  );
}
