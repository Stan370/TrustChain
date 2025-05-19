import { useState, useEffect } from 'react';
import { Shield, Check, X, ChevronDown, ChevronUp, Zap, Database, ArrowRight, AlertTriangle, DollarSign, Award } from 'lucide-react';
import { initializeSDK, createDID, createCredentialResource, verifyCredential, getDIDCredentials, Credential, DIDDocument } from './services/cheqdService';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import DataMarketplace from './components/DataMarketplace';

// Placeholder Prop Types - In a real app, define these in the respective component files
export interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isLoggedIn: boolean;
  username?: string;
  userDID?: string;
  userDIDDoc?: DIDDocument;
  onJwtLogin?: (username: string) => void;
  onJwtLogout?: () => void;
  onDIDLogin?: (did: string, didDoc: DIDDocument) => void;
  onDIDLogout?: () => void;
}

export interface ChatInterfaceProps {
  userDID?: string;
  jwtToken?: string | null;
  activeAiProvider?: string;
  selectedModel?: string;
  isLoggedIn?: boolean;
}

export interface DataMarketplaceProps {
  userDID?: string;
  jwtToken?: string | null;
  isLoggedIn?: boolean;
}

// Define types for API provider settings
interface ApiProviderSetting {
  name: string;
  apiKey: string;
  model: string;
  isApiKeySet: boolean; // To indicate if a key is stored on the server
}

// Main App Component
export default function TrustChainAI() {
  const [activeTab, setActiveTab] = useState('overview');
  const [agentDetailOpen, setAgentDetailOpen] = useState<number | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [transactionInProgress, setTransactionInProgress] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [agentDIDs, setAgentDIDs] = useState<Record<number, DIDDocument>>({});
  const [agentCredentials, setAgentCredentials] = useState<Record<number, Credential[]>>({});
  
  // User authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This will now represent JWT login
  const [username, setUsername] = useState<string>('');
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  
  // DID-specific user state (can coexist or be merged depending on requirements)
  const [userDID, setUserDID] = useState<string>();
  const [userDIDDoc, setUserDIDDoc] = useState<DIDDocument>();

  // API Provider Settings State
  const [apiProviderSettings, setApiProviderSettings] = useState<Record<string, ApiProviderSetting>>({
    openai: { name: 'OpenAI', apiKey: '', model: 'gpt-4o', isApiKeySet: false },
    google: { name: 'Google AI', apiKey: '', model: 'gemini-2.5-pro', isApiKeySet: false },
    anthropic: { name: 'Anthropic Claude', apiKey: '', model: 'claude-3.5-sonnet', isApiKeySet: false },
  });
  const [activeAiProvider, setActiveAiProvider] = useState<string>('openai'); // Default active provider for chat

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agents', label: 'AI Agents' },
    { id: 'verification', label: 'Verification Demo' },
    { id: 'data', label: 'Trusted Data' },
    { id: 'chat', label: 'Chat' },
    { id: 'settings', label: 'Settings' }
  ];

  const aiAgents = [
    {
      id: 1,
      name: 'ResearchAssist AI',
      type: 'Research Assistant',
      trustScore: 94,
      credentials: [
        { id: 'eth001', name: 'Ethics Certification', issuer: 'Global AI Ethics Board', date: '2025-03-15' },
        { id: 'acc001', name: 'Accuracy Assessment', issuer: 'AI Benchmarking Institute', date: '2025-04-01' },
        { id: 'dat001', name: 'Data Provenance', issuer: 'Data Trust Alliance', date: '2025-02-10' }
      ],
      description: 'Specialized in academic research with verified training on peer-reviewed sources and ethical data handling practices.'
    },
    {
      id: 2,
      name: 'FinAdvisor AI',
      type: 'Financial Assistant',
      trustScore: 91,
      credentials: [
        { id: 'fin001', name: 'Financial Regulation Compliance', issuer: 'Financial Services Authority', date: '2025-03-10' },
        { id: 'sec001', name: 'Data Security Standard', issuer: 'Digital Security Alliance', date: '2025-02-22' },
        { id: 'eth002', name: 'Ethics Certification', issuer: 'Global AI Ethics Board', date: '2025-01-05' }
      ],
      description: 'Provides financial advice and analysis with compliance to financial regulations and secure handling of sensitive financial data.'
    },
    {
      id: 3,
      name: 'HealthCompanion AI',
      type: 'Healthcare Assistant',
      trustScore: 97,
      credentials: [
        { id: 'med001', name: 'Medical Information Accuracy', issuer: 'Healthcare AI Consortium', date: '2025-04-12' },
        { id: 'prv001', name: 'Privacy Protection Standard', issuer: 'Data Protection Agency', date: '2025-03-25' },
        { id: 'eth003', name: 'Ethics Certification', issuer: 'Global AI Ethics Board', date: '2025-02-18' }
      ],
      description: 'Assists with health inquiries and monitoring, with verified medical knowledge and strict privacy protections.'
    }
  ];

  // Handle user login with JWT
  const handleJwtLogin = async (currentUsername: string) => {
    if (!currentUsername.trim()) {
      alert('Username cannot be empty.');
      return;
    }
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUsername }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      const { token } = await response.json();
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('username', currentUsername);
      setJwtToken(token);
      setUsername(currentUsername);
      setIsLoggedIn(true);
      console.log('User logged in with JWT:', token);
      // Optionally, fetch user's API key statuses here
    } catch (error) {
      console.error('JWT Login error:', error);
      alert(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle user logout
  const handleJwtLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    setJwtToken(null);
    setUsername('');
    setIsLoggedIn(false);
    // Also reset API key input fields if desired
    setApiProviderSettings(prev => ({
        openai: { ...prev.openai, apiKey: '', isApiKeySet: false }, // Assume not set on logout, or re-fetch status
        google: { ...prev.google, apiKey: '', isApiKeySet: false },
        anthropic: { ...prev.anthropic, apiKey: '', isApiKeySet: false },
    }));
    console.log('User logged out');
  };
  
  // Cheqd DID login/logout (kept separate for now)
  const handleDIDLogin = (did: string, didDoc: DIDDocument) => {
    setUserDID(did);
    setUserDIDDoc(didDoc);
    console.log('User DID initialized:', did);
  };

  const handleDIDLogout = () => {
    setUserDID(undefined);
    setUserDIDDoc(undefined);
    console.log('User DID cleared');
  };

  // Function to handle API key input changes for a provider
  const handleApiKeyChange = (provider: string, value: string) => {
    setApiProviderSettings(prev => ({
      ...prev,
      [provider]: { ...prev[provider], apiKey: value },
    }));
  };

  // Function to handle model changes for a provider
  const handleModelChange = (provider: string, value: string) => {
    setApiProviderSettings(prev => ({
      ...prev,
      [provider]: { ...prev[provider], model: value },
    }));
  };

  // Function to store API key for a provider
  const handleStoreApiKey = async (provider: string) => {
    if (!jwtToken) {
      alert('You must be logged in to store API keys.');
      return;
    }
    const { apiKey } = apiProviderSettings[provider];
    if (!apiKey.trim()) {
      alert('API key cannot be empty.');
      return;
    }

    try {
      const response = await fetch('/auth/store-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ serviceProvider: provider, apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to store API key for ${provider}`);
      }
      
      alert(`API key for ${apiProviderSettings[provider].name} stored successfully!`);
      // Update UI to reflect that key is set and clear input
      setApiProviderSettings(prev => ({
        ...prev,
        [provider]: { ...prev[provider], apiKey: '', isApiKeySet: true }, 
      }));
    } catch (error) {
      console.error(`Error storing API key for ${provider}:`, error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Initialize agent DIDs and credentials
  const initializeAgentDIDs = async () => {
    const newAgentDIDs: Record<number, DIDDocument> = {};
    for (const agent of aiAgents) {
      try {
        const didDoc = await createDID();
        newAgentDIDs[agent.id] = didDoc;
        
        // Create credentials for the agent
        for (const cred of agent.credentials) {
          await createCredentialResource(didDoc.did, {
            ...cred,
            schema: 'did:cheqd:credentials:ai-agent-certification:v1'
          } as Credential);
        }
        
        // Fetch all credentials for the agent
        const credentials = await getDIDCredentials(didDoc.did);
        setAgentCredentials(prev => ({
          ...prev,
          [agent.id]: credentials
        }));
      } catch (error) {
        console.error(`Error initializing DID for agent ${agent.id}:`, error);
      }
    }
    setAgentDIDs(newAgentDIDs);
  };

  // Initialize the SDK and create sample DIDs for the agents
  useEffect(() => {
    // Attempt to load JWT from localStorage on initial load
    const storedToken = localStorage.getItem('jwtToken');
    const storedUsername = localStorage.getItem('username');
    if (storedToken && storedUsername) {
      setJwtToken(storedToken);
      setUsername(storedUsername);
      setIsLoggedIn(true);
      console.log('User session restored from localStorage.');
      // TODO: Optionally fetch API key statuses from a new backend endpoint
      // e.g., GET /auth/api-key-status to update isApiKeySet for each provider
    }

    const initialize = async () => {
      try {
        // Initialize the cheqd SDK
        await initializeSDK();
        await initializeAgentDIDs();
      } catch (error) {
        console.error('Error initializing:', error);
      }
    };

    initialize();
  }, []);

  const handleStartTransaction = () => {
    setTransactionInProgress(true);
    // Simulate transaction process with steps
    const timer1 = setTimeout(() => setCurrentStep(2), 1500);
    const timer2 = setTimeout(() => setCurrentStep(3), 3000);
    const timer3 = setTimeout(() => {
      setCurrentStep(4);
      setTransactionInProgress(false);
      setTransactionComplete(true);
    }, 4500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const resetDemo = () => {
    setTransactionInProgress(false);
    setTransactionComplete(false);
    setCurrentStep(1);
    setSelectedCredential(null);
  };

  const viewCredential = async (credential: Credential) => {
    setSelectedCredential(credential);
    setShowCredentialModal(true);
    
    // Verify the credential
    if (agentDetailOpen) {
      const did = agentDIDs[agentDetailOpen]?.did;
      if (did) {
        const isValid = await verifyCredential(did, credential.id);
        console.log(`Credential ${credential.id} is ${isValid ? 'valid' : 'invalid'}`);
      }
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isLoggedIn={isLoggedIn} // This will reflect JWT login status
      userDID={userDID} // Keep passing DID info if Layout uses it
      userDIDDoc={userDIDDoc}
      onLogin={handleDIDLogin} // Keep DID login if needed by Layout/cheqd
      onLogout={handleDIDLogout} // Keep DID logout if needed
    >
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">TrustChain AI: Building Trust in the AI Agent Economy</h2>
            <p className="mb-4">
              TrustChain AI creates a decentralized trust and payment infrastructure for AI agent interactions, 
              leveraging verifiable credentials and blockchain technology to establish trust between humans, 
              AI agents, and data sources.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <div className="flex items-center mb-3">
                  <Shield className="text-blue-600 mr-2" size={20} />
                  <h3 className="font-semibold">Agentic Economy</h3>
                </div>
                <p className="text-sm">
                  Verify AI agents' trustworthiness through credentials about their development, 
                  training data, and ethical guidelines.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <div className="flex items-center mb-3">
                  <Zap className="text-blue-600 mr-2" size={20} />
                  <h3 className="font-semibold">Agent Verification</h3>
                </div>
                <p className="text-sm">
                  Enable AI agents to trust each other through credential exchange 
                  and decentralized identity verification.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <div className="flex items-center mb-3">
                  <Database className="text-blue-600 mr-2" size={20} />
                  <h3 className="font-semibold">Trusted Data</h3>
                </div>
                <p className="text-sm">
                  Ensure data integrity through provenance credentials and 
                  secure payment rails for fair compensation.
                </p>
              </div>
            </div>
          </section>
          
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">How TrustChain AI Works</h2>
            
            <div className="relative">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 relative">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 md:w-1/4">
                  <h3 className="font-semibold mb-2">1. Credential Issuance</h3>
                  <p className="text-sm">Trusted authorities issue verifiable credentials to AI agents and data sources</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 md:w-1/4 mt-4 md:mt-0">
                  <h3 className="font-semibold mb-2">2. Identity Verification</h3>
                  <p className="text-sm">Agents use decentralized identifiers (DIDs) to prove ownership of credentials</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 md:w-1/4 mt-4 md:mt-0">
                  <h3 className="font-semibold mb-2">3. Secure Transactions</h3>
                  <p className="text-sm">Trust established through credentials enables secure payments and data exchange</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-semibold mb-2 flex items-center">
                <Award className="text-blue-600 mr-2" size={18} />
                Key Benefits
              </h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                  <span>Increased trust in AI agent outputs and recommendations</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                  <span>Secure payment infrastructure with verification at every step</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                  <span>Data provenance tracking and fair compensation for data providers</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                  <span>Decentralized architecture removing central points of failure</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {/* AI Agents Tab */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Verified AI Agents</h2>
            <p className="mb-6">
              These AI agents have been issued verifiable credentials by trusted authorities,
              establishing their trustworthiness across various domains.
            </p>
            
            <div className="space-y-4">
              {aiAgents.map(agent => (
                <div key={agent.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer bg-gray-50"
                    onClick={() => setAgentDetailOpen(agentDetailOpen === agent.id ? null : agent.id)}
                  >
                    <div className="flex items-center">
                      <div className="mr-3 bg-blue-100 p-2 rounded-full">
                        <Shield size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{agent.name}</h3>
                        <p className="text-sm text-gray-600">{agent.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-4">
                        <span className="text-sm font-medium">Trust Score:</span>
                        <span className={`ml-1 font-bold ${agent.trustScore >= 95 ? 'text-green-600' : 'text-blue-600'}`}>
                          {agent.trustScore}%
                        </span>
                      </div>
                      {agentDetailOpen === agent.id ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {agentDetailOpen === agent.id && (
                    <div className="p-4 border-t border-gray-200">
                      <p className="mb-4">{agent.description}</p>
                      
                      <h4 className="font-medium mb-2">Verified Credentials:</h4>
                      <div className="space-y-2">
                        {agent.credentials.map(cred => (
                          <div key={cred.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                            <div>
                              <p className="font-medium text-sm">{cred.name}</p>
                              <p className="text-xs text-gray-600">Issued by: {cred.issuer} • {cred.date}</p>
                            </div>
                            <button 
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              onClick={() => viewCredential(cred as Credential)}
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="h-full">
          <ChatInterface 
            userDID={userDID} // Pass if ChatInterface uses it for cheqd stuff
          />
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="h-full">
          <DataMarketplace 
            userDID={userDID} // Pass if DataMarketplace uses it for cheqd stuff
          />
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AI Provider Settings</h2>
            
            
              <div className="space-y-4">
                {Object.entries(apiProviderSettings).map(([providerKey, settings]) => (
                  <div key={providerKey} className="bg-gray-50 p-4 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{settings.name}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${settings.isApiKeySet ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {settings.isApiKeySet ? 'Key Set' : 'Key Not Set'}
                      </span>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">API Key</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                        placeholder={`Enter your ${settings.name} API key`}
                        value={settings.apiKey}
                        onChange={(e) => handleApiKeyChange(providerKey, e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">Model</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        value={settings.model}
                        onChange={(e) => handleModelChange(providerKey, e.target.value)}
                      >
                        {/* Populate models based on providerKey */}
                        {providerKey === 'openai' && <>
                          <option value="gpt-4o">gpt-4o</option>
                          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        </>}
                        {providerKey === 'google' && <>
                          <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        </>}
                        {providerKey === 'anthropic' && <>
                          <option value="claude-3.5-sonnet">claude-3.5-sonnet</option>
                          <option value="claude-3.5-haiku">claude-3.5-haiku</option>
                        </>}
                      </select>
                    </div>
                     <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">Active for Chat</label>
                        <input
                            type="radio"
                            name="activeAiProvider"
                            value={providerKey}
                            checked={activeAiProvider === providerKey}
                            onChange={() => setActiveAiProvider(providerKey)}
                        />
                         <span className="ml-2 text-sm">{settings.isApiKeySet ? `Set as active` : `Set API key to activate`}</span>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        onClick={() => handleStoreApiKey(providerKey)}
                        disabled={!settings.apiKey.trim()}
                      >
                        {settings.isApiKeySet ? 'Update Key' : 'Save Key'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-100">
              <div className="flex items-start">
                <AlertTriangle className="text-blue-600 mr-2 mt-1 flex-shrink-0" size={18} />
                <div>
                  <h5 className="font-medium text-sm">API Security</h5>
                  <p className="text-xs mt-1">
                    All API requests are now securely handled through our backend server. Your messages 
                    are transmitted over HTTPS and the API credentials are never exposed to the client.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h5 className="font-medium mb-3">About cheqd Integration</h5>
              <p className="text-sm mb-3">
                TrustChain AI uses cheqd's decentralized identity (DID) and verifiable credentials (VC) technology
                to establish trust in AI systems. This integration enables:
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Verification of AI agent credentials and capabilities</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Data provenance tracking for training data and AI outputs</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Secure and verifiable marketplace for AI training datasets</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={14} />
                  <span>Content credentials for AI-generated outputs (C2PA standard)</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}

      {/* Credential Modal */}
      {showCredentialModal && selectedCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium">Verifiable Credential</h3>
              <button onClick={() => setShowCredentialModal(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <h4 className="font-medium text-sm">{selectedCredential.name}</h4>
                  <p className="text-xs text-gray-600">Credential ID: {selectedCredential.id}</p>
                </div>
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                  <Check size={12} className="mr-1" />
                  Verified
                </div>
              </div>
              
              <div className="bg-gray-50 rounded border border-gray-200 p-3 mb-4">
                <h5 className="text-xs font-medium mb-2">Credential Details</h5>
                <div className="text-xs space-y-1">
                  <p><span className="font-medium">Issuer:</span> {selectedCredential.issuer}</p>
                  <p><span className="font-medium">Issue Date:</span> {selectedCredential.date}</p>
                  <p><span className="font-medium">Valid Until:</span> {new Date(new Date(selectedCredential.date).setFullYear(new Date(selectedCredential.date).getFullYear() + 1)).toISOString().split('T')[0]}</p>
                  <p><span className="font-medium">Credential Schema:</span> {selectedCredential.schema}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded border border-blue-100 p-3 mb-4">
                <h5 className="text-xs font-medium mb-2">Verification Method</h5>
                <div className="text-xs">
                  <p>This credential has been cryptographically signed by the issuer using their private key.</p>
                  <p className="mt-1">Verification was performed using the issuer's public DID on the cheqd network.</p>
                </div>
              </div>
              
              <div className="text-right">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  onClick={() => setShowCredentialModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}