import { expect } from "chai";
import { ethers } from "hardhat";

// "Soulbound identity tokens ensure every investor is verified": a wallet can only receive property
// tokens (primary sale, secondary market or a plain transfer) while it holds an active KYC badge.
const U = (n: bigint) => n * 10n ** 6n; // USDC has 6 decimals

async function setup() {
  const [owner, verified, unverified] = await ethers.getSigners();
  const usdc = await ethers.deployContract("MockUSDC");
  const kyc = await ethers.deployContract("KYCBadge");
  const registry = await ethers.deployContract("PropertyRegistry", [await usdc.getAddress(), await kyc.getAddress()]);
  const market = await ethers.deployContract("Marketplace", [await registry.getAddress(), await usdc.getAddress()]);
  const [V, X] = await Promise.all([verified, unverified].map((s) => s.getAddress()));

  await kyc.issueBadge(V);
  for (const s of [verified, unverified]) {
    await usdc.mint(await s.getAddress(), U(1_000_000n));
    await usdc.connect(s).approve(await registry.getAddress(), U(1_000_000n));
    await usdc.connect(s).approve(await market.getAddress(), U(1_000_000n));
  }
  await registry.connect(owner).listProperty("ipfs://p", 1000n, U(1n));
  return { owner, verified, unverified, V, X, usdc, kyc, registry, market };
}

describe("KYC enforcement", () => {
  it("a wallet without a KYC badge cannot buy tokens", async () => {
    const { unverified, X, registry } = await setup();
    await expect(registry.connect(unverified).purchaseTokens(1n, 10n))
      .to.be.revertedWithCustomError(registry, "NotKYCVerified")
      .withArgs(X);
    expect((await registry.getProperty(1n)).tokensSold).to.equal(0n);
  });

  it("a verified investor can buy tokens", async () => {
    const { verified, V, registry } = await setup();
    await registry.connect(verified).purchaseTokens(1n, 10n);
    expect(await registry.balanceOf(V, 1n)).to.equal(10n);
  });

  it("a revoked badge stops further purchases", async () => {
    const { verified, V, kyc, registry } = await setup();
    await registry.connect(verified).purchaseTokens(1n, 10n);
    await kyc.revokeBadge(V);
    await expect(registry.connect(verified).purchaseTokens(1n, 10n))
      .to.be.revertedWithCustomError(registry, "NotKYCVerified")
      .withArgs(V);
  });

  it("tokens cannot be sent to a wallet without a badge", async () => {
    const { verified, V, X, registry } = await setup();
    await registry.connect(verified).purchaseTokens(1n, 10n);
    await expect(registry.connect(verified).safeTransferFrom(V, X, 1n, 1n, "0x"))
      .to.be.revertedWithCustomError(registry, "NotKYCVerified")
      .withArgs(X);
    expect(await registry.balanceOf(X, 1n)).to.equal(0n);
  });

  it("the secondary market cannot sell to a buyer without a badge, and the buyer keeps its USDC", async () => {
    const { verified, unverified, X, usdc, registry, market } = await setup();
    await registry.connect(verified).purchaseTokens(1n, 10n);
    await registry.connect(verified).setApprovalForAll(await market.getAddress(), true);
    await market.connect(verified).createListing(1n, 5n, U(2n));

    const before = await usdc.balanceOf(X);
    await expect(market.connect(unverified).buyListing(1n))
      .to.be.revertedWithCustomError(registry, "NotKYCVerified")
      .withArgs(X);
    expect(await usdc.balanceOf(X)).to.equal(before);
    expect(await registry.balanceOf(X, 1n)).to.equal(0n);
  });

  it("the registry cannot be deployed without a KYC badge contract", async () => {
    const usdc = await ethers.deployContract("MockUSDC");
    await expect(ethers.deployContract("PropertyRegistry", [await usdc.getAddress(), ethers.ZeroAddress]))
      .to.be.revertedWith("PropertyRegistry: KYC badge required");
  });
});
