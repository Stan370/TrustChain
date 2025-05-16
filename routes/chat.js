import express from 'express';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // Ensure node-fetch is installed for ESM
import { decrypt } from '../utils/crypto.js';
import { users } from './auth.js'; // Import the users map

const router = express.Router();

// Middleware to verify JWT (copied from auth.js for route-specific use if preferred, or use a shared middleware file)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Failed to authenticate token' });
    }
    req.user = decoded;
    next();
  });
};

router.post('/completions', verifyToken, async (req, res) => {
  const { serviceProvider, model, messages, temperature, max_tokens } = req.body;
  const { username } = req.user;

  if (!serviceProvider) {
    return res.status(400).json({ error: 'serviceProvider is required (e.g., openai, google, anthropic)' });
  }

  const user = users.get(username);
  if (!user || !user.apiKeys || !user.apiKeys[serviceProvider]) {
    // Fallback to environment variable for OpenAI if no user-specific key is found
    if (serviceProvider === 'openai' && process.env.OPENAI_API_KEY) {
      console.log(`No API key found for ${username} for ${serviceProvider}. Using default OpenAI API key.`);
      // Proceed to use process.env.OPENAI_API_KEY
    } else {
        return res.status(403).json({ error: `API key for ${serviceProvider} not found for user ${username}. Please store it first.` });
    }
  }
  
  let apiKey;
  if (user && user.apiKeys && user.apiKeys[serviceProvider]) {
      const encryptedApiKey = user.apiKeys[serviceProvider];
      apiKey = decrypt(encryptedApiKey);
      if (!apiKey) {
        return res.status(500).json({ error: 'Failed to decrypt API key.' });
      }
  } else if (serviceProvider === 'openai' && process.env.OPENAI_API_KEY) {
      apiKey = process.env.OPENAI_API_KEY;
  } else {
    // This case should have been caught earlier, but as a safeguard:
    return res.status(403).json({ error: `API key for ${serviceProvider} not configured.` });
  }


  try {
    if (serviceProvider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o', // Default model if not provided
          messages,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error from OpenAI API' } }));
        console.error('OpenAI API error:', errorData);
        return res.status(response.status).json({ error: errorData.error?.message || errorData.error || 'Failed to fetch from OpenAI API' });
      }
      const data = await response.json();
      return res.json(data);
    }
    // TODO: Add cases for other service providers like 'google', 'anthropic'
    // else if (serviceProvider === 'google') { ... }
    // else if (serviceProvider === 'anthropic') { ... }
    else {
      return res.status(400).json({ error: `Unsupported service provider: ${serviceProvider}` });
    }
  } catch (error) {
    console.error(`Error proxying to ${serviceProvider}:`, error);
    return res.status(500).json({ error: 'Failed to process request to AI service.' });
  }
});

export { router as chatRouter }; 