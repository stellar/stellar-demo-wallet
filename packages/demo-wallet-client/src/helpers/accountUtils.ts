import { RootState } from "../config/store";
import { accountSelector } from "../ducks/account";
import { contractAccountSelector } from "../ducks/contractAccount";

export interface UnifiedAccountData {
  // For regular accounts
  publicKey?: string;
  secretKey?: string;
  
  // For contract accounts  
  contractId?: string;
  keyId?: string;
  
  // Unified fields
  accountType: 'classic' | 'contract';
  identifier: string; // publicKey for classic, contractId for contract
}

/**
 * Get unified account data that works for both regular and contract accounts
 */
export const getUnifiedAccountData = (state: RootState): UnifiedAccountData | null => {
  const account = accountSelector(state);
  const contractAccount = contractAccountSelector(state);
  
  // Check for regular account first
  if (account.data?.id && account.secretKey) {
    return {
      publicKey: account.data.id,
      secretKey: account.secretKey,
      accountType: 'classic',
      identifier: account.data.id,
    };
  }
  
  // Check for contract account
  if (contractAccount.contractId) {
    return {
      contractId: contractAccount.contractId,
      keyId: contractAccount.keyId,
      accountType: 'contract',
      identifier: contractAccount.contractId,
    };
  }
  
  return null;
};

/**
 * Check if we have any valid account (regular or contract)
 */
export const hasValidAccount = (state: RootState): boolean => {
  return getUnifiedAccountData(state) !== null;
};

/**
 * Get the current account type
 */
export const getAccountType = (state: RootState): 'classic' | 'contract' | null => {
  return getUnifiedAccountData(state)?.accountType || null;
};

/**
 * Get the account identifier (publicKey for regular, contractId for contract)
 */
export const getAccountIdentifier = (state: RootState): string | null => {
  return getUnifiedAccountData(state)?.identifier || null;
};

/**
 * Helper for SEP actions - handles authentication based on account type
 */
export const getSepAuthenticationData = (state: RootState) => {
  const unifiedAccount = getUnifiedAccountData(state);
  
  if (!unifiedAccount) {
    throw new Error("No valid account found (neither regular nor contract account).");
  }

  if (unifiedAccount.accountType === 'classic') {
    return {
      accountType: 'classic' as const,
      publicKey: unifiedAccount.publicKey!,
      secretKey: unifiedAccount.secretKey!,
      authFlow: 'sep10' as const,
    };
  } else {
    return {
      accountType: 'contract' as const,
      contractId: unifiedAccount.contractId!,
      keyId: unifiedAccount.keyId!,
      authFlow: 'sep45' as const,
    };
  }
};

/**
 * Legacy helper for backward compatibility - throws error if no regular account
 */
export const requireRegularAccount = (state: RootState) => {
  const account = accountSelector(state);
  const { data, secretKey } = account;
  const publicKey = data?.id;

  if (!publicKey) {
    throw new Error("Something is wrong with Account, no public key.");
  }

  return { data, secretKey, publicKey };
};

/**
 * Legacy helper for backward compatibility - throws error if no contract account  
 */
export const requireContractAccount = (state: RootState) => {
  const contractAccount = contractAccountSelector(state);
  const { contractId, keyId } = contractAccount;

  if (!contractId) {
    throw new Error("Something is wrong with Contract Account, no contract ID.");
  }

  return { contractAccount, contractId, keyId };
}; 