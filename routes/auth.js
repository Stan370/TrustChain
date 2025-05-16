import express from 'express';
import jwt from 'jsonwebtoken';
import { encrypt, decrypt } from '../utils/crypto.js';

const router = express.Router();

// In-memory store for simplicity. Replace with a database in production.
// Stores: username -> { apiKeys: { serviceProvider: encryptedApiKey, ... } }
const users = new Map();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Failed to authenticate token' });
    }
    req.user = decoded; // Add user payload (e.g., { username: '...' }) to request
    next();
  });
};

// Simplified login: creates user if not exists, returns JWT
router.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (!users.has(username)) {
    users.set(username, { apiKeys: {} }); // Initialize with empty API keys map
    console.log(`User ${username} created.`);
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return res.json({ token });
});

// Store API key for a serviceProvider (e.g., openai, google)
router.post('/store-key', verifyToken, (req, res) => {
  const { serviceProvider, apiKey } = req.body;
  const { username } = req.user; // username from decoded JWT

  if (!serviceProvider || !apiKey) {
    return res.status(400).json({ error: 'serviceProvider and apiKey are required' });
  }

  const user = users.get(username);
  if (!user) {
    // Should not happen if verifyToken works and login creates user
    return res.status(404).json({ error: 'User not found' }); 
  }

  const encryptedApiKey = encrypt(apiKey);
  user.apiKeys[serviceProvider] = encryptedApiKey;
  users.set(username, user); // Update the user's entry

  console.log(`API key stored for ${username} for service ${serviceProvider}`)
  res.json({ message: `API key for ${serviceProvider} stored successfully.` });
});

// Export router and users map (users map exported for chat.js to access, consider a getter function in a real app)
export { router as authRouter, users }; 