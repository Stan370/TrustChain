import { useState, useEffect } from 'react';
import { Shield, Check, X, ChevronDown, ChevronUp, Zap, Database, ArrowRight, AlertTriangle, DollarSign, Award } from 'lucide-react';
import { createDID, createCredentialResource, verifyCredential, getDIDCredentials, Credential, DIDDocument } from './services/cheqdService';

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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agents', label: 'AI Agents' },
    { id: 'verification', label: 'Verification Demo' },
    { id: 'data', label: 'Trusted Data' }
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

  // Initialize DIDs for agents
  useEffect(() => {
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

    initializeAgentDIDs();
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield size={28} />
            <h1 className="text-2xl font-bold">TrustChain AI</h1>
          </div>
          <div className="text-sm">Trust & Payment Layer for AI Agents</div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow">
        <div className="container mx-auto">
          <ul className="flex space-x-1">
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  className={`px-4 py-3 font-medium ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto flex-grow p-4">
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
                                onClick={() => viewCredential(cred)}
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

        {/* Verification Demo Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Agent-to-Agent Verification Demo</h2>
              <p className="mb-6">
                This demo simulates the process of two AI agents establishing trust and completing a 
                secure transaction using verifiable credentials and decentralized identity.
              </p>
              
              {transactionComplete ? (
                <div className="text-center py-8">
                  <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                    <Check size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Transaction Complete!</h3>
                  <p className="text-gray-600 mb-6">
                    The AI agents have successfully verified each other's credentials, 
                    established trust, and completed the transaction securely.
                  </p>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 text-left mb-6">
                    <h4 className="font-medium mb-2">Transaction Details:</h4>
                    <p className="text-sm mb-1"><span className="font-medium">Transaction ID:</span> tc-25a7f9ed</p>
                    <p className="text-sm mb-1"><span className="font-medium">Service:</span> Research Data Analysis</p>
                    <p className="text-sm mb-1"><span className="font-medium">Provider:</span> ResearchAssist AI</p>
                    <p className="text-sm mb-1"><span className="font-medium">Consumer:</span> FinAdvisor AI</p>
                    <p className="text-sm mb-1"><span className="font-medium">Amount:</span> 45 CHEQ tokens</p>
                    <p className="text-sm"><span className="font-medium">Timestamp:</span> May 6, 2025, 14:23 UTC</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={resetDemo}
                  >
                    Reset Demo
                  </button>
                </div>
              ) : transactionInProgress ? (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between relative mb-8">
                    <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 1 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Shield size={20} />
                      </div>
                      <span className="text-sm font-medium">Credential Exchange</span>
                    </div>
                    
                    <div className="hidden md:block absolute left-[12%] right-[12%] top-5 h-0.5 bg-gray-200" />
                    
                    <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 2 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Check size={20} />
                      </div>
                      <span className="text-sm font-medium">Verification</span>
                    </div>
                    
                    <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 3 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <DollarSign size={20} />
                      </div>
                      <span className="text-sm font-medium">Payment</span>
                    </div>
                    
                    <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${currentStep >= 4 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Database size={20} />
                      </div>
                      <span className="text-sm font-medium">Data Exchange</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center py-6">
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        {currentStep === 1 && (
                          <div className="animate-pulse flex items-center">
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <Shield size={24} className="text-blue-600" />
                              </div>
                            </div>
                            <ArrowRight size={24} className="mx-4 text-gray-400" />
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-gray-100 rounded-full">
                                <Shield size={24} className="text-gray-400" />
                              </div>
                            </div>
                          </div>
                        )}
                        {currentStep === 2 && (
                          <div className="animate-pulse flex items-center">
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <Check size={24} className="text-blue-600" />
                              </div>
                            </div>
                          </div>
                        )}
                        {currentStep === 3 && (
                          <div className="animate-pulse flex items-center">
                            <div className="flex-shrink-0">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <DollarSign size={24} className="text-blue-600" />
                              </div>
                            </div>
                            <ArrowRight size={24} className="mx-4 text-blue-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium mb-2">
                        {currentStep === 1 && "Exchanging verifiable credentials..."}
                        {currentStep === 2 && "Verifying credentials and establishing trust..."}
                        {currentStep === 3 && "Processing secure payment..."}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentStep === 1 && "AI agents are sharing their credentials to establish identity and capabilities"}
                        {currentStep === 2 && "Validating credentials with issuers and checking credential status"}
                        {currentStep === 3 && "Processing payment using CHEQ tokens on the decentralized payment rail"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                    <div className="mb-4 md:mb-0 md:mr-6 text-center md:text-left">
                      <div className="inline-block p-2 bg-blue-100 rounded-full mb-2">
                        <Shield size={24} className="text-blue-600" />
                      </div>
                      <h3 className="font-medium">ResearchAssist AI</h3>
                      <p className="text-sm text-gray-600">Research Assistant</p>
                      <div className="mt-1 text-sm">
                        <span className="font-medium">Trust Score:</span>
                        <span className="ml-1 font-bold text-blue-600">94%</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 md:mb-0 md:mx-6 text-center">
                      <p className="text-sm font-medium mb-2">Transaction Type</p>
                      <div className="bg-gray-50 p-2 rounded border border-gray-200">
                        <p className="text-sm">Research Data Analysis</p>
                      </div>
                      <p className="text-sm mt-2">45 CHEQ tokens</p>
                    </div>
                    
                    <div className="text-center md:text-right">
                      <div className="inline-block p-2 bg-blue-100 rounded-full mb-2">
                        <Shield size={24} className="text-blue-600" />
                      </div>
                      <h3 className="font-medium">FinAdvisor AI</h3>
                      <p className="text-sm text-gray-600">Financial Assistant</p>
                      <div className="mt-1 text-sm">
                        <span className="font-medium">Trust Score:</span>
                        <span className="ml-1 font-bold text-blue-600">91%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                    <h3 className="font-medium mb-2">Transaction Details</h3>
                    <p className="text-sm mb-1">
                      FinAdvisor AI is requesting research data analysis from ResearchAssist AI regarding
                      market trends in sustainable energy investments.
                    </p>
                    <p className="text-sm mb-1">
                      Before proceeding, both AI agents need to establish trust through credential
                      verification and secure the transaction through the payment layer.
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                      onClick={handleStartTransaction}
                    >
                      <Shield className="mr-2" size={16} />
                      Start Secure Transaction
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Trusted Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Trusted Data Layer</h2>
              <p className="mb-6">
                TrustChain AI enables verifiable data provenance, ensuring that AI agents
                consume reliable data and that data providers are fairly compensated.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Database className="text-blue-600 mr-2" size={20} />
                    <h3 className="font-medium">Data Provenance</h3>
                  </div>
                  <p className="text-sm mb-4">
                    Every dataset comes with verifiable credentials that prove its source,
                    collection methodology, and any transformations it has undergone.
                  </p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Sample Data Credential</h4>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">Dataset:</span> Global Market Trends 2025</p>
                      <p><span className="font-medium">Provider:</span> Market Research Institute</p>
                      <p><span className="font-medium">Collection Period:</span> Jan-Mar 2025</p>
                      <p><span className="font-medium">Methodology:</span> Verified by Data Ethics Board</p>
                      <p><span className="font-medium">Last Updated:</span> April 15, 2025</p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <DollarSign className="text-blue-600 mr-2" size={20} />
                    <h3 className="font-medium">Fair Compensation</h3>
                  </div>
                  <p className="text-sm mb-4">
                    TrustChain AI's payment rails ensure that data providers receive fair compensation
                    whenever their data is used by AI agents.
                  </p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Smart Payment Contract</h4>
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">Payment Type:</span> Per-use micropayment</p>
                      <p><span className="font-medium">Token:</span> CHEQ</p>
                      <p><span className="font-medium">Payment Distribution:</span></p>
                      <ul className="ml-4 mt-1 list-disc">
                        <li>70% to data provider</li>
                        <li>20% to data validators</li>
                        <li>10% to network maintenance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <div className="flex items-start mb-3">
                  <AlertTriangle className="text-yellow-600 mr-2 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <h3 className="font-medium">Data Quality Assurance</h3>
                    <p className="text-sm">
                      AI agents can filter their data sources based on credential requirements,
                      ensuring they only consume high-quality, verified data for their operations.
                      This helps prevent the "garbage in, garbage out" problem that plagues many AI systems.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

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
                  <p><span className="font-medium">Credential Schema:</span> did:cheqd:credentials:ai-agent-certification:v1</p>
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
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Shield size={18} className="mr-2" />
            <span className="font-medium">TrustChain AI</span>
          </div>
          <div className="text-sm">© 2025 TrustChain AI - Building trust in the AI agent economy</div>
        </div>
      </footer>
      
      {/* Settings Panel (for API Keys) */}
      <div className="fixed bottom-4 right-4 z-40">
        <button 
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
          onClick={() => setActiveTab('settings')}
        >
          <Zap size={20} />
        </button>
      </div>
      
      {/* API Key Settings Modal */}
      {activeTab === 'settings' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium">AI Provider Settings</h3>
              <button onClick={() => setActiveTab('overview')}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <h4 className="font-medium mb-4">Configure AI API Providers</h4>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">OpenAI</h5>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                      placeholder="Enter your OpenAI API key"
                      value="sk-••••••••••••••••••••••••••••••"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option>gpt-4o</option>
                      <option>gpt-4-turbo</option>
                      <option>gpt-3.5-turbo</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Update
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">Google AI</h5>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Inactive</span>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                      placeholder="Enter your Google AI API key"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option>gemini-1.5-flash</option>
                      <option>gemini-1.5-pro</option>
                      <option>gemini-1.0-pro</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Activate
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">Anthropic Claude</h5>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Inactive</span>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                      placeholder="Enter your Anthropic API key"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                      <option>claude-3-opus</option>
                      <option>claude-3-sonnet</option>
                      <option>claude-3-haiku</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Activate
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded border border-blue-100">
                <div className="flex items-start">
                  <AlertTriangle className="text-blue-600 mr-2 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <h5 className="font-medium text-sm">API Key Security</h5>
                    <p className="text-xs mt-1">
                      Your API keys are stored securely in your local browser storage and are never sent to our servers. 
                      Keys are only used for direct communication between your browser and the AI provider services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}