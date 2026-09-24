import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenEstateModule", (m) => {
  // 1. MockUSDC — no dependencies
  const mockUSDC = m.contract("MockUSDC");

  // 2. KYCBadge — no dependencies
  const kycBadge = m.contract("KYCBadge");

  // 3. PropertyRegistry — needs USDC + KYCBadge (only badge holders may receive tokens)
  const propertyRegistry = m.contract("PropertyRegistry", [mockUSDC, kycBadge]);

  // 4. RentDistributor — needs USDC + PropertyRegistry
  const rentDistributor = m.contract("RentDistributor", [mockUSDC, propertyRegistry]);

  // 5. Marketplace — needs PropertyRegistry + USDC
  const marketplace = m.contract("Marketplace", [propertyRegistry, mockUSDC]);

  // 6. Wire: PropertyRegistry needs to know RentDistributor address
  m.call(propertyRegistry, "setRentDistributor", [rentDistributor]);

  return { mockUSDC, kycBadge, propertyRegistry, rentDistributor, marketplace };
});
