import express from 'express';
import { verifyToken } from '../src/middleware/auth.js';
import { handleChatCompletion } from '../src/controllers/chatController.js';

const router = express.Router();

router.post('/completions', verifyToken, handleChatCompletion);

export { router as chatRouter }; 