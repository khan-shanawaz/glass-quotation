/**
 * ConversionService handles mathematical conversions for different units to Square Footage.
 */
export const ConversionService = {
  /**
   * Converts Inches (Width and Length) to Square Feet.
   * Formula: Area = (Width * Length) / 144
   */
  inchesToSqFt(widthIn: number, lengthIn: number): number {
    if (widthIn <= 0 || lengthIn <= 0) return 0;
    return (widthIn * lengthIn) / 144;
  },

  /**
   * Converts Millimeters to Inches.
   * Conversion Factor: 1 inch = 25.4 mm
   */
  mmToInches(mm: number): number {
    if (mm <= 0) return 0;
    return mm / 25.4;
  },

  /**
   * Converts MM (Width and Length) to Square Feet in a dual-step process.
   * Also returns the intermediate width and length in inches.
   */
  mmToSqFt(widthMm: number, lengthMm: number): {
    widthIn: number;
    lengthIn: number;
    sqFt: number;
  } {
    if (widthMm <= 0 || lengthMm <= 0) {
      return { widthIn: 0, lengthIn: 0, sqFt: 0 };
    }
    const widthIn = this.mmToInches(widthMm);
    const lengthIn = this.mmToInches(lengthMm);
    const sqFt = this.inchesToSqFt(widthIn, lengthIn);

    return {
      widthIn,
      lengthIn,
      sqFt,
    };
  }
};
