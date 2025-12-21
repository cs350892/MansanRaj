import createHttpError from 'http-errors';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { User } from '../models/user.model.js';

// Create new order (User must be logged in)
export const createOrder = async (req, res, next) => {
  try {
    const { items, deliveryType, shippingAddress, pickupLocation, paymentMethod, notes } = req.body;
    
    if (!items || items.length === 0) {
      return next(createHttpError(400, 'Order must contain at least one item'));
    }

    // Calculate total and validate stock
    let totalAmount = 0;
    let subtotalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(createHttpError(404, `Product ${item.product} not found`));
      }

      // Handle different item formats (simple vs detailed)
      const quantity = item.quantity || 1;
      const pricePerUnit = item.pricePerUnit || item.price || product.mrp;
      const subtotal = item.subtotal || (pricePerUnit * quantity);
      const totalUnits = item.totalUnits || quantity;

      // Check stock
      if (product.stock < totalUnits) {
        return next(createHttpError(400, `Insufficient stock for ${product.name}`));
      }

      // Reduce stock
      product.stock -= totalUnits;
      await product.save();

      orderItems.push({
        product: product._id,
        productId: product.id,
        name: item.name || product.name,
        image: product.image,
        quantity,
        packSize: item.packSize,
        pricePerUnit,
        totalUnits,
        tierRange: item.tierRange,
        subtotal,
      });

      subtotalAmount += subtotal;
      totalAmount += subtotal;
    }

    const order = new Order({
      user: req.body.user || req.user.id, // Allow override for testing
      items: orderItems,
      subtotalAmount: req.body.subtotalAmount || subtotalAmount,
      totalAmount: req.body.totalAmount || totalAmount,
      status: req.body.status || 'pending',
      deliveryType: req.body.deliveryType || 'delivery',
      shippingAddress: req.body.deliveryAddress ? {
        name: req.body.deliveryAddress.fullName,
        address: req.body.deliveryAddress.streetAddress,
        city: req.body.deliveryAddress.city,
        state: req.body.deliveryAddress.state,
        pincode: req.body.deliveryAddress.pincode,
        phone: req.body.deliveryAddress.mobileNumber,
      } : req.body.shippingAddress ? {
        name: req.body.shippingAddress.name,
        address: req.body.shippingAddress.address,
        city: req.body.shippingAddress.city,
        pincode: req.body.shippingAddress.postalCode || req.body.shippingAddress.pincode,
        phone: req.body.shippingAddress.phone,
      } : undefined,
      pickupLocation: deliveryType === 'pickup' ? pickupLocation : undefined,
      paymentMethod: req.body.paymentMethod,
      notes: req.body.notes,
    });

    await order.save();
    
    res.status(201).json({ success: true, message: 'Order created successfully', order });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Get user's order history
export const getUserOrders = async (req, res, next) => {
  try {
    console.log('=== GET USER ORDERS API CALLED ===');
    console.log('req.user:', req.user);
    console.log('User ID from token:', req.user?.id);
    console.log('User email from token:', req.user?.email);
    console.log('User role from token:', req.user?.role);
    
    if (!req.user || !req.user.id) {
      console.error('No user ID found in request');
      return next(createHttpError(401, 'Unauthorized - No user ID'));
    }
    
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image');
    
    console.log('=== QUERY RESULTS ===');
    console.log('Orders found for user', req.user.id, ':', orders.length);
    
    if (orders.length > 0) {
      console.log('First order details:', {
        _id: orders[0]._id,
        orderId: orders[0].orderId,
        invoiceId: orders[0].invoiceId,
        userId: orders[0].user,
        status: orders[0].status,
        totalAmount: orders[0].totalAmount,
        itemsCount: orders[0].items?.length
      });
    } else {
      console.log('No orders found for this user');
      // Check if any orders exist at all
      const totalOrders = await Order.countDocuments();
      console.log('Total orders in database:', totalOrders);
      if (totalOrders > 0) {
        const sampleOrder = await Order.findOne().select('user');
        console.log('Sample order user ID:', sampleOrder?.user);
        console.log('Requested user ID:', req.user.id);
        console.log('IDs match:', String(sampleOrder?.user) === String(req.user.id));
      }
    }
    
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('=== ERROR IN GET USER ORDERS ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    next(createHttpError(500, err.message));
  }
};

// Get single order details
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image brand category');
    
    if (!order) return next(createHttpError(404, 'Order not found'));
    
    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(createHttpError(403, 'Not authorized to view this order'));
    }
    
    res.json({ success: true, order });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, estimatedDelivery } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, trackingNumber, estimatedDelivery },
      { new: true, runValidators: true }
    );
    
    if (!order) return next(createHttpError(404, 'Order not found'));
    res.json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    next(createHttpError(400, err.message));
  }
};

// Get all orders (Admin only)
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = status ? { status } : {};
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image');
    
    const totalOrders = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      count: orders.length,
      totalOrders,
      page: parseInt(page),
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Cancel order
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) return next(createHttpError(404, 'Order not found'));
    
    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(createHttpError(403, 'Not authorized to cancel this order'));
    }
    
    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return next(createHttpError(400, 'Cannot cancel order in current status'));
    }
    
    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.totalUnits;
        await product.save();
      }
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};

// Get order statistics (Admin only)
export const getOrderStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('items.product', 'name image');
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (err) {
    next(createHttpError(500, err.message));
  }
};
