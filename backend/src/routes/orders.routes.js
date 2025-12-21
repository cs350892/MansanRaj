import express from 'express';
import { body } from 'express-validator';
import * as orderController from '../controllers/order.controller.js';
import authMW from '../middleware/authMiddleware.js';
import validateRequest from '../middleware/validateRequest.js';

const { verifyToken, isAdmin } = authMW;
const router = express.Router();

// User routes (must be logged in)
router.post('/', verifyToken, [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('deliveryType').optional().isIn(['delivery', 'pickup']).withMessage('Invalid delivery type'),
  body('paymentMethod').optional().isIn(['cod', 'online', 'upi', 'cash']).withMessage('Invalid payment method'),
], validateRequest, orderController.createOrder);

router.get('/my-orders', verifyToken, orderController.getUserOrders);
router.get('/:id', verifyToken, orderController.getOrderById);
router.put('/:id/cancel', verifyToken, orderController.cancelOrder);

// Admin routes
router.get('/', verifyToken, isAdmin, orderController.getAllOrders);
router.put('/:id/status', verifyToken, isAdmin, [
  body('status').isIn(['pending', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status value'),
], validateRequest, orderController.updateOrderStatus);
router.get('/stats/overview', verifyToken, isAdmin, orderController.getOrderStats);

export default router;
