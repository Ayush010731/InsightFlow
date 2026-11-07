import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import datasetRoutes from './routes/datasets.js';
import chatRoutes from './routes/chat.js';
import analyticsRoutes from "./routes/analytics.js";
import reportsRoutes from './routes/reports.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 250, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use("/api/analytics", analyticsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AI Data Analyst API' }));
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const port = process.env.PORT || 5000;
try {
  await mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_data_analyst',
  {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  }
);
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`API running at http://localhost:${port}`));
} catch (error) {
  console.error('MongoDB connection failed:', error.message);
  process.exit(1);
}
