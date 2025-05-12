import { STELLAR_EXPERT_API } from "../config/constants";
import { ContractAccountDetails } from "../types/types";

export const fetchContractAccountDetails = async (
  contractId: string,
): Promise<ContractAccountDetails> => {
  try {
    const response = await fetch(
      `${STELLAR_EXPERT_API}/contract/${contractId}`,
    );
    const responseJson = await response.json();
    if (responseJson.error) {
      throw responseJson.error;
    }
    return responseJson;
  } catch (error) {
    throw error;
  }
};
