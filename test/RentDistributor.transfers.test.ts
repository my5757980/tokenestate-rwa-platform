import { expect } from "chai";
import { ethers } from "hardhat";

// Rent must follow the tokens that earned it: moving or buying tokens never lets anyone collect
// rent that was already paid out, and the pool always stays able to pay every honest holder.
const U = (n: bigint) => n * 10n ** 6n; // USDC has 6 decimals

async function setup(sold: { honest: bigint; b: bigint }) {
  const [owner, honest, b, a] = await ethers.getSigners();
  const usdc = await ethers.deployContract("MockUSDC");
  const registry = await ethers.deployContract("PropertyRegistry", [await usdc.getAddress()]);
  const rent = await ethers.deployContract("RentDistributor", [
    await usdc.getAddress(),
    await registry.getAddress(),
  ]);
  await registry.setRentDistributor(await rent.getAddress());
  for (const s of [owner, honest, b]) await usdc.mint(await s.getAddress(), U(1_000_000n));
  await usdc.connect(owner).approve(await rent.getAddress(), U(1_000_000n));
  await usdc.connect(honest).approve(await registry.getAddress(), U(1_000_000n));
  await usdc.connect(b).approve(await registry.getAddress(), U(1_000_000n));

  await registry.connect(owner).listProperty("ipfs://p", 1000n, U(1n)); // 1000 tokens at 1 USDC
  await registry.connect(honest).purchaseTokens(1n, sold.honest);
  await registry.connect(b).purchaseTokens(1n, sold.b);

  const [H, B, A] = await Promise.all([honest, b, a].map((s) => s.getAddress()));
  const start = { H: await usdc.balanceOf(H), B: await usdc.balanceOf(B), A: await usdc.balanceOf(A) };
  const got = async (who: "H" | "B" | "A") => (await usdc.balanceOf({ H, B, A }[who])) - start[who];
  return { owner, honest, b, a, H, B, A, usdc, registry, rent, got };
}

describe("RentDistributor across token transfers", () => {
  it("shuffling tokens between two wallets cannot collect the same rent twice", async () => {
    const { owner, honest, b, A, B, usdc, registry, rent, got } = await setup({ honest: 600n, b: 400n });

    await rent.connect(owner).depositRent(1n, U(1000n));               // 1 USDC per token
    await registry.connect(b).safeTransferFrom(B, A, 1n, 1n, "0x");   // B keeps 399, A holds 1
    await rent.connect(owner).depositRent(1n, U(1000n));               // 1 more USDC per token
    await rent.connect(b).claimRent(1n);
    await registry.connect(b).safeTransferFrom(B, A, 1n, 399n, "0x"); // then everything to A

    expect(await rent.pendingRent(A, 1n)).to.equal(0n);               // was 400 USDC before the fix
    await rent.connect(honest).claimRent(1n);                         // used to revert: pool drained

    expect(await got("H")).to.equal(U(1200n));                        // 600 tokens x 2 deposits
    expect(await got("B")).to.equal(U(799n));                         // 400 x #1 + 399 x #2
    expect(await got("A")).to.equal(U(1n));                           // 1 token x #2, nothing more
    expect(await usdc.balanceOf(await rent.getAddress())).to.equal(0n); // paid exactly what came in
  });

  it("a seller keeps the rent earned on the tokens it sells; the buyer gets none of it", async () => {
    const { owner, b, A, B, registry, rent, got } = await setup({ honest: 600n, b: 400n });

    await rent.connect(owner).depositRent(1n, U(1000n));
    await registry.connect(b).safeTransferFrom(B, A, 1n, 100n, "0x");

    expect(await got("B")).to.equal(U(400n));                         // all 400 tokens, not 300
    expect(await rent.pendingRent(A, 1n)).to.equal(0n);
    expect(await rent.pendingRent(B, 1n)).to.equal(0n);
  });

  it("buying more tokens later does not earn rent from before the purchase", async () => {
    const { owner, honest, H, registry, rent, got } = await setup({ honest: 100n, b: 400n });

    await rent.connect(owner).depositRent(1n, U(1000n));               // 1 USDC per token
    await rent.connect(honest).claimRent(1n);                         // 100
    await rent.connect(owner).depositRent(1n, U(1000n));               // honest still holds 100
    await registry.connect(honest).purchaseTokens(1n, 500n);          // now 600

    expect(await rent.pendingRent(H, 1n)).to.equal(0n);               // was 600 USDC before the fix
    expect(await got("H")).to.equal(U(200n) - U(500n));               // 100 + 100 rent, minus 500 paid for tokens
  });
});
