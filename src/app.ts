import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import path from 'path';
import categoryRoutes from './routes/categoryRoutes';
import questionRoutes from './routes/questionRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { errorHandler } from './middleware/errorMiddleware';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const isDevelopment = process.env.NODE_ENV !== 'production';

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://localhost:8081'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, strictly follow allowedOrigins
    if (!isDevelopment) {
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
      return;
    }

    // In development, be more permissive but still check patterns if desired
    // Allow localhost, 127.0.0.1, and common local network IPs (10.*, 192.168.*, 172.*)
    const isLocal = origin.startsWith('http://localhost') || 
                    origin.startsWith('http://127.0.0.1') || 
                    origin.match(/^http:\/\/(10|192\.168|172)\.\d+\.\d+\.\d+/);

    if (isLocal || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS in development'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

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
