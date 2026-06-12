'use client';

import React from 'react';
import { QuotationProvider } from '@/context/QuotationContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <QuotationProvider>{children}</QuotationProvider>;
}
