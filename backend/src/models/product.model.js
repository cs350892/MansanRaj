import { Schema, model } from 'mongoose';

const pricingTierSchema = new Schema({
  range: { type: String, required: true }, // e.g., "1-20"
  minQuantity: { type: Number, required: true },
  maxQuantity: { type: Number, default: null }, // null means no upper limit
  price: { type: Number, required: true },
  margin: { type: Number, required: true },
});

const packSizeSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  multiplier: { type: Number, required: true },
});

const productSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ['high-margin', 'regional-brands'], required: true },
  name: { type: String, required: true },
  image: { type: String },
  mrp: { type: Number, required: true },
  pricingTiers: [pricingTierSchema],
  packSizes: [packSizeSchema],
  description: { type: String },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  // Offer/Discount fields (admin-managed, visible to users)
  hasOffer: { type: Boolean, default: false },
  offerText: { type: String, default: null },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountedPrice: { type: Number, default: null },
  offerActive: { type: Boolean, default: false },
  offerStartDate: { type: Date, default: null },
  offerEndDate: { type: Date, default: null },
}, { timestamps: true });

// Add indexes for faster queries
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });

export default model('Product', productSchema);