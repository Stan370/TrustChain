import { CheqdSDK, CheqdNetwork } from '@cheqd/sdk';

// Initialize the cheqd SDK
const cheqdSDK = new CheqdSDK({
  network: 'testnet' as CheqdNetwork,
});

// Types for our application
export interface Credential {
  id: string;
  name: string;
  issuer: string;
  date: string;
  schema: string;
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

interface Resource {
  type: string;
  data: any;
}

// Create a new DID
export async function createDID(): Promise<DIDDocument> {
  try {
    const didDoc = await cheqdSDK.did.create({
      method: 'cheqd',
      options: {
        verificationMethodType: 'Ed25519VerificationKey2020',
      },
    });
    return didDoc;
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
    const resource: Resource = {
      type: 'VerifiableCredential',
      data: {
        ...credential,
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'AIAgentCredential'],
      },
    };
    
    await cheqdSDK.resource.create({
      did,
      resource,
    });
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
    const resource = await cheqdSDK.resource.get({
      did,
      resourceId: credentialId,
    });
    
    // Verify the credential's signature and validity
    const isValid = await cheqdSDK.credential.verify({
      credential: resource.data,
    });
    
    return isValid;
  } catch (error) {
    console.error('Error verifying credential:', error);
    return false;
  }
}

// Get all credentials for a DID
export async function getDIDCredentials(did: string): Promise<Credential[]> {
  try {
    const resources = await cheqdSDK.resource.list({
      did,
      type: 'VerifiableCredential',
    });
    
    return resources.map(resource => resource.data as Credential);
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
    const currentResource = await cheqdSDK.resource.get({
      did,
      resourceId: credentialId,
    });
    
    const updatedResource: Resource = {
      ...currentResource,
      data: {
        ...currentResource.data,
        ...updates,
      },
    };
    
    await cheqdSDK.resource.update({
      did,
      resourceId: credentialId,
      resource: updatedResource,
    });
  } catch (error) {
    console.error('Error updating credential:', error);
    throw error;
  }
}

// Deactivate a DID
export async function deactivateDID(did: string): Promise<void> {
  try {
    await cheqdSDK.did.deactivate({
      did,
    });
  } catch (error) {
    console.error('Error deactivating DID:', error);
    throw error;
  }
} 