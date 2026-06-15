'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GlassItemInput,
  QuoteSummary,
  calculateQuoteSummary
} from '@/utils/calculator';

export interface DraftQuotation {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  items: Array<Omit<GlassItemInput, 'id'> & { id?: string }>;
  discount: number;
  isDiscountFlat: boolean;
  transportCharges: number;
  labourCharges: number;
  isTaxEnabled?: boolean;
  sizeHeading?: string;
  unitHeading?: string;
}

export interface SavedQuotation {
  id: string;
  quoteNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  items: GlassItemInput[];
  discount: number;
  isDiscountFlat: boolean;
  transportCharges: number;
  labourCharges: number;
  isTaxEnabled?: boolean;
  summary: QuoteSummary;
  isConvertedToProject: boolean;
  sizeHeading?: string;
  unitHeading?: string;
  documentTitle?: string;
}

export type ProjectStatus = 'planning' | 'production' | 'delivery' | 'installed' | 'completed';

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  dateCreated: string;
}

export interface ProjectItem {
  id: string;
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: ProjectStatus;
  dateCreated: string;
  tasks?: ProjectTask[];
}

export interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrdersAmount: number;
  totalQuotationsCount: number;
  lastActive: string;
}

export interface CompanyProfile {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRate: number; // default 18% GST in India
  logoBase64: string; // Base64 logo data
  termsAndConditions: string;
  bankDetails?: string;
}

interface QuotationContextType {
  draft: DraftQuotation;
  savedQuotations: SavedQuotation[];
  projects: ProjectItem[];
  customers: CustomerItem[];
  companyProfile: CompanyProfile;
  updateDraftInfo: (info: Partial<Omit<DraftQuotation, 'items'>>) => void;
  addDraftItem: (item: Omit<GlassItemInput, 'id'>) => void;
  updateDraftItem: (id: string, item: Partial<GlassItemInput>) => void;
  removeDraftItem: (id: string) => void;
  clearDraft: () => void;
  saveQuotation: () => SavedQuotation;
  deleteQuotation: (id: string) => void;
  updateQuotation: (id: string, fields: Partial<SavedQuotation>) => void;
  convertQuoteToProject: (quoteId: string) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  deleteProject: (projectId: string) => void;
  addProject: (customerName: string, customerPhone: string, amount: number, status: ProjectStatus) => void;
  addProjectTask: (projectId: string, taskTitle: string, status: ProjectStatus) => void;
  updateProjectTaskStatus: (projectId: string, taskId: string, newStatus: ProjectStatus) => void;
  deleteProjectTask: (projectId: string, taskId: string) => void;
  categories: string[];
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  updateCategory: (index: number, newName: string) => void;
  updateCompanyProfile: (profile: CompanyProfile) => void;
  resetCompanyProfile: () => void;
  importQuotations: (quotes: SavedQuotation[]) => void;
  importProjects: (projects: ProjectItem[]) => void;
  importCustomers: (customers: CustomerItem[]) => void;
}

const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'GlassFlow Solutions',
  companyAddress: 'Plot 42, GIDC Industrial Estate, Sector 26, Gandhinagar, Gujarat - 382028',
  companyPhone: '+91 98765 43210',
  companyEmail: 'info@glassflow.in',
  taxRate: 18, // 18% GST
  logoBase64: '',
  termsAndConditions: '1. Price is ex-factory. Transportation and installation/labour charges are extra.\n2. 50% advance along with order purchase, balance 50% before delivery.\n3. Goods once sold will not be taken back or exchanged.\n4. Glass breakage after delivery is not our responsibility.\n5. Any disputes are subject to local jurisdiction only.',
  bankDetails: 'Bank Name: State Bank of India\nAccount No: 123456789012\nIFSC Code: SBIN0001234\nBranch: Gandhinagar',
};

const INITIAL_DRAFT: DraftQuotation = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
  items: [],
  discount: 0,
  isDiscountFlat: false,
  transportCharges: 0,
  labourCharges: 0,
  isTaxEnabled: true,
  sizeHeading: 'Size (Sq.Ft.)',
  unitHeading: 'Qty (Units)',
};

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export const QuotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<DraftQuotation>(INITIAL_DRAFT);
  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [categories, setCategories] = useState<string[]>(['door', 'window', 'mirror', 'frame', 'custom']);

  // Database sync helper
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
  };

  // Load state from localStorage on client-side mount and sync from DB
  useEffect(() => {
    const localDraft = localStorage.getItem('glass_saas_draft');
    const localSaved = localStorage.getItem('glass_saas_saved');
    const localProjects = localStorage.getItem('glass_saas_projects');
    const localCustomers = localStorage.getItem('glass_saas_customers');
    const localProfile = localStorage.getItem('glass_saas_profile');
    const localCategories = localStorage.getItem('glass_saas_categories');

    if (localDraft) {
      try { setDraft(JSON.parse(localDraft)); } catch (e) { console.error(e); }
    }
    if (localSaved) {
      try { setSavedQuotations(JSON.parse(localSaved)); } catch (e) { console.error(e); }
    }
    if (localProjects) {
      try { setProjects(JSON.parse(localProjects)); } catch (e) { console.error(e); }
    }
    if (localCustomers) {
      try { setCustomers(JSON.parse(localCustomers)); } catch (e) { console.error(e); }
    }
    if (localProfile) {
      try { setCompanyProfile(JSON.parse(localProfile)); } catch (e) { console.error(e); }
    }
    if (localCategories) {
      try { setCategories(JSON.parse(localCategories)); } catch (e) { console.error(e); }
    }

    // Background sync from Turso/Supabase cloud DB
    const syncFromDB = async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (data.companyProfile) {
              setCompanyProfile(data.companyProfile);
              localStorage.setItem('glass_saas_profile', JSON.stringify(data.companyProfile));
            }
            if (data.savedQuotations && data.savedQuotations.length > 0) {
              setSavedQuotations(data.savedQuotations);
              localStorage.setItem('glass_saas_saved', JSON.stringify(data.savedQuotations));
            }
            if (data.projects && data.projects.length > 0) {
              setProjects(data.projects);
              localStorage.setItem('glass_saas_projects', JSON.stringify(data.projects));
            }
            if (data.customers && data.customers.length > 0) {
              setCustomers(data.customers);
              localStorage.setItem('glass_saas_customers', JSON.stringify(data.customers));
            }
            if (data.categories && data.categories.length > 0) {
              setCategories(data.categories);
              localStorage.setItem('glass_saas_categories', JSON.stringify(data.categories));
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync from database:', err);
      }
    };
    syncFromDB();
  }, []);

  // Save updates to localStorage helper functions
  const saveLocalDraft = (newDraft: DraftQuotation) => {
    localStorage.setItem('glass_saas_draft', JSON.stringify(newDraft));
  };

  const saveLocalSaved = (newSaved: SavedQuotation[]) => {
    localStorage.setItem('glass_saas_saved', JSON.stringify(newSaved));
  };

  const saveLocalProjects = (newProj: ProjectItem[]) => {
    localStorage.setItem('glass_saas_projects', JSON.stringify(newProj));
  };

  const saveLocalCustomers = (newCust: CustomerItem[]) => {
    localStorage.setItem('glass_saas_customers', JSON.stringify(newCust));
  };

  const saveLocalProfile = (newProfile: CompanyProfile) => {
    localStorage.setItem('glass_saas_profile', JSON.stringify(newProfile));
  };

  const saveLocalCategories = (newCats: string[]) => {
    localStorage.setItem('glass_saas_categories', JSON.stringify(newCats));
  };

  const updateDraftInfo = (info: Partial<Omit<DraftQuotation, 'items'>>) => {
    setDraft((prev) => {
      const updated = { ...prev, ...info };
      saveLocalDraft(updated);
      return updated;
    });
  };

  const addDraftItem = (item: Omit<GlassItemInput, 'id'>) => {
    setDraft((prev) => {
      const newItem = {
        ...item,
        id: Math.random().toString(36).substring(7),
      };
      const updated = {
        ...prev,
        items: [...prev.items, newItem],
      };
      saveLocalDraft(updated);
      return updated;
    });
  };

  const updateDraftItem = (id: string, updatedFields: Partial<GlassItemInput>) => {
    setDraft((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id) {
          return { ...item, ...updatedFields };
        }
        return item;
      });
      const updated = { ...prev, items: updatedItems };
      saveLocalDraft(updated);
      return updated;
    });
  };

  const removeDraftItem = (id: string) => {
    setDraft((prev) => {
      const updatedItems = prev.items.filter((item) => item.id !== id);
      const updated = { ...prev, items: updatedItems };
      saveLocalDraft(updated);
      return updated;
    });
  };

  const clearDraft = () => {
    setDraft(INITIAL_DRAFT);
    localStorage.removeItem('glass_saas_draft');
  };

  const saveQuotation = (): SavedQuotation => {
    // Generate pricing summary using current profile's tax rate
    const summary = calculateQuoteSummary(
      draft.items as GlassItemInput[],
      draft.isTaxEnabled !== false ? companyProfile.taxRate : 0,
      draft.discount,
      draft.isDiscountFlat,
      draft.transportCharges,
      draft.labourCharges
    );

    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const quoteNumber = `GQ-${year}-${rand}`;
    
    const quoteDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newQuote: SavedQuotation = {
      id: Math.random().toString(36).substring(7),
      quoteNumber,
      date: quoteDate,
      customerName: draft.customerName || 'Walk-in Customer',
      customerPhone: draft.customerPhone || 'N/A',
      customerEmail: draft.customerEmail || 'N/A',
      notes: draft.notes,
      items: draft.items as GlassItemInput[],
      discount: draft.discount,
      isDiscountFlat: draft.isDiscountFlat,
      transportCharges: draft.transportCharges,
      labourCharges: draft.labourCharges,
      isTaxEnabled: draft.isTaxEnabled !== false,
      summary,
      isConvertedToProject: false,
      sizeHeading: draft.sizeHeading || 'Size (Sq.Ft.)',
      unitHeading: draft.unitHeading || 'Qty (Units)',
    };

    // 1. Update Invoices State
    const updatedQuotes = [newQuote, ...savedQuotations];
    setSavedQuotations(updatedQuotes);
    saveLocalSaved(updatedQuotes);

    // 2. Proactively Upsert Customer Logs in customer records
    const phoneKey = newQuote.customerPhone.trim();
    let finalCustomers = customers;
    setCustomers((prevCustomers) => {
      const existsIndex = prevCustomers.findIndex(
        (c) => c.phone.trim() === phoneKey && phoneKey !== 'N/A'
      );
      
      const updatedCustomersList = [...prevCustomers];
      
      if (existsIndex >= 0) {
        // Update existing client stats
        const existing = prevCustomers[existsIndex];
        updatedCustomersList[existsIndex] = {
          ...existing,
          name: newQuote.customerName, // use latest spelling
          email: newQuote.customerEmail !== 'N/A' ? newQuote.customerEmail : existing.email,
          totalQuotationsCount: existing.totalQuotationsCount + 1,
          lastActive: quoteDate.split(',')[0],
        };
      } else {
        // Register a new customer
        updatedCustomersList.unshift({
          id: Math.random().toString(36).substring(7),
          name: newQuote.customerName,
          phone: newQuote.customerPhone,
          email: newQuote.customerEmail,
          totalOrdersAmount: 0,
          totalQuotationsCount: 1,
          lastActive: quoteDate.split(',')[0],
        });
      }
      
      saveLocalCustomers(updatedCustomersList);
      finalCustomers = updatedCustomersList;
      return updatedCustomersList;
    });

    // Clear estimator draft values
    clearDraft();
    
    // Sync to DB
    triggerDBSync(companyProfile, updatedQuotes, projects, finalCustomers, categories);

    return newQuote;
  };

  const deleteQuotation = (id: string) => {
    const updated = savedQuotations.filter((q) => q.id !== id);
    setSavedQuotations(updated);
    saveLocalSaved(updated);
    triggerDBSync(companyProfile, updated, projects, customers, categories);
  };

  const updateQuotation = (id: string, updatedFields: Partial<SavedQuotation>) => {
    setSavedQuotations((prev) => {
      const updatedList = prev.map((quote) => {
        if (quote.id === id) {
          const mergedQuote = { ...quote, ...updatedFields };
          
          // Re-calculate pricing summary using standard parameters
          const summary = calculateQuoteSummary(
            mergedQuote.items,
            mergedQuote.isTaxEnabled !== false ? companyProfile.taxRate : 0,
            mergedQuote.discount,
            mergedQuote.isDiscountFlat,
            mergedQuote.transportCharges,
            mergedQuote.labourCharges
          );
          
          return {
            ...mergedQuote,
            summary
          };
        }
        return quote;
      });
      saveLocalSaved(updatedList);
      triggerDBSync(companyProfile, updatedList, projects, customers, categories);
      return updatedList;
    });
  };

  const convertQuoteToProject = (quoteId: string) => {
    const quoteIndex = savedQuotations.findIndex((q) => q.id === quoteId);
    if (quoteIndex < 0) return;

    const quote = savedQuotations[quoteIndex];
    if (quote.isConvertedToProject) return;

    // Mark quotation as converted
    const updatedQuotes = [...savedQuotations];
    updatedQuotes[quoteIndex] = {
      ...quote,
      isConvertedToProject: true,
    };
    setSavedQuotations(updatedQuotes);
    saveLocalSaved(updatedQuotes);

    // Add new Project Item
    const newProjItem: ProjectItem = {
      id: Math.random().toString(36).substring(7),
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      amount: quote.summary.grandTotal,
      status: 'planning',
      dateCreated: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      tasks: [],
    };

    const updatedProjectsList = [newProjItem, ...projects];
    setProjects(updatedProjectsList);
    saveLocalProjects(updatedProjectsList);

    // Update customer revenue records
    let finalCustomers = customers;
    setCustomers((prevCustomers) => {
      const updatedCustomersList = prevCustomers.map((c) => {
        if (c.phone.trim() === quote.customerPhone.trim() && quote.customerPhone !== 'N/A') {
          return {
            ...c,
            totalOrdersAmount: c.totalOrdersAmount + quote.summary.grandTotal,
          };
        }
        return c;
      });
      saveLocalCustomers(updatedCustomersList);
      finalCustomers = updatedCustomersList;
      return updatedCustomersList;
    });

    triggerDBSync(companyProfile, updatedQuotes, updatedProjectsList, finalCustomers, categories);
  };

  const updateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    setProjects((prev) => {
      const updatedProjects = prev.map((p) => {
        if (p.id === projectId) {
          return { ...p, status: newStatus };
        }
        return p;
      });
      saveLocalProjects(updatedProjects);
      triggerDBSync(companyProfile, savedQuotations, updatedProjects, customers, categories);
      return updatedProjects;
    });
  };

  const deleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    let updatedQuotes = savedQuotations;

    // Revert quote status back to non-converted
    const quoteIndex = savedQuotations.findIndex((q) => q.id === project.quoteId);
    if (quoteIndex >= 0) {
      updatedQuotes = [...savedQuotations];
      updatedQuotes[quoteIndex] = {
        ...savedQuotations[quoteIndex],
        isConvertedToProject: false,
      };
      setSavedQuotations(updatedQuotes);
      saveLocalSaved(updatedQuotes);
    }

    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    saveLocalProjects(updated);
    triggerDBSync(companyProfile, updatedQuotes, updated, customers, categories);
  };

  const addProject = (customerName: string, customerPhone: string, amount: number, status: ProjectStatus) => {
    const newProject: ProjectItem = {
      id: Math.random().toString(36).substring(7),
      quoteId: '',
      quoteNumber: 'GQ-MANUAL-' + Math.floor(1000 + Math.random() * 9000),
      customerName,
      customerPhone: customerPhone || 'N/A',
      amount: amount || 0,
      status,
      dateCreated: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      tasks: [],
    };
    setProjects((prev) => {
      const updated = [newProject, ...prev];
      saveLocalProjects(updated);
      triggerDBSync(companyProfile, savedQuotations, updated, customers, categories);
      return updated;
    });
  };

  const addProjectTask = (projectId: string, taskTitle: string, status: ProjectStatus) => {
    const newTask: ProjectTask = {
      id: Math.random().toString(36).substring(7),
      title: taskTitle,
      status,
      dateCreated: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
    };
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === projectId) {
          const tasks = p.tasks || [];
          return { ...p, tasks: [...tasks, newTask] };
        }
        return p;
      });
      saveLocalProjects(updated);
      triggerDBSync(companyProfile, savedQuotations, updated, customers, categories);
      return updated;
    });
  };

  const updateProjectTaskStatus = (projectId: string, taskId: string, newStatus: ProjectStatus) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === projectId) {
          const tasks = (p.tasks || []).map((t) => {
            if (t.id === taskId) {
              return { ...t, status: newStatus };
            }
            return t;
          });
          return { ...p, tasks };
        }
        return p;
      });
      saveLocalProjects(updated);
      triggerDBSync(companyProfile, savedQuotations, updated, customers, categories);
      return updated;
    });
  };

  const deleteProjectTask = (projectId: string, taskId: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => {
        if (p.id === projectId) {
          const tasks = (p.tasks || []).filter((t) => t.id !== taskId);
          return { ...p, tasks };
        }
        return p;
      });
      saveLocalProjects(updated);
      triggerDBSync(companyProfile, savedQuotations, updated, customers, categories);
      return updated;
    });
  };

  const updateCompanyProfile = (newProfile: CompanyProfile) => {
    setCompanyProfile(newProfile);
    saveLocalProfile(newProfile);
    triggerDBSync(newProfile, savedQuotations, projects, customers, categories);
  };

  const resetCompanyProfile = () => {
    setCompanyProfile(DEFAULT_COMPANY_PROFILE);
    saveLocalProfile(DEFAULT_COMPANY_PROFILE);
    triggerDBSync(DEFAULT_COMPANY_PROFILE, savedQuotations, projects, customers, categories);
  };

  const importQuotations = (importedQuotes: SavedQuotation[]) => {
    setSavedQuotations((prev) => {
      const map = new Map(prev.map(q => [q.id, q]));
      importedQuotes.forEach(q => map.set(q.id, q));
      const merged = Array.from(map.values());
      saveLocalSaved(merged);
      return merged;
    });
  };

  const importProjects = (importedProjects: ProjectItem[]) => {
    setProjects((prev) => {
      const map = new Map(prev.map(p => [p.id, p]));
      importedProjects.forEach(p => map.set(p.id, p));
      const merged = Array.from(map.values());
      saveLocalProjects(merged);
      return merged;
    });
  };

  const importCustomers = (importedCustomers: CustomerItem[]) => {
    setCustomers((prev) => {
      const map = new Map(prev.map(c => [c.id, c]));
      importedCustomers.forEach(c => map.set(c.id, c));
      const merged = Array.from(map.values());
      saveLocalCustomers(merged);
      return merged;
    });
  };

  const addCategory = (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return;
    setCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      saveLocalCategories(updated);
      triggerDBSync(companyProfile, savedQuotations, projects, customers, updated);
      return updated;
    });
  };

  const removeCategory = (name: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c !== name);
      saveLocalCategories(updated);
      triggerDBSync(companyProfile, savedQuotations, projects, customers, updated);
      return updated;
    });
  };

  const updateCategory = (index: number, newName: string) => {
    const trimmed = newName.trim().toLowerCase();
    if (!trimmed) return;
    setCategories((prev) => {
      const updated = [...prev];
      updated[index] = trimmed;
      saveLocalCategories(updated);
      triggerDBSync(companyProfile, savedQuotations, projects, customers, updated);
      return updated;
    });
  };

  return (
    <QuotationContext.Provider
      value={{
        draft,
        savedQuotations,
        projects,
        customers,
        companyProfile,
        updateDraftInfo,
        addDraftItem,
        updateDraftItem,
        removeDraftItem,
        clearDraft,
        saveQuotation,
        deleteQuotation,
        updateQuotation,
        convertQuoteToProject,
        updateProjectStatus,
        deleteProject,
        addProject,
        addProjectTask,
        updateProjectTaskStatus,
        deleteProjectTask,
        updateCompanyProfile,
        resetCompanyProfile,
        importQuotations,
        importProjects,
        importCustomers,
        categories,
        addCategory,
        removeCategory,
        updateCategory,
      }}
    >
      {children}
    </QuotationContext.Provider>
  );
};

export const useQuotation = () => {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error('useQuotation must be used within a QuotationProvider');
  }
  return context;
};
