'use client';

import React, { useState } from 'react';
import { ConversionService } from '@/utils/ConversionService';

export default function MmToSqFtPage() {
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
  
  const conversion = isValid 
    ? ConversionService.mmToSqFt(widthNum, lengthNum)
    : { widthIn: 0, lengthIn: 0, sqFt: 0 };

  const handleClear = () => {
    setWidth('');
    setLength('');
  };

  return (
    <div>
      <div className="header-container no-print">
        <div>
          <h1>MM to Sq.Ft Converter</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Convert dimensions in millimeters (mm) to inches, then compute the final square footage (sq.ft).
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
            <label className="form-label">Width (MM)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 1000"
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
            <label className="form-label">Length / Height (MM)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 1500"
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
            <strong>MM to Sq.Ft (Dual-Step) Process:</strong>
            <ol style={{ paddingLeft: '16px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Convert Millimeters to Inches: <code style={{ fontFamily: 'monospace' }}>Value (mm) / 25.4</code></li>
              <li>Calculate Area in Square Feet: <code style={{ fontFamily: 'monospace' }}> (Width (in) × Length (in)) / 144</code></li>
            </ol>
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
              padding: '24px',
              minHeight: '220px'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              Conversion Steps & Results
            </span>

            {isValid ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Step 1: Intermediate Inches */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Step A: Conversion to Inches (1" = 25.4mm)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Width (in)</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {conversion.widthIn.toFixed(4)}"
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({widthNum} mm)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Length (in)</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {conversion.lengthIn.toFixed(4)}"
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({lengthNum} mm)</div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Final Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Step B: Final Area Calculation
                  </span>
                  <div style={{ background: 'rgba(6, 182, 212, 0.05)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-header)', color: 'var(--primary)' }}>
                      {conversion.sqFt.toFixed(4)} <span style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-primary)' }}>Sq.Ft.</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'monospace' }}>
                      ({conversion.widthIn.toFixed(3)}" × {conversion.lengthIn.toFixed(3)}") / 144
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 500, minHeight: '100px' }}>
                Enter valid positive dimensions to see conversion steps.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
