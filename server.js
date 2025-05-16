import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';

dotenv.config(); // Load environment variables from .env file

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// Mount the authentication router
app.use('/auth', authRouter);

// Mount the chat proxy router
// Requests to /api/chat/completions will be handled by chatRouter
app.use('/api/chat', chatRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not set. Please set it in your .env file for secure token generation.');
  }
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
    console.warn('Warning: ENCRYPTION_KEY is not set or is not a 32-byte hex string (64 characters). Please set it in your .env file for secure API key encryption.');
  }
}); 