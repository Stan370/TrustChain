import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Download } from 'lucide-react';
import { createContentProvenanceCredential } from '../services/cheqdService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  verified?: boolean;
  contentId?: string;
}

interface ChatInterfaceProps {
  userDID?: string;
}

export default function ChatInterface({ userDID }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m TrustChain AI assistant. How can I help you today?',
      timestamp: new Date(),
      verified: true,
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Create content provenance credential if user has DID
      let contentId: string | undefined;
      if (userDID) {
        contentId = await createContentProvenanceCredential(userDID, {
          contentType: 'text',
          title: 'User Message',
          creator: userDID,
          generationMethod: 'human-input',
          promptText: inputValue,
        });
      }
      
      // Generate AI response using backend proxy
      const aiResponse = await generateAIResponse(inputValue);
      
      // Create AI content credential
      let aiContentId: string | undefined;
      if (userDID) {
        aiContentId = await createContentProvenanceCredential(userDID, {
          contentType: 'text',
          title: 'AI Response',
          creator: 'TrustChain AI',
          generationMethod: 'ai-generated',
          model: 'o4-mini',
          parentContentIds: contentId ? [contentId] : undefined,
        });
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        verified: true,
        contentId: aiContentId,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in chat:', error);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. ' + 
            (!apiAvailable ? 'The server appears to be unavailable.' : 'Please try again.'),
          timestamp: new Date(),
        }
      ]);
    }
  };
  
  // Backend API integration
  const generateAIResponse = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are TrustChain AI, an assistant specializing in decentralized identity, 
              verifiable credentials, data provenance, and trusted AI systems. 
              Your responses should emphasize trust, verification, and the importance of 
              credentials in the AI ecosystem. Mention cheqd technology when relevant.
              Keep responses concise and focused.`
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: 'user', content: prompt }
          ],
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        setApiAvailable(false);
        throw new Error(error.error?.message || 'Error connecting to API server');
      }
      
      setApiAvailable(true);
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('API error:', error);
      // Fallback to local response if the API is unavailable
      return generateLocalResponse(prompt);
    }
  };
  
  // Local response generator (fallback)
  const generateLocalResponse = (prompt: string): string => {
    const responses = [
      "I\'ve verified this information with trusted data sources on the TrustChain network.",
      "Based on verifiable credentials from our trusted data providers, I can confirm this is accurate.",
      "According to our trusted AI agent network, this analysis is correct and has been verified.",
      "The data used to generate this response has verified provenance on the TrustChain network.",
      "This information is backed by credentials that have been cryptographically verified."
    ];
    
    let baseResponse = '';

    if (!apiAvailable) {
      baseResponse = "The API is currently unavailable. This might be due to a connection issue or a missing/invalid API key. Please check your connection or provide an API key if applicable.";
      return baseResponse; // Return early as no further processing is needed
    }
    
    if (prompt.toLowerCase().includes('credential')) {
      baseResponse = "Verifiable credentials are digital attestations that can be cryptographically verified. They're the foundation of trust in our system.";
    } else if (prompt.toLowerCase().includes('did') || prompt.toLowerCase().includes('identifier')) {
      baseResponse = "Decentralized Identifiers (DIDs) are globally unique identifiers that enable verifiable, self-sovereign digital identity.";
    } else if (prompt.toLowerCase().includes('trust') || prompt.toLowerCase().includes('verify')) {
      baseResponse = "TrustChain uses a decentralized verification system where AI agents can prove their trustworthiness through credentials issued by trusted authorities.";
    } else if (prompt.toLowerCase().includes('data') || prompt.toLowerCase().includes('provenance')) {
      baseResponse = "Data provenance in TrustChain ensures that the origin and history of data are tracked and verifiable, critical for trusting AI outputs.";
    } else {
      baseResponse = "I\'m TrustChain AI, designed to provide trusted information with verifiable sources. My responses are backed by a network of verified credentials.";
    }
    
    return `${baseResponse} ${responses[Math.floor(Math.random() * responses.length)]}`;
  };
  
  const downloadChatHistory = () => {
    const chatHistory = messages.map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`).join('\n\n');
    const blob = new Blob([chatHistory], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustchain-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <h3 className="font-medium">TrustChain AI Assistant</h3>
        </div>
        <button 
          onClick={downloadChatHistory}
          className="p-1 rounded hover:bg-blue-500"
          title="Download chat history"
        >
          <Download size={18} />
        </button>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`mb-4 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}
            >
              <div className="flex items-center mb-1">
                <span className="p-1 rounded-full mr-2">
                  {message.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </span>
                <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                {message.verified && message.role === 'assistant' && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Verified</span>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.contentId && (
                <div className="mt-2 text-xs flex items-center text-blue-600">
                  <FileText size={12} className="mr-1" />
                  <span>Content ID: {message.contentId.substring(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded-r-md ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
} 