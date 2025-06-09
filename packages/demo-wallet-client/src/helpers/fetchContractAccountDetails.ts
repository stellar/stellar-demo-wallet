// import { STELLAR_EXPERT_API } from "../config/constants";
import { ContractAccountDetails } from "../types/types";

export const fetchContractAccountDetails = async (
  _contractId: string,
): Promise<ContractAccountDetails> => {
  return testJson;
  // try {
  //   const response = await fetch(
  //     `${STELLAR_EXPERT_API}/contract/${contractId}`,
  //   );
  //   const responseJson = await response.json();
  //   if (responseJson.error) {
  //     throw responseJson.error;
  //   }
  //   return responseJson;
  // } catch (error) {
  //   throw error;
  // }
};

const testJson: ContractAccountDetails = {
  "contract": "CCGLJGF6546GXOMMG6C73U74QPGJL6D4AN4NHSV3KITORY7UJNTFPUCA",
  "account": "CCGLJGF6546GXOMMG6C73U74QPGJL6D4AN4NHSV3KITORY7UJNTFPUCA",
  "created": 1747011297,
  "creator": "GBL5LTAAODO3GXX3MGUUCST42ZHFNGL7OGARCO47E7PVQBTP2V6PNW44",
  "payments": 0,
  "trades": 0,
  "wasm": "e5da3b9950524b4276ccf2051e6cc8220bb581e869b892a6ff7812d7709c7a50",
  "storage_entries": 1,
  "validation": {
    "status": "unverified"
  },
  "functions": [
    {
      "invocations": 1,
      "subinvocations": 0,
      "function": "__constructor"
    }
  ]
}
