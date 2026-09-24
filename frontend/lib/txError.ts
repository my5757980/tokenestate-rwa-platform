import { BaseError, ContractFunctionRevertedError } from "viem";

const REASONS: Record<string, string> = {
  NotKYCVerified: "This wallet has no active KYC badge, so the contract will not let it receive tokens.",
  InsufficientTokensAvailable: "Not that many tokens are left for sale.",
  PropertyNotActive: "This property is paused.",
  NoTokenHolders: "No token has been sold yet, so there is nobody to pay rent to.",
  NothingToClaim: "There is no rent to claim yet.",
  MarketplaceNotApproved: "Approve the marketplace first (step 1).",
  InsufficientTokenBalance: "This wallet does not hold that many tokens.",
  SelfPurchaseNotAllowed: "You cannot buy your own listing.",
  ERC20InsufficientBalance: "Not enough USDC in this wallet.",
  ERC20InsufficientAllowance: "The USDC approval is lower than the amount.",
};

/** A short, readable reason for a failed transaction (wagmi/viem errors are many lines long). */
export function txErrorMessage(error: Error): string {
  if (!(error instanceof BaseError)) return error.message;
  const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
  if (reverted instanceof ContractFunctionRevertedError) {
    const name = reverted.data?.errorName;
    if (name) return REASONS[name] ?? `The contract refused: ${name}`;
    return reverted.shortMessage;
  }
  return error.shortMessage;
}
