import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // <-- THE FIX IS HERE
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Request Body:', req.body);
  }
  next();
});

// CORS Middleware
app.use(cors({
  origin: '*' // Allow all origins for simplicity, tighten in production
}));


// API Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);


// Make uploads folder static
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  // We need to import mongoose to check the connection state
  import('mongoose').then(mongoose => {
    res.status(200).json({
      status: 'healthy',
      database: mongoose.default.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  });
});


// Fallback for not found
app.use(notFound);
// Custom error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));