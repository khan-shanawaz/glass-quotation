const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

const url = 'libsql://glassquote-khan-shanawaz.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODEzMzE5MDAsImlkIjoiMDE5ZWJmYTctODYwMS03ODBkLTgwMzgtMTBhMjU2NTNmZDY4IiwicmlkIjoiZjBhN2M4MTMtMTgyYS00YzRjLTg1ZjEtMjZlNWRmMjJhNjdkIn0.-XJMdBrnP9jumN18a7yNIKsHfD0QZMkWf787iEAi0bN_tQtB8qBAbF-dKWAZyZIkV7p8cI--JQHpZd10PWbWCA';

const client = createClient({ url, authToken });

async function main() {
  try {
    const profileRes = await client.execute('SELECT * FROM company_profile LIMIT 1;');
    if (profileRes.rows.length === 0) {
      console.error('No company profile found in database.');
      return;
    }
    const profile = profileRes.rows[0];

    const categoriesRes = await client.execute('SELECT * FROM categories;');
    const categories = categoriesRes.rows.map(row => String(row.name));

    const filePath = path.join(__dirname, '../src/context/QuotationContext.tsx');
    let content = fs.readFileSync(filePath, 'utf8');

    // Build the new DEFAULT_COMPANY_PROFILE
    const newProfile = `const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: ${JSON.stringify(profile.companyName)},
  companyAddress: ${JSON.stringify(profile.companyAddress)},
  companyPhone: ${JSON.stringify(profile.companyPhone)},
  companyEmail: ${JSON.stringify(profile.companyEmail)},
  taxRate: ${Number(profile.taxRate)},
  logoBase64: ${JSON.stringify(profile.logoBase64 || '')},
  termsAndConditions: ${JSON.stringify(profile.termsAndConditions || '')},
  bankDetails: ${JSON.stringify(profile.bankDetails || '')},
};`;

    // Regex match to replace DEFAULT_COMPANY_PROFILE
    content = content.replace(/const DEFAULT_COMPANY_PROFILE: CompanyProfile = {[\s\S]*?};/g, newProfile);

    // Build new default categories array
    const newCategoriesState = `const [categories, setCategories] = useState<string[]>(${JSON.stringify(categories)});`;
    content = content.replace(/const \[categories, setCategories\] = useState<string\[\]>\(\[[\s\S]*?\]\);/g, newCategoriesState);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated QuotationContext.tsx with database defaults!');
  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    process.exit(0);
  }
}

main();
