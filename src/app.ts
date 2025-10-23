import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes'
import userRoutes from './modules/users/users.routes'
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes'

const app: Application = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/subscriptions', subscriptionsRoutes);

// Error handling (must be last)
app.use(errorHandler);

export default app;