import express from 'express';
import cors from 'cors';
import medicinesRouter from './routes/medicines';
import interactionsRouter from './routes/interactions';
import conditionsRouter from './routes/conditions';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// CORS — allow requests from the Netlify frontend and local dev
const allowedOrigins = [
  'http://localhost:8081',   // expo web dev
  'http://localhost:19006',  // expo web dev (alternate port)
  process.env['FRONTEND_URL'], // set this in Railway to your Netlify URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (origin === undefined || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Mount routers
app.use('/api/v1/medicines', medicinesRouter);
app.use('/api/v1/interactions', interactionsRouter);
app.use('/api/v1/conditions', conditionsRouter);

// Global error handler — must be registered last
app.use(errorHandler);

const PORT = process.env['PORT'] !== undefined ? parseInt(process.env['PORT'], 10) : 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
