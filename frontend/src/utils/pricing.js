// Import types are removed since JavaScript doesn't use interfaces
// Assuming types are documented in type.js or mockData.js

/**
 * Finds the appropriate pricing tier for a product based on quantity
 * @param {Object} product - The product object with pricing tiers
 * @param {number} quantity - The quantity to check against tiers
 * @returns {Object} The matching pricing tier or the first tier as fallback
 */
export const getPricingTier = (product, quantity) => {
  // If no pricing tiers, use MRP as price with 0 margin
  if (!product.pricingTiers || product.pricingTiers.length === 0) {
    return {
      range: '1+',
      minQuantity: 1,
      maxQuantity: null,
      price: product.mrp || 0,
      margin: 0
    };
  }

  // Find the appropriate pricing tier based on quantity
  const tier = product.pricingTiers.find(tier => {
    if (tier.maxQuantity === null) {
      return quantity >= tier.minQuantity;
    }
    return quantity >= tier.minQuantity && quantity <= tier.maxQuantity;
  });

  // Return the first tier if no match found (fallback)
  return tier || product.pricingTiers[0];
};

/**
 * Calculates the total price for an item based on product, quantity, and pack size
 * @param {Object} product - The product object with pricing tiers
 * @param {number} quantity - The quantity of items
 * @param {number} [packSizeMultiplier=1] - The pack size multiplier (default: 1)
 * @returns {number} The total price
 */
export const calculateItemTotal = (product, quantity, packSizeMultiplier = 1) => {
  const tier = getPricingTier(product, quantity * packSizeMultiplier);
  return tier.price * quantity * packSizeMultiplier;
};

/**
 * Formats a price value as a string with INR currency symbol
 * @param {number} price - The price to format
 * @returns {string} The formatted price (e.g., "₹100.00")
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) {
    return '₹0.00';
  }
  return `₹${Number(price).toFixed(2)}`;
};

/**
 * Formats a margin percentage as a string
 * @param {number} margin - The margin percentage to format
 * @returns {string} The formatted margin (e.g., "10.0%")
 */
export const formatMargin = (margin) => {
  return `${margin.toFixed(1)}%`;
};