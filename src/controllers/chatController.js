import { OpenAIService } from '../services/openaiService.js';
import { decrypt } from '../../utils/crypto.js';
import { users } from '../../routes/auth.js';

export const handleChatCompletion = async (req, res) => {
  const { serviceProvider, model, messages, temperature, max_tokens } = req.body;
  const { username } = req.user;

  if (!serviceProvider) {
    return res.status(400).json({ error: 'serviceProvider is required (e.g., openai, google, anthropic)' });
  }

  const user = users.get(username);
  if (!user || !user.apiKeys || !user.apiKeys[serviceProvider]) {
    if (serviceProvider === 'openai' && process.env.OPENAI_API_KEY) {
      console.log(`No API key found for ${username} for ${serviceProvider}. Using default OpenAI API key.`);
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
    return res.status(403).json({ error: `API key for ${serviceProvider} not configured.` });
  }

  try {
    if (serviceProvider === 'openai') {
      const openaiService = new OpenAIService(apiKey);
      const completion = await openaiService.createChatCompletion({
        model,
        messages,
        temperature,
        max_tokens
      });
      return res.json(completion);
    }
    return res.status(400).json({ error: `Unsupported service provider: ${serviceProvider}` });
  } catch (error) {
    console.error(`Error proxying to ${serviceProvider}:`, error);
    return res.status(error.status || 500).json({ error: error.message });
  }
}; 