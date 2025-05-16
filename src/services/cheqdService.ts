import { CheqdSDK, createCheqdSDK, VerificationMethod} from '@cheqd/sdk';
import { DirectSecp256k1HdWallet, EncodeObject } from '@cosmjs/proto-signing';
import { SignInfo } from '@cheqd/ts-proto/cheqd/did/v2/index.js';
import { StdFee } from "@cosmjs/stargate";
import { v4 as uuidv4 } from 'uuid'; // For generating DID IDs


// Types for our application
export interface Credential {
  id: string;
  name: string;
  issuer: string;
  date: string;
  schema: string;
  provenanceInfo?: {
    creator: string;
    timestamp: string;
    sourceType: string;
  };
}

export interface DIDDocument {
  did: string;
  verificationMethod: {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }[];
}


// Create an instance of the SDK with the required modules
let cheqdSDK: CheqdSDK | null = null;

// Standard fee for transactions - adjust as needed
const DEFAULT_FEE: StdFee = {
  amount: [{ denom: 'ncheq', amount: '50000' }], // Example fee
  gas: '200000', // Example gas limit
};
const DEFAULT_MEMO = 'Transaction from TrustChainAI';

// Initialize the SDK
export async function initializeSDK(mnemonic?: string) {
  try {
    // Create a wallet from mnemonic or generate a new one
    const wallet = mnemonic 
      ? await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'cheqd' })
      : await DirectSecp256k1HdWallet.generate(24, { prefix: 'cheqd' });
    
    // Create the SDK instance.
    // Assuming DIDModule and ResourceModule functionalities are integrated by default
    // or accessed via sdk.signer and sdk.querier, thus not passed in the modules array explicitly.
    cheqdSDK = await createCheqdSDK({
      modules: [], // Pass empty array, assuming core modules are default
      rpcUrl: 'https://rpc.cheqd.network',
      wallet
    });
    
    return wallet;
  } catch (error) {
    console.error('Error initializing cheqd SDK:', error);
    throw error;
  }
}

// Get the current SDK instance
function getSDK() {
  if (!cheqdSDK) {
    throw new Error('SDK not initialized. Call initializeSDK first.');
  }
  return cheqdSDK;
}

// Create a new DID
export async function createDID(): Promise<DIDDocument> {
  try {
    const sdk = getSDK();
    const didId = `did:cheqd:mainnet:${uuidv4()}`;
    const keyId = `${didId}#key-1`;

    const didDocPayload = {
        id: didId,
        verificationMethod: [
            {
                id: keyId,
                type: 'Ed25519VerificationKey2020',
                controller: didId,
            } as VerificationMethod,
        ],
        authentication: [keyId],
    };

    
    const createdDidDoc: DIDDocument = {
        did: didId,
        verificationMethod: didDocPayload.verificationMethod!.map((vm: any) => ({
            id: vm.id,
            type: vm.type,
            controller: vm.controller,
            publicKeyMultibase: 'zExamplePublicKeyMultibase' 
        })),
    };
    return createdDidDoc;
  } catch (error) {
    console.error('Error creating DID:', error);
    throw error;
  }
}

// Create a credential resource linked to a DID
export async function createCredentialResource(
  did: string,
  credential: Credential
): Promise<void> {
  try {
    const sdk = getSDK();
    
    const credentialWithProvenance = {
      ...credential,
      provenanceInfo: credential.provenanceInfo || {
        creator: did,
        timestamp: new Date().toISOString(),
        sourceType: 'AI Generated',
      }
    };
    
    const resourcePayload = {
      collectionId: did,
      id: credential.id, 
      name: credential.name,
      resourceType: 'VerifiableCredential',
      data: {
        ...credentialWithProvenance,
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://c2pa.org/credentials/v1'
        ],
        type: ['VerifiableCredential', 'AIAgentCredential', 'ContentCredential'],
        issuer: did, 
        issuanceDate: new Date().toISOString(),
      },
    };
    
    // Assuming a generic transact method or specific createResourceTx with Fee and Memo
    // This part is speculative as createResourceTx was not found.
    // We might need to build a MsgCreateResource and use a generic signAndBroadcast.
    // For now, placeholder for what might be a method:
    // await sdk.someCreateResourceMethod(resourcePayload, DEFAULT_FEE, DEFAULT_MEMO);
    // If using Msg approach:
    const msgCreateResource: EncodeObject = {
        typeUrl: '/cheqd.resource.v2.MsgCreateResource', // Check typeUrl from sdk/proto
        value: {
            collectionId: did,
            id: credential.id,
            name: credential.name,
            version: '1.0', // Or generate
            resourceType: 'VerifiableCredential',
            data: Buffer.from(JSON.stringify(credentialWithProvenance)).toString('base64'), // Ensure data is base64 encoded string
            // also_encoded for file data
        },
    };
    await sdk.signer.signAndBroadcast(did, [msgCreateResource],DEFAULT_FEE );

  } catch (error) {
    console.error('Error creating credential resource:', error);
    throw error;
  }
}

// Verify a credential 
export async function verifyCredential(
  did: string, 
  credentialId: string
): Promise<boolean> {
  try {
    const sdk = getSDK();
    // Use sdk.querier.resource.resource(collectionId, resourceId)
    const resourceResponse = await sdk.querier.resource.resource(did, credentialId); 
    
    if (!resourceResponse || !resourceResponse.resource || !resourceResponse.resource.data) {
        console.warn(`Resource data not found for DID ${did}, credentialId ${credentialId}`);
        return false;
    }
    // Assuming resourceResponse.resource.data is Uint8Array or Buffer containing the JSON string bytes
    const jsonString = Buffer.from(resourceResponse.resource.data).toString('utf-8');
    const storedCredentialData = JSON.parse(jsonString);

    const isValid = 
      storedCredentialData.issuer && 
      storedCredentialData.issuanceDate && 
      storedCredentialData['@context'] && 
      Array.isArray(storedCredentialData['@context']) &&
      storedCredentialData['@context'].includes('https://www.w3.org/2018/credentials/v1');
    
    return isValid;
  } catch (error) {
    console.error('Error verifying credential:', error);
    return false;
  }
}

// Get all credentials for a DID
export async function getDIDCredentials(did: string): Promise<Credential[]> {
  try {
    const sdk = getSDK();
    // Use sdk.querier.resource.collectionResources(collectionId)
    const result = await sdk.querier.resource.collectionResources(did);
    
    if (!result || !result.resources) return [];

    const credentials = result.resources
        .map((r: any) => {
            if (r.metadata?.resourceType === 'VerifiableCredential' || r.header?.resourceType === 'VerifiableCredential') {
                try {
                    // Assuming r.resource.data is the base64 encoded string of the JSON credential
                    const jsonData = JSON.parse(Buffer.from(r.resource?.data || r.data, 'base64').toString());
                    return jsonData as Credential;
                } catch (e) {
                    console.error('Error parsing credential data:', e, r.resource?.data || r.data);
                    return null;
                }
            }
            return null;
        })
        .filter(Boolean) as Credential[];

    return credentials;
  } catch (error) {
    console.error('Error getting DID credentials:', error);
    throw error;
  }
}

// Update a credential
export async function updateCredential(
  did: string,
  credentialId: string,
  updates: Partial<Credential>
): Promise<void> {
  try {
    const sdk = getSDK();
    // Similar to create, update will likely involve MsgUpdateResource
    // First, fetch the existing resource to get its current version if needed for the update msg
    // For simplicity, assuming updates replace the data entirely or SDK handles merge.
    const msgUpdateResource: EncodeObject = {
        typeUrl: '/cheqd.resource.v2.MsgUpdateResource', // Check typeUrl
        value: {
            collectionId: did,
            id: credentialId,
            name: updates.name, // Name might be part of the metadata to update
            // version: new_version_if_needed,
            resourceType: 'VerifiableCredential',
            data: Buffer.from(JSON.stringify(updates)).toString('base64'), // New data, base64 encoded
        },
    };
    await sdk.signer.signAndBroadcast(did, [msgUpdateResource],DEFAULT_FEE );
  } catch (error) {
    console.error('Error updating credential:', error);
    throw error;
  }
}

// Deactivate a DID
export async function deactivateDID(did: string): Promise<void> {
  try {
    function generateRandomSignInfo(): SignInfo {
        const did1 = did;
        const keyId = `#key-${Math.floor(Math.random() * 1000)}`;
      
        return {
          verificationMethodId: `${did1}${keyId}`,
          signature: randomBytes(64), // 512-bit signature placeholder
        };
      }
      
      // Usage
      const randomSignInfo = generateRandomSignInfo();
      console.log({
        verificationMethodId: randomSignInfo.verificationMethodId,
        signature: Buffer.from(randomSignInfo.signature).toString('base64'),
      });
      

  } catch (error) {
    console.error('Error deactivating DID:', error);
    throw error;
  }
}

// Create a Verifiable Dataset 
export async function createVerifiableDataset(
  did: string,
  datasetInfo: {
    name: string;
    description: string;
    dataType: string;
    license: string;
    sourceUrl?: string;
  }
): Promise<string> {
  try {
    const sdk = getSDK();
    const datasetId = `dataset-${Date.now()}`;
    const datasetData = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org/',
      ],
      type: ['VerifiableCredential', 'Dataset'],
      id: datasetId, 
      name: datasetInfo.name,
      description: datasetInfo.description,
      dataType: datasetInfo.dataType,
      license: datasetInfo.license,
      sourceUrl: datasetInfo.sourceUrl,
      creator: did, 
      dateCreated: new Date().toISOString(),
      issuer: did, 
      issuanceDate: new Date().toISOString(),
    };
    
    const msgCreateDatasetResource: EncodeObject = {
        typeUrl: '/cheqd.resource.v2.MsgCreateResource', // Check typeUrl
        value: {
            collectionId: did,
            id: datasetId,
            name: datasetInfo.name,
            version: '1.0',
            resourceType: 'VerifiableDataset',
            data: Buffer.from(JSON.stringify(datasetData)).toString('base64'),
        },
    };
    await sdk.signer.signAndBroadcast(did, [msgCreateDatasetResource],DEFAULT_FEE );
    return datasetId;
  } catch (error) {
    console.error('Error creating verifiable dataset:', error);
    throw error;
  }
}

// Create Content Provenance credential (C2PA compatible)
export async function createContentProvenanceCredential(
  did: string,
  contentInfo: {
    contentType: string;
    title: string;
    creator: string; 
    generationMethod: string;
    promptText?: string;
    model?: string;
    parentContentIds?: string[];
  }
): Promise<string> {
  try {
    const sdk = getSDK();
    const contentId = `content-${Date.now()}`;
    const contentCredentialData = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://c2pa.org/credentials/v1'
      ],
      type: ['VerifiableCredential', 'ContentCredential'],
      id: contentId, 
      contentType: contentInfo.contentType,
      title: contentInfo.title,
      creator: contentInfo.creator, 
      generationMethod: contentInfo.generationMethod,
      promptText: contentInfo.promptText,
      model: contentInfo.model,
      parentContentIds: contentInfo.parentContentIds || [],
      timestamp: new Date().toISOString(), 
      issuer: did, 
      issuanceDate: new Date().toISOString(),
    };

    const msgCreateContentResource: EncodeObject = {
        typeUrl: '/cheqd.resource.v2.MsgCreateResource',
        value: {
            collectionId: did,
            id: contentId,
            name: contentInfo.title,
            version: '1.0',
            resourceType: 'ContentCredential',
            data: Buffer.from(JSON.stringify(contentCredentialData)).toString('base64'),
        },
    };
    await sdk.signer.signAndBroadcast(did, [msgCreateContentResource],DEFAULT_FEE );
    return contentId;
  } catch (error) {
    console.error('Error creating content provenance credential:', error);
    throw error;
  }
} 

function randomBytes(arg0: number): Uint8Array<ArrayBufferLike> {
    throw new Error('Function not implemented.');
}
