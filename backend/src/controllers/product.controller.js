import Product from '../models/product.model.js';
import createHttpError from 'http-errors';

// Get all products with pagination, search, and filters
export const getAllProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      category = '', 
      brand = '',
      stockStatus = '' // 'low', 'medium', 'high'
    } = req.query;

    // Build filter query
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    
    // Stock status filter
    if (stockStatus === 'low') filter.stock = { $lt: 20 };
    else if (stockStatus === 'medium') filter.stock = { $gte: 20, $lt: 50 };
    else if (stockStatus === 'high') filter.stock = { $gte: 50 };

    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Get single product by ID (for users to view details)
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return next(createHttpError(404, 'Product not found'));
    res.json(product);
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Admin: Create new product with auto-generated pricing tiers
export const createProduct = async (req, res, next) => {
  try {
    const { 
      id, name, image, mrp, category, brand, stock, 
      type = 'high-margin',
      margin = 20, // default margin percentage
      description = ''
    } = req.body;

    // Validate required fields
    if (!id || !name || !mrp || !category || !brand || stock === undefined) {
      return next(createHttpError(400, 'Missing required fields: id, name, mrp, category, brand, stock'));
    }

    // Check if product ID already exists
    const existing = await Product.findOne({ id });
    if (existing) {
      return next(createHttpError(409, `Product with ID '${id}' already exists`));
    }

    // Auto-generate pricing tiers based on MRP and margin
    const marginMultiplier = (100 - margin) / 100;
    const basePrice = mrp * marginMultiplier;

    const pricingTiers = [
      {
        range: '1-20',
        minQuantity: 1,
        maxQuantity: 20,
        price: Number(basePrice.toFixed(2)),
        margin: margin
      },
      {
        range: '21-100',
        minQuantity: 21,
        maxQuantity: 100,
        price: Number((basePrice * 0.95).toFixed(2)), // 5% extra discount
        margin: margin + 5
      },
      {
        range: '100+',
        minQuantity: 101,
        maxQuantity: null,
        price: Number((basePrice * 0.90).toFixed(2)), // 10% extra discount
        margin: margin + 10
      }
    ];

    // Default pack sizes
    const packSizes = [
      { id: 'single', name: 'Single Unit', multiplier: 1 },
      { id: 'pack-6', name: 'Pack of 6', multiplier: 6 },
      { id: 'pack-12', name: 'Pack of 12', multiplier: 12 },
      { id: 'carton-24', name: 'Carton (24)', multiplier: 24 }
    ];

    const newProduct = new Product({
      id,
      type,
      name,
      image: image || 'https://via.placeholder.com/300x300?text=No+Image',
      mrp,
      pricingTiers,
      packSizes,
      description,
      category,
      brand,
      stock: parseInt(stock)
    });

    const saved = await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: saved
    });
  } catch (err) {
    console.error('[createProduct] error:', err);
    next(createHttpError(400, err.message));
  }
};

// Admin: Update product (including dynamic pricing tiers)
export const updateProduct = async (req, res, next) => {
  try {
    const { margin, mrp } = req.body;
    
    // If MRP or margin is updated, regenerate pricing tiers
    if (margin !== undefined && mrp !== undefined) {
      const marginMultiplier = (100 - margin) / 100;
      const basePrice = mrp * marginMultiplier;

      req.body.pricingTiers = [
        {
          range: '1-20',
          minQuantity: 1,
          maxQuantity: 20,
          price: Number(basePrice.toFixed(2)),
          margin: margin
        },
        {
          range: '21-100',
          minQuantity: 21,
          maxQuantity: 100,
          price: Number((basePrice * 0.95).toFixed(2)),
          margin: margin + 5
        },
        {
          range: '100+',
          minQuantity: 101,
          maxQuantity: null,
          price: Number((basePrice * 0.90).toFixed(2)),
          margin: margin + 10
        }
      ];
    }

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) return next(createHttpError(404, 'Product not found'));
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (err) {
    next(createHttpError(400, err.message));
  }
};

// Admin: Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    if (!product) return next(createHttpError(404, 'Product not found'));
    
    res.json({ 
      success: true,
      message: 'Product deleted successfully',
      product
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Get categories list (for filters)
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json({ success: true, categories });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Get brands list (for filters)
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand');
    res.json({ success: true, brands });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Get stock statistics
export const getStockStats = async (req, res, next) => {
  try {
    const lowStock = await Product.countDocuments({ stock: { $lt: 20 } });
    const mediumStock = await Product.countDocuments({ stock: { $gte: 20, $lt: 50 } });
    const highStock = await Product.countDocuments({ stock: { $gte: 50 } });
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const total = await Product.countDocuments();

    res.json({
      success: true,
      stats: {
        total,
        outOfStock,
        lowStock,
        mediumStock,
        highStock
      }
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Calculate dynamic price (for frontend real-time updates)
export const calculatePrice = async (req, res, next) => {
  try {
    const { productId, packSizeId, quantity } = req.body;
    if (!productId || !packSizeId || !quantity) {
      return next(createHttpError(400, 'productId, packSizeId and quantity are required'));
    }
    const product = await Product.findOne({ id: productId });
    if (!product) return next(createHttpError(404, 'Product not found'));

    const packSize = product.packSizes.find((p) => p.id === packSizeId);
    if (!packSize) return next(createHttpError(400, 'Invalid pack size'));

    const totalUnits = quantity * packSize.multiplier;

    // Find applicable tier
    let tier = product.pricingTiers.find((t) => {
      if (t.maxQuantity === null) return totalUnits >= t.minQuantity;
      return totalUnits >= t.minQuantity && totalUnits <= t.maxQuantity;
    });

    if (!tier) tier = product.pricingTiers[0]; // Fallback to first tier

    const pricePerUnit = tier.price;
    const totalPrice = pricePerUnit * totalUnits;
    const savingsPercentage = product.mrp ? ((product.mrp - pricePerUnit) / product.mrp) * 100 : 0;

    // Check stock
    const inStock = product.stock >= totalUnits;

    res.json({
      totalUnits,
      tier: tier.range,
      pricePerUnit,
      totalPrice: Number(totalPrice.toFixed(2)),
      savingsPercentage: Number(savingsPercentage.toFixed(2)),
      inStock,
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Admin: Add/Update offer on a product
export const updateProductOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      hasOffer, 
      offerText, 
      discountPercent, 
      offerActive,
      offerStartDate,
      offerEndDate 
    } = req.body;

    const product = await Product.findOne({ id });
    if (!product) return next(createHttpError(404, 'Product not found'));

    // Calculate discounted price if discount percentage is provided
    let discountedPrice = null;
    if (discountPercent && discountPercent > 0) {
      discountedPrice = product.mrp * (1 - discountPercent / 100);
      discountedPrice = Number(discountedPrice.toFixed(2));
    }

    // Update offer fields
    product.hasOffer = hasOffer !== undefined ? hasOffer : product.hasOffer;
    product.offerText = offerText !== undefined ? offerText : product.offerText;
    product.discountPercent = discountPercent !== undefined ? discountPercent : product.discountPercent;
    product.discountedPrice = discountedPrice !== undefined ? discountedPrice : product.discountedPrice;
    product.offerActive = offerActive !== undefined ? offerActive : product.offerActive;
    product.offerStartDate = offerStartDate !== undefined ? offerStartDate : product.offerStartDate;
    product.offerEndDate = offerEndDate !== undefined ? offerEndDate : product.offerEndDate;

    await product.save();

    res.json({ 
      success: true, 
      message: 'Offer updated successfully', 
      product 
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Admin: Remove offer from a product
export const removeProductOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ id });
    if (!product) return next(createHttpError(404, 'Product not found'));

    // Reset offer fields
    product.hasOffer = false;
    product.offerText = null;
    product.discountPercent = 0;
    product.discountedPrice = null;
    product.offerActive = false;
    product.offerStartDate = null;
    product.offerEndDate = null;

    await product.save();

    res.json({ 
      success: true, 
      message: 'Offer removed successfully', 
      product 
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};