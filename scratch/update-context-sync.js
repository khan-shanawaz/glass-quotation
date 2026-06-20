const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/context/QuotationContext.tsx');
let rawContent = fs.readFileSync(filePath, 'utf8');

// Normalize to LF for replacing
let content = rawContent.replace(/\r\n/g, '\n');

// Replace triggerDBSync
const oldTriggerDBSync = `  // Database sync helper
  const triggerDBSync = async (
    profile = companyProfile,
    quotes = savedQuotations,
    projs = projects,
    custs = customers,
    cats = categories
  ) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyProfile: profile,
          savedQuotations: quotes,
          projects: projs,
          customers: custs,
          categories: cats
        })
      });
    } catch (e) {
      console.error('Failed to post sync to database:', e);
    }
  };`;

const newTriggerDBSync = `  // Database sync helper
  const triggerDBSync = async (
    profile = companyProfile,
    quotes = savedQuotations,
    projs = projects,
    custs = customers,
    cats = categories
  ) => {
    try {
      const customSupabaseUrl = localStorage.getItem('glass_saas_supabase_url') || '';
      const customSupabaseKey = localStorage.getItem('glass_saas_supabase_key') || '';
      const customTursoUrl = localStorage.getItem('glass_saas_turso_url') || '';
      const customTursoToken = localStorage.getItem('glass_saas_turso_token') || '';

      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyProfile: profile,
          savedQuotations: quotes,
          projects: projs,
          customers: custs,
          categories: cats,
          supabaseUrl: customSupabaseUrl,
          supabaseKey: customSupabaseKey,
          tursoUrl: customTursoUrl,
          tursoToken: customTursoToken
        })
      });
    } catch (e) {
      console.error('Failed to post sync to database:', e);
    }
  };`;

if (!content.includes(oldTriggerDBSync)) {
  console.error('Warning: oldTriggerDBSync pattern not found.');
}
content = content.replace(oldTriggerDBSync, newTriggerDBSync);

// Replace syncData
const oldSyncData = `  const syncData = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyProfile,
          savedQuotations,
          projects,
          customers,
          categories
        })
      });
      if (res.ok) {
        setSyncStatus('success');
        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSynced(now);
        setTimeout(() => setSyncStatus('idle'), 3000);
        return true;
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
        return false;
      }
    } catch (e) {
      console.error('Manual sync failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };`;

const newSyncData = `  const syncData = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const customSupabaseUrl = localStorage.getItem('glass_saas_supabase_url') || '';
      const customSupabaseKey = localStorage.getItem('glass_saas_supabase_key') || '';
      const customTursoUrl = localStorage.getItem('glass_saas_turso_url') || '';
      const customTursoToken = localStorage.getItem('glass_saas_turso_token') || '';

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyProfile,
          savedQuotations,
          projects,
          customers,
          categories,
          supabaseUrl: customSupabaseUrl,
          supabaseKey: customSupabaseKey,
          tursoUrl: customTursoUrl,
          tursoToken: customTursoToken
        })
      });
      if (res.ok) {
        setSyncStatus('success');
        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSynced(now);
        setTimeout(() => setSyncStatus('idle'), 3000);
        return true;
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
        return false;
      }
    } catch (e) {
      console.error('Manual sync failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };`;

if (!content.includes(oldSyncData)) {
  console.error('Warning: oldSyncData pattern not found.');
}
content = content.replace(oldSyncData, newSyncData);

// Replace syncFromDB fetch URL
const oldSyncFromDB = `    // Background sync from Turso/Supabase cloud DB
    const syncFromDB = async () => {
      try {
        const res = await fetch('/api/sync');`;

const newSyncFromDB = `    // Background sync from Turso/Supabase cloud DB
    const syncFromDB = async () => {
      try {
        const customSupabaseUrl = localStorage.getItem('glass_saas_supabase_url') || '';
        const customSupabaseKey = localStorage.getItem('glass_saas_supabase_key') || '';
        const customTursoUrl = localStorage.getItem('glass_saas_turso_url') || '';
        const customTursoToken = localStorage.getItem('glass_saas_turso_token') || '';

        const urlParams = new URLSearchParams();
        if (customSupabaseUrl) urlParams.append('supabaseUrl', customSupabaseUrl);
        if (customSupabaseKey) urlParams.append('supabaseKey', customSupabaseKey);
        if (customTursoUrl) urlParams.append('tursoUrl', customTursoUrl);
        if (customTursoToken) urlParams.append('tursoToken', customTursoToken);

        const res = await fetch(\`/api/sync?\${urlParams.toString()}\`);`;

if (!content.includes(oldSyncFromDB)) {
  console.error('Warning: oldSyncFromDB pattern not found.');
}
content = content.replace(oldSyncFromDB, newSyncFromDB);

// Convert back to CRLF if the original file had it
if (rawContent.includes('\r\n')) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated sync functions in QuotationContext.tsx with line ending awareness!');
