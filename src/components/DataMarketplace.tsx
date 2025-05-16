import { useState } from 'react';
import { Database, Shield, FileText, DollarSign, AlertTriangle, ExternalLink, Download } from 'lucide-react';
import { createVerifiableDataset } from '../services/cheqdService';

interface Dataset {
  id: string;
  name: string;
  description: string;
  dataType: string;
  license: string;
  price: number;
  creator: string;
  createdAt: string;
  verified: boolean;
  downloads: number;
  size: string;
  tags: string[];
  previewUrl?: string;
}

interface DataMarketplaceProps {
  userDID?: string;
}

export default function DataMarketplace({ userDID }: DataMarketplaceProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: 'dataset-001',
      name: 'Financial Market Trends 2025',
      description: 'Comprehensive dataset of global financial markets with verified sources and complete provenance trail.',
      dataType: 'CSV, JSON',
      license: 'Commercial Use',
      price: 45,
      creator: 'Market Research Institute',
      createdAt: '2025-04-12',
      verified: true,
      downloads: 1289,
      size: '2.3 GB',
      tags: ['finance', 'markets', 'economic', 'verified']
    },
    {
      id: 'dataset-002',
      name: 'Medical Research Papers Corpus',
      description: 'Collection of peer-reviewed medical research papers with verified authorship and citation credentials.',
      dataType: 'PDF, TXT',
      license: 'Research Only',
      price: 0,
      creator: 'Healthcare AI Consortium',
      createdAt: '2025-03-18',
      verified: true,
      downloads: 3452,
      size: '5.7 GB',
      tags: ['medical', 'research', 'academic', 'verified']
    },
    {
      id: 'dataset-003',
      name: 'AI Model Training Images',
      description: 'High-quality verified images for AI vision model training with proper attribution and usage rights.',
      dataType: 'JPG, PNG',
      license: 'Attribution CC-BY',
      price: 25,
      creator: 'Visual AI Lab',
      createdAt: '2025-02-28',
      verified: true,
      downloads: 7821,
      size: '8.2 GB',
      tags: ['images', 'computer vision', 'training data', 'verified']
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: '',
    description: '',
    dataType: '',
    license: 'Attribution CC-BY',
    price: 0,
    size: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter datasets based on search term
  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    dataset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Handle dataset details view
  const viewDatasetDetails = (dataset: Dataset) => {
    setSelectedDataset(dataset);
  };
  
  // Handle form submission for new dataset
  const handleAddDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userDID) {
      setError('You must be logged in with a DID to add a dataset.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare tags array
      const tagsArray = newDataset.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      // Create a verifiable dataset credential using cheqd
      const datasetId = await createVerifiableDataset(userDID, {
        name: newDataset.name,
        description: newDataset.description,
        dataType: newDataset.dataType,
        license: newDataset.license,
        sourceUrl: 'https://example.com/dataset'
      });
      
      // Add the new dataset to the list
      const createdDataset: Dataset = {
        id: datasetId,
        name: newDataset.name,
        description: newDataset.description,
        dataType: newDataset.dataType,
        license: newDataset.license,
        price: newDataset.price,
        creator: userDID.substring(0, 16) + '...',
        createdAt: new Date().toISOString().split('T')[0],
        verified: true,
        downloads: 0,
        size: newDataset.size,
        tags: tagsArray
      };
      
      setDatasets(prev => [createdDataset, ...prev]);
      setSuccess('Dataset added successfully with verifiable credentials!');
      
      // Reset form
      setNewDataset({
        name: '',
        description: '',
        dataType: '',
        license: 'Attribution CC-BY',
        price: 0,
        size: '',
        tags: ''
      });
      
      // Close form after a delay
      setTimeout(() => {
        setShowAddForm(false);
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error adding dataset:', error);
      setError('Failed to add dataset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Database className="mr-2" size={20} />
            <h2 className="text-xl font-semibold">DataTrustHub</h2>
          </div>
          {userDID && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50"
            >
              {showAddForm ? 'Cancel' : 'Add Dataset'}
            </button>
          )}
        </div>
        <p className="text-sm mb-4">A marketplace for verified datasets with provenance tracked through cheqd DIDs and VCs</p>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search datasets by name, description or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 px-4 rounded-md text-gray-800 placeholder-gray-500"
          />
        </div>
      </div>
      
      {/* Add Dataset Form */}
      {showAddForm && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <h3 className="font-medium mb-3">Add New Verified Dataset</h3>
          <form onSubmit={handleAddDataset}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dataset Name</label>
                <input
                  type="text"
                  value={newDataset.name}
                  onChange={(e) => setNewDataset({...newDataset, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data Type</label>
                <input
                  type="text"
                  value={newDataset.dataType}
                  onChange={(e) => setNewDataset({...newDataset, dataType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="CSV, JSON, etc."
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newDataset.description}
                  onChange={(e) => setNewDataset({...newDataset, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License</label>
                <select
                  value={newDataset.license}
                  onChange={(e) => setNewDataset({...newDataset, license: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                >
                  <option value="Attribution CC-BY">Attribution CC-BY</option>
                  <option value="NonCommercial CC-BY-NC">NonCommercial CC-BY-NC</option>
                  <option value="Commercial Use">Commercial Use</option>
                  <option value="Research Only">Research Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (CHEQ Tokens)</label>
                <input
                  type="number"
                  value={newDataset.price}
                  onChange={(e) => setNewDataset({...newDataset, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <input
                  type="text"
                  value={newDataset.size}
                  onChange={(e) => setNewDataset({...newDataset, size: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="1.2 GB"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newDataset.tags}
                  onChange={(e) => setNewDataset({...newDataset, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="finance, verified, research"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                {error && (
                  <div className="text-sm text-red-600 flex items-center">
                    <AlertTriangle size={14} className="mr-1" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm text-green-600 flex items-center">
                    <Shield size={14} className="mr-1" />
                    {success}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {isLoading ? 'Adding...' : 'Add Dataset'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Datasets List */}
      <div className="p-4">
        {filteredDatasets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database size={32} className="mx-auto mb-2 opacity-30" />
            <p>No datasets found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDatasets.map(dataset => (
              <div 
                key={dataset.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer"
                onClick={() => viewDatasetDetails(dataset)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-blue-700">{dataset.name}</h3>
                  {dataset.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                      <Shield size={12} className="mr-1" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{dataset.description}</p>
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <FileText size={14} className="mr-1" />
                  <span className="mr-3">{dataset.dataType}</span>
                  <Database size={14} className="mr-1" />
                  <span>{dataset.size}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    By: {dataset.creator}
                  </div>
                  <div className="flex items-center">
                    {dataset.price > 0 ? (
                      <span className="text-sm font-medium flex items-center">
                        <DollarSign size={14} className="mr-1" />
                        {dataset.price} CHEQ
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Free</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Dataset Detail Modal */}
      {selectedDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <Database className="mr-2 text-blue-600" size={18} />
                Dataset Details
              </h3>
              <button onClick={() => setSelectedDataset(null)} className="text-gray-500">
                &times;
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{selectedDataset.name}</h2>
                {selectedDataset.verified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                    <Shield size={12} className="mr-1" />
                    Verified with cheqd DIDs
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-6">{selectedDataset.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Data Type</h4>
                  <p>{selectedDataset.dataType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">License</h4>
                  <p>{selectedDataset.license}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Size</h4>
                  <p>{selectedDataset.size}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Downloads</h4>
                  <p>{selectedDataset.downloads.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Creator</h4>
                  <p>{selectedDataset.creator}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Created Date</h4>
                  <p>{selectedDataset.createdAt}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
                <div className="flex flex-wrap">
                  {selectedDataset.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mr-2 mb-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium flex items-center mb-2">
                  <Shield className="mr-2 text-blue-600" size={16} />
                  Verifiable Credentials
                </h4>
                <p className="text-sm mb-3">
                  This dataset includes verifiable credentials that prove its provenance, 
                  ownership, and licensing status. The credentials are stored on the cheqd network 
                  and can be cryptographically verified.
                </p>
                <div className="text-sm bg-white p-3 rounded border border-blue-100 font-mono overflow-x-auto">
                  &lt;did:cheqd:testnet:{selectedDataset.id}&gt;
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <a 
                  href="#" 
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <ExternalLink size={14} className="mr-1" />
                  View on cheqd Explorer
                </a>
                
                <div className="flex space-x-3">
                  {selectedDataset.price > 0 ? (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                      <DollarSign size={16} className="mr-1" />
                      Buy for {selectedDataset.price} CHEQ
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                      <Download size={16} className="mr-1" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 