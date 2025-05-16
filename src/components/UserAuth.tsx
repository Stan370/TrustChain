import { useState, useEffect } from 'react';
import { Key, User, Shield, AlertCircle } from 'lucide-react';
import { initializeSDK, createDID, resolveDID, DIDDocument } from '../services/cheqdService';

interface UserAuthProps {
  onLogin: (did: string, didDoc: DIDDocument) => void;
  isLoggedIn: boolean;
  userDID?: string;
  onLogout: () => void;
}

export default function UserAuth({ onLogin, isLoggedIn, userDID, onLogout }: UserAuthProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [did, setDid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState<'create' | 'import'>('create');

  // Handle DID generation
  const handleCreateDID = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const wallet = await initializeSDK();
      const didDoc = await createDID();
      const accounts = await wallet.getAccounts();
      const newDid = didDoc.did;
      
      setDid(newDid);
      setMnemonic('example_mnemonic_would_be_here_in_production'); // In production, this would be from the wallet
      
      // Login with the new DID
      onLogin(newDid, didDoc);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating DID:', error);
      setError('Failed to create DID. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle DID import via mnemonic
  const handleImportDID = async () => {
    if (!mnemonic.trim()) {
      setError('Please enter your mnemonic phrase');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Initialize SDK with provided mnemonic
      await initializeSDK(mnemonic);
      
      // For demo purposes, we're using a placeholder DID
      // In production, you would recover the DID from the mnemonic
      const placeholderDID = 'did:cheqd:testnet:z6MkrzXCdarP1paekEEji2yfSQo1' + Date.now().toString().substring(8);
      
      // Resolve the DID to get the DID document
      // In production, this would be a real resolution
      const didDoc = {
        did: placeholderDID,
        verificationMethod: [{
          id: `${placeholderDID}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: placeholderDID,
          publicKeyMultibase: 'z6MkrC...'
        }]
      } as DIDDocument;
      
      setDid(placeholderDID);
      
      // Login with the imported DID
      onLogin(placeholderDID, didDoc);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error importing DID:', error);
      setError('Failed to import DID. Please check your mnemonic phrase and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Display the auth button or user info based on login state
  const renderAuthButton = () => {
    if (isLoggedIn && userDID) {
      return (
        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
          <div className="bg-blue-100 p-1.5 rounded-full">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium">Authenticated</p>
            <p className="text-xs text-gray-600 truncate max-w-[150px]">
              {userDID.substring(0, 16)}...
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      );
    }
    
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
      >
        <Key size={16} />
        <span>Login with DID</span>
      </button>
    );
  };

  return (
    <>
      {renderAuthButton()}
      
      {/* Auth Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Shield className="mr-2 text-blue-600" size={20} />
                {loginMethod === 'create' ? 'Create New Identity' : 'Import Existing Identity'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500">
                &times;
              </button>
            </div>
            
            {/* Login Method Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-2 font-medium ${loginMethod === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setLoginMethod('create')}
              >
                Create New
              </button>
              <button
                className={`px-4 py-2 font-medium ${loginMethod === 'import' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                onClick={() => setLoginMethod('import')}
              >
                Import Existing
              </button>
            </div>
            
            {loginMethod === 'create' ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Create a new decentralized identifier (DID) on the cheqd network. This will be your verifiable digital identity for the TrustChain platform.
                </p>
                
                {/* Create Button */}
                <button
                  onClick={handleCreateDID}
                  disabled={isLoading}
                  className={`w-full py-2 bg-blue-600 text-white rounded-lg ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {isLoading ? 'Creating...' : 'Create DID'}
                </button>
                
                {/* Generated DID and Mnemonic */}
                {did && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Your New DID</h4>
                    <p className="text-xs font-mono bg-white p-2 rounded border border-gray-200 mb-3 break-all">
                      {did}
                    </p>
                    <h4 className="font-medium text-sm mb-2">Recovery Phrase (Keep This Safe!)</h4>
                    <p className="text-xs font-mono bg-white p-2 rounded border border-gray-200 break-all">
                      {mnemonic}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Import your existing decentralized identifier (DID) using your recovery phrase.
                </p>
                
                {/* Mnemonic Input */}
                <label className="block text-sm font-medium mb-1">Recovery Phrase</label>
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-4 font-mono h-24"
                  placeholder="Enter your 24-word recovery phrase"
                />
                
                {/* Import Button */}
                <button
                  onClick={handleImportDID}
                  disabled={isLoading || !mnemonic.trim()}
                  className={`w-full py-2 bg-blue-600 text-white rounded-lg ${(isLoading || !mnemonic.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  {isLoading ? 'Importing...' : 'Import DID'}
                </button>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start">
                <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 