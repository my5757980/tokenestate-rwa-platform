import { expect } from "chai";
import { ethers } from "hardhat";

// Rent is earned per token. Tokens the registry has not sold yet belong to the property owner, so
// their share never leaves the owner: no USDC can end up stuck in the RentDistributor, and the pool
// can always pay every holder in full, rounding included.
const U = (n: bigint) => n * 10n ** 6n; // USDC has 6 decimals

async function setup(supply: bigint, price: bigint) {
  const [owner, a, b] = await ethers.getSigners();
  const usdc = await ethers.deployContract("MockUSDC");
  const kyc = await ethers.deployContract("KYCBadge");
  const registry = await ethers.deployContract("PropertyRegistry", [await usdc.getAddress(), await kyc.getAddress()]);
  const rent = await ethers.deployContract("RentDistributor", [await usdc.getAddress(), await registry.getAddress()]);
  await registry.setRentDistributor(await rent.getAddress());

  for (const s of [owner, a, b]) {
    await usdc.mint(await s.getAddress(), U(1_000_000n));
    await usdc.connect(s).approve(await registry.getAddress(), U(1_000_000n));
    await usdc.connect(s).approve(await rent.getAddress(), U(1_000_000n));
  }
  for (const s of [a, b]) await kyc.issueBadge(await s.getAddress());
  await registry.connect(owner).listProperty("ipfs://p", supply, price);

  const pool = async () => usdc.balanceOf(await rent.getAddress());
  return { owner, a, b, usdc, registry, rent, pool };
}

describe("RentDistributor and unsold tokens", () => {
  it("collects only the holders' share; the unsold share stays with the owner and nothing is stuck", async () => {
    const { owner, a, usdc, registry, rent, pool } = await setup(1000n, U(1n));
    await registry.connect(a).purchaseTokens(1n, 100n);                  // 900 of 1000 still unsold

    const ownerBefore = await usdc.balanceOf(await owner.getAddress());
    await expect(rent.connect(owner).depositRent(1n, U(1000n)))          // 1 USDC per token
      .to.emit(rent, "RentDeposited")
      .withArgs(1n, await owner.getAddress(), U(100n));
    expect(ownerBefore - (await usdc.balanceOf(await owner.getAddress()))).to.equal(U(100n)); // was 1000
    expect(await pool()).to.equal(U(100n));

    await rent.connect(a).claimRent(1n);
    expect(await pool()).to.equal(0n);                                   // 900 USDC used to sit here forever
  });

  it("refuses rent while no token is sold, so none is taken for nobody", async () => {
    const { owner, rent } = await setup(1000n, U(1n));
    await expect(rent.connect(owner).depositRent(1n, U(1000n)))
      .to.be.revertedWithCustomError(rent, "NoTokenHolders")
      .withArgs(1n);
  });

  it("tokens sold later earn only later rent, and the pool pays everyone exactly", async () => {
    const { owner, a, b, usdc, registry, rent, pool } = await setup(1000n, U(1n));
    await registry.connect(a).purchaseTokens(1n, 100n);
    await rent.connect(owner).depositRent(1n, U(1000n));                 // 100 held: collects 100
    await registry.connect(b).purchaseTokens(1n, 300n);
    await rent.connect(owner).depositRent(1n, U(1000n));                 // 400 held: collects 400

    const [aStart, bStart] = [await usdc.balanceOf(await a.getAddress()), await usdc.balanceOf(await b.getAddress())];
    await rent.connect(a).claimRent(1n);
    await rent.connect(b).claimRent(1n);
    expect((await usdc.balanceOf(await a.getAddress())) - aStart).to.equal(U(200n)); // 100 x 2 deposits
    expect((await usdc.balanceOf(await b.getAddress())) - bStart).to.equal(U(300n)); // 300 x the 2nd only
    expect(await pool()).to.equal(0n);
  });

  it("rounding never leaves a holder unable to claim", async () => {
    // 9 of 10 tokens held, 1 micro-USDC of rent twice: each deposit is worth 0.9 units to the holder.
    // Rounding the collected share down would take 0 twice while the holder is owed 1.
    const { owner, a, registry, rent, pool } = await setup(10n, U(1n));
    await registry.connect(a).purchaseTokens(1n, 9n);
    await rent.connect(owner).depositRent(1n, 1n);
    await rent.connect(owner).depositRent(1n, 1n);

    expect(await rent.pendingRent(await a.getAddress(), 1n)).to.equal(1n);
    await rent.connect(a).claimRent(1n);                                 // reverts if the pool is short
    expect(await pool()).to.equal(1n);                                   // collected 2, paid 1: dust, never a shortfall
  });
});
