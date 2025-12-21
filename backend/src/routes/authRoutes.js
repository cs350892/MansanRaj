import express from 'express';
import { body } from 'express-validator';
import { register, login, profile, logout } from '../controllers/authController.js';
import validateRequest from '../middleware/validateRequest.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Health check endpoint for Render
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Public routes
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
], validateRequest, register);

// Add /signup as alias to /register for frontend compatibility
router.post('/signup', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
], validateRequest, register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required'),
], validateRequest, login);

// Protected routes
router.get('/profile', verifyToken, profile);
router.post('/logout', verifyToken, logout);

export default router;
