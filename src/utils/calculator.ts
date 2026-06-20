export type GlassCategory = string;

export interface GlassItemInput {
  id: string;
  name: string;        // e.g. Glass Door, Balcony Window
  description: string; // e.g. 12mm Toughened, Frosted Acid
  category: GlassCategory;
  sizeSqFt: number;    // size in sq.ft. inputted directly
  quantity: number;    // unit box (quantity)
  rate: number;        // pricing box (rate per sq.ft)
  qtyUnit?: string;
  sizeUnit?: string;
  currencySymbol?: string;
  customTotal?: number;
  hideSize?: boolean;
  hideQty?: boolean;
}

export interface CalculationResult {
  rawSqFt: number;
  billedSqFt: number; // Rounded to multiple of 6 per pane
  itemTotal: number;  // billedSqFt * quantity * rate
}

export interface QuoteSummary {
  items: Array<{
    item: GlassItemInput;
    result: CalculationResult;
  }>;
  subtotal: number;
  transportCharges: number;
  labourCharges: number;
  taxAmount: number;
  taxRate: number; // percentage from settings
  discountAmount: number;
  discountValue: number; // percentage or flat rate value
  isDiscountFlat: boolean;
  grandTotal: number;
}

/**
 * Safely parse numbers with a default fallback
 */
export function safeNumber(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const parsed = Number(val);
  return isNaN(parsed) || !isFinite(parsed) ? fallback : parsed;
}

/**
 * Apply the Multiple of 6 Rounding Rule:
 * Any area greater than 0 is rounded up to the nearest multiple of 6
 * e.g., 18.1 -> 24, 19.6 -> 24, 22.0 -> 24, 23.5 -> 24
 */
export function roundToMultipleOf6(rawSqFt: number): number {
  const area = Math.max(0, safeNumber(rawSqFt, 0));
  if (area === 0) return 0;
  return Math.ceil(area / 6) * 6;
}

/**
 * Formats numbers with standard grouping and a custom currency symbol
 */
export function formatCustomCurrency(val: number, symbol = '₹'): string {
  const cleanVal = isNaN(val) || !isFinite(val) ? 0 : val;
  const formattedNum = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cleanVal);
  return `${symbol}${formattedNum}`;
}

/**
 * Formats numbers into the Indian Rupee currency format (e.g. ₹1,50,000.00)
 */
export function formatRupee(val: number): string {
  return formatCustomCurrency(val, '₹');
}

/**
 * Calculates pricing for a single item row.
 */
export function calculateItemRow(item: Partial<GlassItemInput>): CalculationResult {
  const sizeSqFt = item.hideSize ? 1 : Math.max(0, safeNumber(item.sizeSqFt, 0));
  const quantity = item.hideQty ? 1 : Math.max(0, Math.floor(safeNumber(item.quantity, 1)));
  const rate = Math.max(0, safeNumber(item.rate, 0));

  // Calculate pricing using exact Sq.Ft. (no rounding)
  const billedSqFt = item.hideSize ? 1 : sizeSqFt;
  
  // Total cost: Sq.Ft. * Quantity * Rate (with manual customTotal override)
  const calculatedTotal = billedSqFt * quantity * rate;
  const itemTotal = item.customTotal !== undefined && item.customTotal !== null
    ? safeNumber(item.customTotal, calculatedTotal)
    : calculatedTotal;

  return {
    rawSqFt: (item.hideSize ? 1 : sizeSqFt) * (item.hideQty ? 1 : quantity),
    billedSqFt,
    itemTotal: isNaN(itemTotal) || !isFinite(itemTotal) ? 0 : itemTotal
  };
}

/**
 * Compiles quotation sums across all items, applying tax and discounts.
 */
export function calculateQuoteSummary(
  items: Array<Partial<GlassItemInput>>,
  taxRatePercent = 18.0,
  discountValue = 0,
  isDiscountFlat = false,
  transportCharges = 0,
  labourCharges = 0
): QuoteSummary {
  const calculatedItems = items.map((item) => {
    const fullItem: GlassItemInput = {
      id: item.id || Math.random().toString(36).substring(7),
      name: item.name || 'Glass Item',
      description: item.description || '',
      category: item.category || 'custom',
      sizeSqFt: safeNumber(item.sizeSqFt, 0),
      quantity: safeNumber(item.quantity, 1),
      rate: safeNumber(item.rate, 0),
      qtyUnit: item.qtyUnit || 'pcs',
      sizeUnit: item.sizeUnit || 'sq.ft',
      currencySymbol: item.currencySymbol || '₹',
      customTotal: item.customTotal,
      hideSize: item.hideSize || false,
      hideQty: item.hideQty || false,
    };

    return {
      item: fullItem,
      result: calculateItemRow(fullItem),
    };
  });

  // Subtotal is the sum of row totals
  const subtotal = calculatedItems.reduce((sum, itemObj) => sum + itemObj.result.itemTotal, 0);

  // Discount calculation
  let discountAmount = 0;
  const rawDiscount = safeNumber(discountValue, 0);
  if (isDiscountFlat) {
    discountAmount = Math.min(subtotal, rawDiscount);
  } else {
    const pct = Math.max(0, Math.min(100, rawDiscount)) / 100;
    discountAmount = subtotal * pct;
  }

  // Taxable amount is items subtotal minus discount plus transport & labour charges
  const cleanTransport = safeNumber(transportCharges, 0);
  const cleanLabour = safeNumber(labourCharges, 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount) + cleanTransport + cleanLabour;
  
  // Tax calculation
  const taxRate = Math.max(0, safeNumber(taxRatePercent, 0)) / 100;
  const taxAmount = taxableAmount * taxRate;

  // Grand total
  const grandTotal = taxableAmount + taxAmount;

  const sanitize = (val: number) => (isNaN(val) || !isFinite(val) ? 0 : val);

  return {
    items: calculatedItems,
    subtotal: sanitize(subtotal),
    transportCharges: sanitize(cleanTransport),
    labourCharges: sanitize(cleanLabour),
    taxAmount: sanitize(taxAmount),
    taxRate: taxRatePercent,
    discountAmount: sanitize(discountAmount),
    discountValue,
    isDiscountFlat,
    grandTotal: sanitize(grandTotal),
  };
}
