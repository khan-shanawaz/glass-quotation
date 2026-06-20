const fs = require('fs');
const path = require('path');

const supUrl = 'https://rdeoheklhcwccixwaeox.supabase.co';
const supKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZW9oZWtsaGN3Y2NpeHdhZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDQxNjEsImV4cCI6MjA5NjgyMDE2MX0.dLgKJ8Ay7zo91K4vyXC2uKMuAKhzj8rUPUb3b7PBKoA';
const turUrl = 'libsql://glassquote-khan-shanawaz.aws-ap-south-1.turso.io';
const turTok = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEzMzE5MDAsImlkIjoiMDE5ZWJmYTctODYwMS03ODBkLTgwMzgtMTBhMjU2NTNmZDY4IiwicmlkIjoiZjBhN2M4MTMtMTgyYS00YzRjLTg1ZjEtMjZlNWRmMjJhNjdkIn0.-XJMdBrnP9jumN18a7yNIKsHfD0QZMkWf787iEAi0bN_tQtB8qBAbF-dKWAZyZIkV7p8cI--JQHpZd10PWbWCA';

// 1. Update settings/page.tsx
const settingsPath = path.join(__dirname, '../src/app/settings/page.tsx');
let settingsContent = fs.readFileSync(settingsPath, 'utf8');
let settingsLF = settingsContent.replace(/\r\n/g, '\n');

const oldSettingsInit = `    // Load custom database credentials from localStorage
    setSupabaseUrl(localStorage.getItem('glass_saas_supabase_url') || '');
    setSupabaseKey(localStorage.getItem('glass_saas_supabase_key') || '');
    setTursoUrl(localStorage.getItem('glass_saas_turso_url') || '');
    setTursoToken(localStorage.getItem('glass_saas_turso_token') || '');`;

const newSettingsInit = `    // Load custom database credentials from localStorage
    setSupabaseUrl(localStorage.getItem('glass_saas_supabase_url') || '${supUrl}');
    setSupabaseKey(localStorage.getItem('glass_saas_supabase_key') || '${supKey}');
    setTursoUrl(localStorage.getItem('glass_saas_turso_url') || '${turUrl}');
    setTursoToken(localStorage.getItem('glass_saas_turso_token') || '${turTok}');`;

if (settingsLF.includes(oldSettingsInit)) {
  settingsLF = settingsLF.replace(oldSettingsInit, newSettingsInit);
  if (settingsContent.includes('\r\n')) {
    settingsLF = settingsLF.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(settingsPath, settingsLF, 'utf8');
  console.log('Successfully updated settings/page.tsx with default credentials!');
} else {
  console.error('Error: Could not find credentials initialization in settings/page.tsx.');
}

// 2. Update context/QuotationContext.tsx
const contextPath = path.join(__dirname, '../src/context/QuotationContext.tsx');
let contextContent = fs.readFileSync(contextPath, 'utf8');
let contextLF = contextContent.replace(/\r\n/g, '\n');

const oldContextCreds = `      const customSupabaseUrl = localStorage.getItem('glass_saas_supabase_url') || '';
      const customSupabaseKey = localStorage.getItem('glass_saas_supabase_key') || '';
      const customTursoUrl = localStorage.getItem('glass_saas_turso_url') || '';
      const customTursoToken = localStorage.getItem('glass_saas_turso_token') || '';`;

const newContextCreds = `      const customSupabaseUrl = localStorage.getItem('glass_saas_supabase_url') || '${supUrl}';
      const customSupabaseKey = localStorage.getItem('glass_saas_supabase_key') || '${supKey}';
      const customTursoUrl = localStorage.getItem('glass_saas_turso_url') || '${turUrl}';
      const customTursoToken = localStorage.getItem('glass_saas_turso_token') || '${turTok}';`;

if (contextLF.includes(oldContextCreds)) {
  // Replace all occurrences of these lines (they are in triggerDBSync, syncData, and syncFromDB)
  contextLF = contextLF.split(oldContextCreds).join(newContextCreds);
  if (contextContent.includes('\r\n')) {
    contextLF = contextLF.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(contextPath, contextLF, 'utf8');
  console.log('Successfully updated QuotationContext.tsx with default credentials!');
} else {
  console.error('Error: Could not find credentials initialization in QuotationContext.tsx.');
}

process.exit(0);
