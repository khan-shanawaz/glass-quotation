'use client';

import React, { useState, useEffect } from 'react';

// Interfaces for State Management
interface CustomCalculator {
  id: string;
  name: string;
  formula: string;
  variables: string[];
  variableUnits: Record<string, string>;
  outputUnit: string;
}

interface CustomConverter {
  id: string;
  name: string;
  fromUnit: string;
  toUnit: string;
  factor: number;
}

type TabType = 'calculators' | 'converters';

// Default / Initial Toolkit Templates
const initialCalculators: CustomCalculator[] = [
  {
    id: 'calc_default_1',
    name: 'Glass Area Calculator',
    formula: 'width * height',
    variables: ['width', 'height'],
    variableUnits: { width: 'inches', height: 'inches' },
    outputUnit: 'sq.in'
  },
  {
    id: 'calc_default_2',
    name: 'Glass Weight Estimator',
    formula: 'area * thickness * 2.5',
    variables: ['area', 'thickness'],
    variableUnits: { area: 'sq.m', thickness: 'mm' },
    outputUnit: 'kg'
  }
];

const initialConverters: CustomConverter[] = [
  {
    id: 'conv_default_1',
    name: 'Inches to MM',
    fromUnit: 'inch',
    toUnit: 'mm',
    factor: 25.4
  },
  {
    id: 'conv_default_2',
    name: 'MM to Inches',
    fromUnit: 'mm',
    toUnit: 'inch',
    factor: 0.0393701
  },
  {
    id: 'conv_default_3',
    name: 'KG to LBS',
    fromUnit: 'kg',
    toUnit: 'lbs',
    factor: 2.20462
  }
];

export default function MeasurementsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calculators');

  // Core Data States
  const [calculators, setCalculators] = useState<CustomCalculator[]>([]);
  const [converters, setConverters] = useState<CustomConverter[]>([]);

  // Interaction Transient States
  // Tracks user input values for each dynamic calculator: { [calculatorId]: { [varName]: "value" } }
  const [calcInputs, setCalcInputs] = useState<Record<string, Record<string, string>>>({});
  // Tracks bidirectional input values for each converter: { [converterId]: { from: "val", to: "val" } }
  const [convInputs, setConvInputs] = useState<Record<string, { from: string; to: string }>>({});

  // Calculator Creator Form States
  const [calcName, setCalcName] = useState('');
  const [calcFormula, setCalcFormula] = useState('');
  const [calcOutputUnit, setCalcOutputUnit] = useState('units');
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [varUnits, setVarUnits] = useState<Record<string, string>>({});

  // Converter Creator Form States
  const [convName, setConvName] = useState('');
  const [convFromUnit, setConvFromUnit] = useState('');
  const [convToUnit, setConvToUnit] = useState('');
  const [convFactor, setConvFactor] = useState('');

  // 1. Load Initial Data from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCalcs = localStorage.getItem('glassflow_custom_calculators');
      const storedConvs = localStorage.getItem('glassflow_custom_converters');

      if (storedCalcs) {
        setCalculators(JSON.parse(storedCalcs));
      } else {
        setCalculators(initialCalculators);
        localStorage.setItem('glassflow_custom_calculators', JSON.stringify(initialCalculators));
      }

      if (storedConvs) {
        setConverters(JSON.parse(storedConvs));
      } else {
        setConverters(initialConverters);
        localStorage.setItem('glassflow_custom_converters', JSON.stringify(initialConverters));
      }
    }
  }, []);

  // 2. Variable Extraction Logic (for Calculator Builder)
  useEffect(() => {
    // Extract words/variables starting with alphabet
    const matches = calcFormula.match(/[a-zA-Z][a-zA-Z0-9]*/g) || [];
    // Filter out standard javascript / math keywords to prevent collisions
    const mathKeywords = ['sin', 'cos', 'tan', 'pow', 'sqrt', 'PI', 'pi', 'min', 'max', 'abs', 'round', 'floor', 'ceil'];
    const uniqueVars = Array.from(new Set(matches)).filter(v => !mathKeywords.includes(v));

    setDetectedVars(uniqueVars);

    // Initialize units for newly detected variables to empty or keep existing ones
    setVarUnits(prev => {
      const updated: Record<string, string> = {};
      uniqueVars.forEach(v => {
        updated[v] = prev[v] || 'mm'; // default unit
      });
      return updated;
    });
  }, [calcFormula]);

  // 3. Save Calculator to State & Storage
  const handleSaveCalculator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcName.trim()) return alert('Please enter a tool name.');
    if (!calcFormula.trim()) return alert('Please enter a formula.');

    const newCalculator: CustomCalculator = {
      id: `calc_${Date.now()}`,
      name: calcName.trim(),
      formula: calcFormula.trim(),
      variables: detectedVars,
      variableUnits: varUnits,
      outputUnit: calcOutputUnit.trim() || 'units'
    };

    const updated = [...calculators, newCalculator];
    setCalculators(updated);
    localStorage.setItem('glassflow_custom_calculators', JSON.stringify(updated));

    // Reset Form
    setCalcName('');
    setCalcFormula('');
    setCalcOutputUnit('units');
    setDetectedVars([]);
    setVarUnits({});
  };

  // 4. Delete Calculator
  const handleDeleteCalculator = (id: string) => {
    if (confirm('Are you sure you want to delete this custom calculator?')) {
      const updated = calculators.filter(c => c.id !== id);
      setCalculators(updated);
      localStorage.setItem('glassflow_custom_calculators', JSON.stringify(updated));
    }
  };

  // 5. Save Converter to State & Storage
  const handleSaveConverter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convName.trim()) return alert('Please enter a tool name.');
    if (!convFromUnit.trim()) return alert('Please enter the source "From" unit.');
    if (!convToUnit.trim()) return alert('Please enter the target "To" unit.');
    const factorNum = parseFloat(convFactor);
    if (isNaN(factorNum) || factorNum <= 0) {
      return alert('Please enter a valid positive numerical conversion multiplier.');
    }

    const newConverter: CustomConverter = {
      id: `conv_${Date.now()}`,
      name: convName.trim(),
      fromUnit: convFromUnit.trim(),
      toUnit: convToUnit.trim(),
      factor: factorNum
    };

    const updated = [...converters, newConverter];
    setConverters(updated);
    localStorage.setItem('glassflow_custom_converters', JSON.stringify(updated));

    // Reset Form
    setConvName('');
    setConvFromUnit('');
    setConvToUnit('');
    setConvFactor('');
  };

  // 6. Delete Converter
  const handleDeleteConverter = (id: string) => {
    if (confirm('Are you sure you want to delete this conversion tool?')) {
      const updated = converters.filter(c => c.id !== id);
      setConverters(updated);
      localStorage.setItem('glassflow_custom_converters', JSON.stringify(updated));
    }
  };

  // 7. Secure Calculation Evaluation Helper
  const evaluateCalculatorResult = (calc: CustomCalculator): string => {
    const inputs = calcInputs[calc.id] || {};
    let parsedFormula = calc.formula;

    // Substitute variable values into the formula string
    calc.variables.forEach(v => {
      const val = parseFloat(inputs[v] || '0') || 0;
      parsedFormula = parsedFormula.replace(new RegExp('\\b' + v + '\\b', 'g'), val.toString());
    });

    // Substitute mathematical functions
    const mathKeys = ['sin', 'cos', 'tan', 'pow', 'sqrt', 'min', 'max', 'abs', 'round', 'floor', 'ceil'];
    mathKeys.forEach(k => {
      parsedFormula = parsedFormula.replace(new RegExp('\\b' + k + '\\b', 'g'), `Math.${k}`);
    });
    parsedFormula = parsedFormula.replace(/\b(pi|PI)\b/g, 'Math.PI');

    // Strict validation regex checking for malicious or unexpected JS symbols
    // Allow digits, spaces, math operators, decimals, brackets, %, and Math object variables.
    const sanitized = parsedFormula.replace(/Math\.[a-z]+/g, '').replace(/[0-9\s\+\-\*\/\(\)\.\%]/g, '');
    if (sanitized.trim().length > 0) {
      return 'Invalid Symbols';
    }

    try {
      const evalFunc = new Function(`return (${parsedFormula})`);
      const result = evalFunc();
      return typeof result === 'number' && !isNaN(result) && isFinite(result)
        ? parseFloat(result.toFixed(4)).toString()
        : '0';
    } catch {
      return 'Formula Error';
    }
  };

  // 8. Bidirectional Converter Update Handler
  const handleConverterChange = (convId: string, value: string, direction: 'forward' | 'reverse', factor: number) => {
    const numericValue = value === '' ? '' : parseFloat(value);
    
    if (numericValue === '') {
      setConvInputs(prev => ({
        ...prev,
        [convId]: { from: '', to: '' }
      }));
      return;
    }

    if (isNaN(numericValue as number)) return;

    if (direction === 'forward') {
      const targetVal = (numericValue as number) * factor;
      setConvInputs(prev => ({
        ...prev,
        [convId]: {
          from: value,
          to: parseFloat(targetVal.toFixed(5)).toString()
        }
      }));
    } else {
      const sourceVal = (numericValue as number) / factor;
      setConvInputs(prev => ({
        ...prev,
        [convId]: {
          from: parseFloat(sourceVal.toFixed(5)).toString(),
          to: value
        }
      }));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="header-container no-print">
        <div>
          <h1>Measurements Custom Toolkit</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Build custom dynamic mathematical calculators and metric-imperial conversion tools on the fly.
          </p>
        </div>
      </div>

      {/* Tabs Menu Row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }} className="no-print">
        <button
          type="button"
          onClick={() => setActiveTab('calculators')}
          className={`btn ${activeTab === 'calculators' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 24px', fontSize: '0.85rem' }}
        >
          📐 Custom Calculators
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('converters')}
          className={`btn ${activeTab === 'converters' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 24px', fontSize: '0.85rem' }}
        >
          🔄 Converter Creators
        </button>
      </div>

      {/* TAB 1: Custom Calculators */}
      {activeTab === 'calculators' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Creator form (Left Column) */}
          <div className="glass-panel" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              Create Calculation Tool
            </h3>
            <form onSubmit={handleSaveCalculator}>
              
              <div className="form-group">
                <label className="form-label">Tool Name</label>
                <input
                  type="text"
                  placeholder="e.g., Glass Diagonal Area"
                  className="form-input"
                  value={calcName}
                  onChange={(e) => setCalcName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Formula Box</label>
                <input
                  type="text"
                  placeholder="e.g., sqrt(width*width + height*height)"
                  className="form-input font-mono"
                  style={{ letterSpacing: '0.05em' }}
                  value={calcFormula}
                  onChange={(e) => setCalcFormula(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', lineHeight: '1.3' }}>
                  Use variables like `width`, `height`, `value1`. Supports operators (+, -, *, /, %) and math functions like `sqrt`, `pow`, `sin`, `cos`, `PI`.
                </small>
              </div>

              {/* Dynamic Variable Unit Assignments */}
              {detectedVars.length > 0 && (
                <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
                    Detected Variables & Assigned Units
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detectedVars.map(v => (
                      <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '90px', textOverflow: 'ellipsis', overflow: 'hidden' }}>{v}:</span>
                        <input
                          type="text"
                          placeholder="Unit (e.g., mm, in)"
                          className="form-input"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1 }}
                          value={varUnits[v] || ''}
                          onChange={(e) => setVarUnits(prev => ({ ...prev, [v]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Result Output Unit</label>
                <input
                  type="text"
                  placeholder="e.g., sqm, kg, inches"
                  className="form-input"
                  style={{ maxWidth: '180px' }}
                  value={calcOutputUnit}
                  onChange={(e) => setCalcOutputUnit(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Generate Calculator Tool
              </button>
            </form>
          </div>

          {/* Active Calculators Grid (Right Column) */}
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Active Calculation Tools</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                {calculators.length} templates
              </span>
            </h3>

            {calculators.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active calculator tools. Create one using the form on the left.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {calculators.map(calc => {
                  const result = evaluateCalculatorResult(calc);
                  return (
                    <div key={calc.id} className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                      
                      <div>
                        {/* Title and Delete button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                          <div>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>{calc.name}</h4>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                              Formula: {calc.formula}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCalculator(calc.id)}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.65rem', borderRadius: '4px' }}
                            title="Delete tool"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Input Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {calc.variables.map(v => (
                            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 500, width: '70px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {v}
                              </span>
                              <input
                                type="number"
                                className="form-input"
                                style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
                                placeholder="0"
                                value={calcInputs[calc.id]?.[v] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCalcInputs(prev => ({
                                    ...prev,
                                    [calc.id]: {
                                      ...(prev[calc.id] || {}),
                                      [v]: val
                                    }
                                  }));
                                }}
                              />
                              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '0.75rem', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>
                                {calc.variableUnits[v] || ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Output Result panel */}
                      <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)', width: '70px' }}>Result:</span>
                        <div style={{
                          flex: 1,
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: 'var(--success)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          boxShadow: '0 0 10px rgba(16, 185, 129, 0.05)'
                        }}>
                          {result}
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '0.75rem', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>
                          {calc.outputUnit}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Converter Creators */}
      {activeTab === 'converters' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Creator Form (Left Column) */}
          <div className="glass-panel" style={{ position: 'sticky', top: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              Create Conversion Tool
            </h3>
            <form onSubmit={handleSaveConverter}>
              
              <div className="form-group">
                <label className="form-label">Tool Name</label>
                <input
                  type="text"
                  placeholder="e.g., Inches to MM Converter"
                  className="form-input"
                  value={convName}
                  onChange={(e) => setConvName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">From Unit</label>
                  <input
                    type="text"
                    placeholder="e.g., inch"
                    className="form-input"
                    value={convFromUnit}
                    onChange={(e) => setConvFromUnit(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">To Unit</label>
                  <input
                    type="text"
                    placeholder="e.g., mm"
                    className="form-input"
                    value={convToUnit}
                    onChange={(e) => setConvToUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Multiplication Factor</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g., 25.4"
                  className="form-input font-mono"
                  value={convFactor}
                  onChange={(e) => setConvFactor(e.target.value)}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', lineHeight: '1.3' }}>
                  Value in `To` units = Value in `From` units × Factor.
                </small>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Generate Converter Tool
              </button>
            </form>
          </div>

          {/* Active Converters Grid (Right Column) */}
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Active Conversion Tools</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                {converters.length} templates
              </span>
            </h3>

            {converters.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active converter tools. Create one using the form on the left.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {converters.map(conv => {
                  const values = convInputs[conv.id] || { from: '', to: '' };
                  return (
                    <div key={conv.id} className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      
                      {/* Title Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>{conv.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Factor multiplier: {conv.factor}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteConverter(conv.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.65rem', borderRadius: '4px' }}
                          title="Delete tool"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Bidirectional Inputs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* Source Box */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            placeholder="0"
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
                            value={values.from}
                            onChange={(e) => handleConverterChange(conv.id, e.target.value, 'forward', conv.factor)}
                          />
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '0.75rem', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>
                            {conv.fromUnit}
                          </div>
                        </div>

                        {/* Bidirectional Arrow Icon */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '-4px 0', color: 'var(--text-muted)', fontSize: '0.7rem', gap: '6px' }}>
                          <span>▲</span>
                          <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>convert</span>
                          <span>▼</span>
                        </div>

                        {/* Target Box */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            placeholder="0"
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
                            value={values.to}
                            onChange={(e) => handleConverterChange(conv.id, e.target.value, 'reverse', conv.factor)}
                          />
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontSize: '0.75rem', width: '80px', textAlign: 'center', fontWeight: 'bold' }}>
                            {conv.toUnit}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
