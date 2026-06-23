'use client';

import React, { useState } from 'react';
import { ConversionService } from '@/utils/ConversionService';

export default function InchesToSqFtPage() {
  const [width, setWidth] = useState<string>('');
  const [length, setLength] = useState<string>('');

  const widthNum = parseFloat(width);
  const lengthNum = parseFloat(length);

  const widthError = width !== '' && (isNaN(widthNum) || widthNum <= 0)
    ? 'Width must be a positive number greater than zero.'
    : null;

  const lengthError = length !== '' && (isNaN(lengthNum) || lengthNum <= 0)
    ? 'Length must be a positive number greater than zero.'
    : null;

  const isValid = width !== '' && length !== '' && !widthError && !lengthError;
  const resultSqFt = isValid ? ConversionService.inchesToSqFt(widthNum, lengthNum) : 0;

  const handleClear = () => {
    setWidth('');
    setLength('');
  };

  return (
    <div>
      <div className="header-container no-print">
        <div>
          <h1>Inches to Sq.Ft Converter</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Convert dimensions in inches directly to square footage (sq.ft) with instant calculation.
          </p>
        </div>
        <button type="button" onClick={handleClear} className="btn btn-secondary">
          Clear Inputs
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
        {/* Input Form Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', color: 'var(--primary)' }}>
            Enter Dimensions
          </h3>

          <div className="form-group">
            <label className="form-label">Width (Inches)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 36"
              className="form-input font-mono"
              style={{ borderColor: widthError ? 'var(--danger)' : undefined }}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
            {widthError && (
              <span style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '4px' }}>
                ⚠️ {widthError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Length / Height (Inches)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 60"
              className="form-input font-mono"
              style={{ borderColor: lengthError ? 'var(--danger)' : undefined }}
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />
            {lengthError && (
              <span style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '4px' }}>
                ⚠️ {lengthError}
              </span>
            )}
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            <strong>Inches to Sq.Ft Formula:</strong>
            <div style={{ marginTop: '4px', fontFamily: 'monospace' }}>
              Area (Sq.Ft) = (Width (in) × Length (in)) / 144
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div 
            className="glass-panel" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', 
              border: isValid ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 24px',
              textAlign: 'center',
              minHeight: '220px'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              Calculated Area
            </span>
            {isValid ? (
              <>
                <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-header)', marginTop: '16px', color: 'var(--primary)' }}>
                  {resultSqFt.toFixed(4)} <span style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-primary)' }}>Sq.Ft.</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px' }}>
                  {widthNum}" × {lengthNum}"
                </div>
              </>
            ) : (
              <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '24px', fontWeight: 500 }}>
                Enter valid positive dimensions to see result.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
