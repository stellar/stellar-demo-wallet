import { makeDisplayableBalances } from "./makeDisplayableBalances";
import { AccountDetails } from "types/types";

export const fetchAccountDetails = async (
  networkUrl: string,
  publicKey: string,
): Promise<AccountDetails | null> => {
  try {
    const url = `${networkUrl}/accounts/${publicKey}`;

    const request = await fetch(url);
    const accountSummary = await request.json();

    if (!accountSummary.account_id) {
      return null;
    }

    const balances = makeDisplayableBalances(accountSummary);
    const sponsor = accountSummary.sponsor
      ? { sponsor: accountSummary.sponsor }
      : {};

    return {
      ...sponsor,
      id: accountSummary.id,
      subentryCount: accountSummary.subentry_count,
      sponsoredCount: accountSummary.num_sponsored,
      sponsoringCount: accountSummary.num_sponsoring,
      inflationDestination: accountSummary.inflation_destination,
      thresholds: accountSummary.thresholds,
      signers: accountSummary.signers,
      flags: accountSummary.flags,
      sequenceNumber: accountSummary.sequence,
      balances,
    };
  } catch (err) {
    throw err;
  }
};
