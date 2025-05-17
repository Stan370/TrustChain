import OpenAI from 'openai';

export class OpenAIService {
  constructor(apiKey) {
    this.client = new OpenAI({ apiKey });
  }

  async createChatCompletion({ model, messages, temperature, max_tokens }) {
    try {
      const completion = await this.client.chat.completions.create({
        model: model || 'gpt-4o',
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 500,
      });
      return completion;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw {
          status: error.status || 500,
          message: error.message || 'Failed to process request to OpenAI via SDK.'
        };
      }
      throw {
        status: 500,
        message: 'Failed to process request to OpenAI.'
      };
    }
  }
} 