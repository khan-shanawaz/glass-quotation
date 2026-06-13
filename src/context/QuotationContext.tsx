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

export interface ProjectItem {
  id: string;
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: ProjectStatus;
  dateCreated: string;
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

  // Load state from localStorage on client-side mount
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
    setCustomers((prevCustomers) => {
      const existsIndex = prevCustomers.findIndex(
        (c) => c.phone.trim() === phoneKey && phoneKey !== 'N/A'
      );
      
      let updatedCustomersList = [...prevCustomers];
      
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
      return updatedCustomersList;
    });

    // Clear estimator draft values
    clearDraft();
    
    return newQuote;
  };

  const deleteQuotation = (id: string) => {
    const updated = savedQuotations.filter((q) => q.id !== id);
    setSavedQuotations(updated);
    saveLocalSaved(updated);
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
    };

    const updatedProjectsList = [newProjItem, ...projects];
    setProjects(updatedProjectsList);
    saveLocalProjects(updatedProjectsList);

    // Update customer revenue records
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
      return updatedCustomersList;
    });
  };

  const updateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, status: newStatus };
      }
      return p;
    });
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);
  };

  const deleteProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Revert quote status back to non-converted
    const quoteIndex = savedQuotations.findIndex((q) => q.id === project.quoteId);
    if (quoteIndex >= 0) {
      const updatedQuotes = [...savedQuotations];
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
  };

  const updateCompanyProfile = (newProfile: CompanyProfile) => {
    setCompanyProfile(newProfile);
    saveLocalProfile(newProfile);
  };

  const resetCompanyProfile = () => {
    setCompanyProfile(DEFAULT_COMPANY_PROFILE);
    saveLocalProfile(DEFAULT_COMPANY_PROFILE);
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
      return updated;
    });
  };

  const removeCategory = (name: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c !== name);
      saveLocalCategories(updated);
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
