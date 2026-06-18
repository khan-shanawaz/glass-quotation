import { NextResponse } from 'next/server';
import { turso } from '@/utils/turso';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function GET() {
  try {
    // 1. Get from Turso
    const profileResult = await turso.execute("SELECT * FROM company_profile LIMIT 1;");
    const quotesResult = await turso.execute("SELECT * FROM saved_quotations;");
    const projectsResult = await turso.execute("SELECT * FROM projects;");
    const customersResult = await turso.execute("SELECT * FROM customers;");
    const categoriesResult = await turso.execute("SELECT * FROM categories;");

    // Format profiles
    let companyProfile = null;
    if (profileResult.rows.length > 0) {
      const row = profileResult.rows[0];
      companyProfile = {
        companyName: String(row.companyName),
        companyAddress: String(row.companyAddress),
        companyPhone: String(row.companyPhone),
        companyEmail: String(row.companyEmail),
        taxRate: Number(row.taxRate),
        logoBase64: String(row.logoBase64 || ''),
        termsAndConditions: String(row.termsAndConditions || ''),
        bankDetails: String(row.bankDetails || ''),
      };
    }

    // Format quotes
    const savedQuotations = quotesResult.rows.map(row => ({
      id: String(row.id),
      quoteNumber: String(row.quoteNumber),
      date: String(row.date),
      customerName: String(row.customerName),
      customerPhone: String(row.customerPhone),
      customerEmail: String(row.customerEmail),
      notes: String(row.notes || ''),
      items: JSON.parse(String(row.items || '[]')),
      discount: Number(row.discount || 0),
      isDiscountFlat: Boolean(row.isDiscountFlat),
      transportCharges: Number(row.transportCharges || 0),
      labourCharges: Number(row.labourCharges || 0),
      isTaxEnabled: Boolean(row.isTaxEnabled),
      summary: JSON.parse(String(row.summary || '{}')),
      isConvertedToProject: Boolean(row.isConvertedToProject),
      sizeHeading: String(row.sizeHeading || 'Size (Sq.Ft.)'),
      unitHeading: String(row.unitHeading || 'Qty (Units)'),
      documentTitle: String(row.documentTitle || 'QUOTATION'),
    }));

    // Format projects
    const projects = projectsResult.rows.map(row => ({
      id: String(row.id),
      quoteId: String(row.quoteId || ''),
      quoteNumber: String(row.quoteNumber || ''),
      customerName: String(row.customerName),
      customerPhone: String(row.customerPhone),
      amount: Number(row.amount || 0),
      status: String(row.status),
      dateCreated: String(row.dateCreated),
      tasks: JSON.parse(String(row.tasks || '[]')),
    }));

    // Format customers
    const customers = customersResult.rows.map(row => ({
      id: String(row.id),
      name: String(row.name),
      phone: String(row.phone),
      email: String(row.email),
      totalOrdersAmount: Number(row.totalOrdersAmount || 0),
      totalQuotationsCount: Number(row.totalQuotationsCount || 0),
      lastActive: String(row.lastActive),
    }));

    // Format categories
    const categories = categoriesResult.rows.map(row => String(row.name));

    return NextResponse.json({
      success: true,
      companyProfile,
      savedQuotations,
      projects,
      customers,
      categories,
    });
  } catch (err: any) {
    console.error('Failed to query Turso:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyProfile, savedQuotations, projects, customers, categories } = body;

    // --- 1. Sync to Turso ---
    if (companyProfile) {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO company_profile (id, companyName, companyAddress, companyPhone, companyEmail, taxRate, logoBase64, termsAndConditions, bankDetails) 
              VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          companyProfile.companyName,
          companyProfile.companyAddress,
          companyProfile.companyPhone,
          companyProfile.companyEmail,
          companyProfile.taxRate,
          companyProfile.logoBase64 || '',
          companyProfile.termsAndConditions || '',
          companyProfile.bankDetails || '',
        ]
      });
    }

    if (savedQuotations && Array.isArray(savedQuotations)) {
      // Clear and re-populate for simplicity
      await turso.execute("DELETE FROM saved_quotations;");
      for (const q of savedQuotations) {
        await turso.execute({
          sql: `INSERT OR REPLACE INTO saved_quotations (id, quoteNumber, date, customerName, customerPhone, customerEmail, notes, items, discount, isDiscountFlat, transportCharges, labourCharges, isTaxEnabled, summary, isConvertedToProject, sizeHeading, unitHeading, documentTitle)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [
            q.id,
            q.quoteNumber,
            q.date,
            q.customerName,
            q.customerPhone,
            q.customerEmail,
            q.notes || '',
            JSON.stringify(q.items),
            q.discount || 0,
            q.isDiscountFlat ? 1 : 0,
            q.transportCharges || 0,
            q.labourCharges || 0,
            q.isTaxEnabled ? 1 : 0,
            JSON.stringify(q.summary),
            q.isConvertedToProject ? 1 : 0,
            q.sizeHeading || 'Size (Sq.Ft.)',
            q.unitHeading || 'Qty (Units)',
            q.documentTitle || 'QUOTATION',
          ]
        });
      }
    }

    if (projects && Array.isArray(projects)) {
      await turso.execute("DELETE FROM projects;");
      for (const p of projects) {
        await turso.execute({
          sql: `INSERT OR REPLACE INTO projects (id, quoteId, quoteNumber, customerName, customerPhone, amount, status, dateCreated, tasks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [p.id, p.quoteId || '', p.quoteNumber || '', p.customerName, p.customerPhone, p.amount || 0, p.status, p.dateCreated, JSON.stringify(p.tasks || [])]
        });
      }
    }

    if (customers && Array.isArray(customers)) {
      await turso.execute("DELETE FROM customers;");
      for (const c of customers) {
        await turso.execute({
          sql: `INSERT OR REPLACE INTO customers (id, name, phone, email, totalOrdersAmount, totalQuotationsCount, lastActive)
                VALUES (?, ?, ?, ?, ?, ?, ?);`,
          args: [c.id, c.name, c.phone, c.email, c.totalOrdersAmount || 0, c.totalQuotationsCount || 0, c.lastActive]
        });
      }
    }

    if (categories && Array.isArray(categories)) {
      await turso.execute("DELETE FROM categories;");
      for (const name of categories) {
        await turso.execute({
          sql: "INSERT OR IGNORE INTO categories (name) VALUES (?);",
          args: [name]
        });
      }
    }

    // --- 2. Sync to Supabase (Non-blocking Try-Catch) ---
    if (supabase) {
      try {
        // Sync Company Profile
        if (companyProfile) {
          await supabase.from('company_profile').upsert({
            id: 'default',
            company_name: companyProfile.companyName,
            company_address: companyProfile.companyAddress,
            company_phone: companyProfile.companyPhone,
            company_email: companyProfile.companyEmail,
            tax_rate: companyProfile.taxRate,
            logo_base64: companyProfile.logoBase64 || '',
            terms_and_conditions: companyProfile.termsAndConditions || '',
            bank_details: companyProfile.bankDetails || '',
          });
        }

        // Sync Quotations
        if (savedQuotations && Array.isArray(savedQuotations)) {
          const formattedQuotes = savedQuotations.map(q => ({
            id: q.id,
            quote_number: q.quoteNumber,
            date: q.date,
            customer_name: q.customerName,
            customer_phone: q.customerPhone,
            customer_email: q.customerEmail,
            notes: q.notes || '',
            items: q.items,
            discount: q.discount || 0,
            is_discount_flat: q.isDiscountFlat,
            transport_charges: q.transportCharges || 0,
            labour_charges: q.labourCharges || 0,
            is_tax_enabled: q.isTaxEnabled,
            summary: q.summary,
            is_converted_to_project: q.isConvertedToProject,
            size_heading: q.sizeHeading || 'Size (Sq.Ft.)',
            unit_heading: q.unitHeading || 'Qty (Units)',
            document_title: q.documentTitle || 'QUOTATION',
          }));
          
          // Truncate and upsert
          await supabase.from('saved_quotations').delete().neq('id', 'dummy');
          if (formattedQuotes.length > 0) {
            await supabase.from('saved_quotations').upsert(formattedQuotes);
          }
        }

        // Sync Projects
        if (projects && Array.isArray(projects)) {
          const formattedProjects = projects.map(p => ({
            id: p.id,
            quote_id: p.quoteId,
            quote_number: p.quoteNumber,
            customer_name: p.customerName,
            customer_phone: p.customerPhone,
            amount: p.amount || 0,
            status: p.status,
            date_created: p.dateCreated,
          }));
          await supabase.from('projects').delete().neq('id', 'dummy');
          if (formattedProjects.length > 0) {
            await supabase.from('projects').upsert(formattedProjects);
          }
        }

        // Sync Customers
        if (customers && Array.isArray(customers)) {
          const formattedCustomers = customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            total_orders_amount: c.totalOrdersAmount || 0,
            total_quotations_count: c.totalQuotationsCount || 0,
            last_active: c.lastActive,
          }));
          await supabase.from('customers').delete().neq('id', 'dummy');
          if (formattedCustomers.length > 0) {
            await supabase.from('customers').upsert(formattedCustomers);
          }
        }

        // Sync Categories
        if (categories && Array.isArray(categories)) {
          const formattedCategories = categories.map(name => ({ name }));
          await supabase.from('categories').delete().neq('name', 'dummy');
          if (formattedCategories.length > 0) {
            await supabase.from('categories').upsert(formattedCategories);
          }
        }
      } catch (sbErr) {
        console.warn('Supabase sync warning (likely tables do not exist yet):', sbErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to sync database:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
