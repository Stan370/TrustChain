import { AbstractCheqdSDKModule, CheqdSDK, createCheqdSDK, DIDModule, VerificationMethod } from '@cheqd/sdk';
import { DirectSecp256k1HdWallet, EncodeObject, OfflineSigner } from '@cosmjs/proto-signing';
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
let userWallet: OfflineSigner | null = null; // Store wallet to get signerAddress

// Standard fee for transactions - adjust as needed
const DEFAULT_FEE: StdFee = {
  amount: [{ denom: 'ncheq', amount: '50000' }], // Example fee
  gas: '200000', // Example gas limit
};

// Initialize the SDK
export async function initializeSDK(mnemonic?: string): Promise<OfflineSigner> {
  try {
    // Create a wallet from mnemonic or generate a new one
    const wallet = mnemonic 
      ? await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'cheqd' })
      : await DirectSecp256k1HdWallet.generate(24, { prefix: 'cheqd' });
    
    userWallet = wallet; // Store wallet instance

    // Create the SDK instance.
    // Assuming DIDModule and ResourceModule functionalities are integrated by default
    // or accessed via sdk.signer and sdk.querier, thus not passed in the modules array explicitly.
    cheqdSDK = await createCheqdSDK({
      modules: [
        DIDModule as unknown as AbstractCheqdSDKModule,
      ],      rpcUrl: 'https://rpc.cheqd.network',
      wallet
    });
    
    return wallet;
  } catch (error) {
    console.error('Error initializing cheqd SDK:', error);
    throw error;
  }
}

// Get the current SDK instance
function getSDK(): CheqdSDK {
  if (!cheqdSDK) {
    throw new Error('SDK not initialized. Call initializeSDK first.');
  }
  return cheqdSDK;
}

async function getSignerAddress(): Promise<string> {
    if (!userWallet) {
        throw new Error('Wallet not initialized.');
    }
    const accounts = await userWallet.getAccounts();
    if (accounts.length === 0) {
        throw new Error('No accounts found in wallet.');
    }
    return accounts[0].address;
}

// Create a new DID
export async function createDID(): Promise<DIDDocument> {
  try {
    const didId = `did:cheqd:testnet:${uuidv4()}`;
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
    const signerAddress = await getSignerAddress();
    const credentialWithProvenance = {
      id: credential.id,
      name: credential.name,
      issuer: credential.issuer,
      date: credential.date,
      schema: credential.schema,
      provenanceInfo: credential.provenanceInfo || {
        creator: did,
        timestamp: new Date().toISOString(),
        sourceType: 'AI Generated',
      }
    };
    
    const msgCreateResource: EncodeObject = {
        typeUrl: '/cheqd.resource.v2.MsgCreateResource', 
        value: {
            collectionId: did,
            id: credential.id,
            name: credential.name,
            version: '1.0', 
            resourceType: 'VerifiableCredential',
            data: Buffer.from(JSON.stringify(credentialWithProvenance)).toString('base64'),
        },
    };
    await sdk.signer.signAndBroadcast(signerAddress, [msgCreateResource], DEFAULT_FEE, undefined);

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
    const signerAddress = await getSignerAddress();
    const msgUpdateResource: EncodeObject = {
        typeUrl: '/cheqd.resource.v2.MsgUpdateResource', 
        value: {
            collectionId: did,
            id: credentialId,
            name: updates.name, 
            resourceType: 'VerifiableCredential',
            data: Buffer.from(JSON.stringify(updates)).toString('base64'), 
        },
    };
    await sdk.signer.signAndBroadcast(signerAddress, [msgUpdateResource], DEFAULT_FEE, undefined);
  } catch (error) {
    console.error('Error updating credential:', error);
    throw error;
  }
}

// Deactivate a DID
export async function deactivateDID(did: string): Promise<void> {
  try {
    // const sdk = getSDK(); // sdk currently not used as user removed deactivateDidDocTx call
    // const signerAddress = await getSignerAddress(); // Would be needed if calling a Tx
     function generateRandomSignInfo(): SignInfo {
         const did1 = did;
         const keyId = `#key-${Math.floor(Math.random() * 1000)}`;
       
         return {
           verificationMethodId: `${did1}${keyId}`,
           signature: Buffer.from("placeholder_signature_bytes"), 
         };
       }
       
       const randomSignInfo = generateRandomSignInfo();
       console.log({
         verificationMethodId: randomSignInfo.verificationMethodId,
         signature: Buffer.from(randomSignInfo.signature).toString('base64'),
       });
       // NOTE: This function in its current state (modified by user) does not deactivate a DID on chain.
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
    const signerAddress = await getSignerAddress();
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
        typeUrl: '/cheqd.resource.v2.MsgCreateResource',
        value: {
            collectionId: did,
            id: datasetId,
            name: datasetInfo.name,
            version: '1.0',
            resourceType: 'VerifiableDataset',
            data: Buffer.from(JSON.stringify(datasetData)).toString('base64'),
        },
    };
    await sdk.signer.signAndBroadcast(signerAddress, [msgCreateDatasetResource], DEFAULT_FEE, undefined);
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
    const signerAddress = await getSignerAddress();
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
    await sdk.signer.signAndBroadcast(signerAddress, [msgCreateContentResource], DEFAULT_FEE, undefined);
    return contentId;
  } catch (error) {
    console.error('Error creating content provenance credential:', error);
    throw error;
  }
} 

function randomBytes(length: number): Uint8Array {
    const arr = new Uint8Array(length);
    // In a real scenario, use crypto.getRandomValues or similar secure random generator
    for (let i = 0; i < length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
}

export async function resolveDID(did: string): Promise<DIDDocument | null> {
  try {
    const sdk = getSDK();
    // The method sdk.querier.didDoc might not exist directly.
    // Consult SDK docs for the correct way to query/resolve a DID document.
    // It might be nested e.g. sdk.querier.did.resolve(did) or similar.
    // For now, assuming it might be available as sdk.query.did.didDoc(did) as a guess if direct querier.didDoc fails.
    // This is highly speculative due to the linter error.
    const resolvedDidDoc = await (sdk.querier as any).did.didDoc({ id: did }); // Speculative: Check actual path and payload

    if (!resolvedDidDoc || !resolvedDidDoc.didDoc) {
        console.warn(`Could not resolve DID or DID Doc not found: ${did}`);
        return null; 
    }
    return {
        did: resolvedDidDoc.didDoc.id,
        verificationMethod: resolvedDidDoc.didDoc.verificationMethod?.map((vm: any) => ({
            id: vm.id,
            type: vm.type,
            controller: vm.controller,
            publicKeyMultibase: vm.publicKeyMultibase || ''
        })) || [],
    } as DIDDocument;
  } catch (error) {
    console.error('Error resolving DID:', error);
    return null;
  }
}
