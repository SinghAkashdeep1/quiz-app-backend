import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';
import path from 'path';
import categoryRoutes from './routes/categoryRoutes';
import questionRoutes from './routes/questionRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import gameRoutes from './routes/gameRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import lifelineRoutes from './routes/lifelineRoutes';
import translateRoutes from './routes/translateRoutes';
import { errorHandler } from './middleware/errorMiddleware';

// dotenv.config(); // Removed from here

// Connect to Database
connectDB();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const isDevelopment = process.env.NODE_ENV !== 'production';

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:8081'];

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-id', 'Accept', 'X-Requested-With', 'X-HTTP-Method-Override'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));
app.use(express.json());

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/lifeline', lifelineRoutes);
app.use('/api/game/lifeline', lifelineRoutes);
app.use('/api/translate', translateRoutes);

const __dirname_path = path.resolve();
app.use('/uploads', express.static(path.join(__dirname_path, '/uploads')));

// Error Handler
app.use(errorHandler);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Quiz App API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
