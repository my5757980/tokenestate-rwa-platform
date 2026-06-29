import { expect } from "chai";
import { ethers } from "hardhat";
import { PropertyRegistry, RentDistributor, MockUSDC } from "../typechain-types";
import { Signer } from "ethers";

describe("RentDistributor", () => {
  let usdc: MockUSDC;
  let registry: PropertyRegistry;
  let rent: RentDistributor;
  let owner: Signer;
  let investor1: Signer;
  let investor2: Signer;
  let ownerAddr: string;
  let inv1Addr: string;
  let inv2Addr: string;

  const SUPPLY = 1000n;
  const PRICE = 100n * 10n ** 6n;  // $100 USDC per token
  const RENT = 500n * 10n ** 6n;   // $500 USDC rent deposit

  beforeEach(async () => {
    [owner, investor1, investor2] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    inv1Addr = await investor1.getAddress();
    inv2Addr = await investor2.getAddress();

    usdc = await ethers.deployContract("MockUSDC");
    registry = await ethers.deployContract("PropertyRegistry", [await usdc.getAddress()]);
    rent = await ethers.deployContract("RentDistributor", [
      await usdc.getAddress(),
      await registry.getAddress(),
    ]);
    await registry.setRentDistributor(await rent.getAddress());

    // Mint USDC to everyone
    const big = 1_000_000n * 10n ** 6n;
    await usdc.mint(ownerAddr, big);
    await usdc.mint(inv1Addr, big);
    await usdc.mint(inv2Addr, big);
  });

  async function listAndBuy(investor: Signer, amount: bigint) {
    // List property
    await registry.connect(owner).listProperty("ipfs://test", SUPPLY, PRICE);
    const propId = 1n;
    // Investor buys `amount` tokens
    const cost = amount * PRICE;
    await usdc.connect(investor).approve(await registry.getAddress(), cost);
    await registry.connect(investor).purchaseTokens(propId, amount);
    return propId;
  }

  describe("depositRent", () => {
    it("should accept rent deposit from property owner", async () => {
      const propId = await listAndBuy(investor1, 100n);
      await usdc.connect(owner).approve(await rent.getAddress(), RENT);
      await expect(rent.connect(owner).depositRent(propId, RENT))
        .to.emit(rent, "RentDeposited")
        .withArgs(propId, ownerAddr, RENT);
    });

    it("should update totalRentPerToken accumulator", async () => {
      const propId = await listAndBuy(investor1, 100n);
      await usdc.connect(owner).approve(await rent.getAddress(), RENT);
      await rent.connect(owner).depositRent(propId, RENT);
      const accum = await rent.totalRentPerToken(propId);
      expect(accum).to.be.gt(0n);
    });

    it("should revert if caller is not property owner", async () => {
      const propId = await listAndBuy(investor1, 100n);
      await usdc.connect(investor1).approve(await rent.getAddress(), RENT);
      await expect(rent.connect(investor1).depositRent(propId, RENT))
        .to.be.revertedWithCustomError(rent, "NotPropertyOwner");
    });

    it("should revert on zero amount", async () => {
      const propId = await listAndBuy(investor1, 100n);
      await expect(rent.connect(owner).depositRent(propId, 0n))
        .to.be.revertedWithCustomError(rent, "ZeroRentAmount");
    });
  });

  describe("pendingRent", () => {
    it("should return zero before any rent deposited", async () => {
      const propId = await listAndBuy(investor1, 100n);
      expect(await rent.pendingRent(inv1Addr, propId)).to.equal(0n);
    });

    it("should calculate pending rent proportional to token balance", async () => {
      // investor1 buys 300, investor2 buys 200, total sold = 500
      await registry.connect(owner).listProperty("ipfs://test", SUPPLY, PRICE);
      const propId = 1n;

      const cost1 = 300n * PRICE;
      await usdc.connect(investor1).approve(await registry.getAddress(), cost1);
      await registry.connect(investor1).purchaseTokens(propId, 300n);

      const cost2 = 200n * PRICE;
      await usdc.connect(investor2).approve(await registry.getAddress(), cost2);
      await registry.connect(investor2).purchaseTokens(propId, 200n);

      // Deposit $1000 rent across 1000 token supply
      const rent1000 = 1000n * 10n ** 6n;
      await usdc.connect(owner).approve(await rent.getAddress(), rent1000);
      await rent.connect(owner).depositRent(propId, rent1000);

      const pending1 = await rent.pendingRent(inv1Addr, propId);
      const pending2 = await rent.pendingRent(inv2Addr, propId);

      // investor1 has 300/1000 = 30% → $300
      expect(pending1).to.equal(300n * 10n ** 6n);
      // investor2 has 200/1000 = 20% → $200
      expect(pending2).to.equal(200n * 10n ** 6n);
    });
  });

  describe("claimRent", () => {
    it("should transfer USDC to investor on claim", async () => {
      const propId = await listAndBuy(investor1, 100n);
      await usdc.connect(owner).approve(await rent.getAddress(), RENT);
      await rent.connect(owner).depositRent(propId, RENT);

      const before = await usdc.balanceOf(inv1Addr);
      await expect(rent.connect(investor1).claimRent(propId))
        .to.emit(rent, "RentClaimed")
        .withArgs(propId, inv1Addr, (100n * RENT) / SUPPLY); // 100/1000 * 500 = 50

      const after = await usdc.balanceOf(inv1Addr);
      expect(after - before).to.equal((100n * RENT) / SUPPLY);
    });

    it("should revert if nothing to claim", async () => {
      const propId = await listAndBuy(investor1, 100n);
      await expect(rent.connect(investor1).claimRent(propId))
        .to.be.revertedWithCustomError(rent, "NothingToClaim");
    });

    it("should zero pending after claim", async () => {
      const propId = await listAndBuy(investor1, 100n);
      await usdc.connect(owner).approve(await rent.getAddress(), RENT);
      await rent.connect(owner).depositRent(propId, RENT);
      await rent.connect(investor1).claimRent(propId);
      expect(await rent.pendingRent(inv1Addr, propId)).to.equal(0n);
    });
  });

  describe("claimRentBatch", () => {
    it("should claim rent from multiple properties in one tx", async () => {
      // List 2 properties
      await registry.connect(owner).listProperty("ipfs://prop1", SUPPLY, PRICE);
      await registry.connect(owner).listProperty("ipfs://prop2", SUPPLY, PRICE);

      const cost = 100n * PRICE;
      await usdc.connect(investor1).approve(await registry.getAddress(), cost * 2n);
      await registry.connect(investor1).purchaseTokens(1n, 100n);
      await registry.connect(investor1).purchaseTokens(2n, 100n);

      await usdc.connect(owner).approve(await rent.getAddress(), RENT * 2n);
      await rent.connect(owner).depositRent(1n, RENT);
      await rent.connect(owner).depositRent(2n, RENT);

      const before = await usdc.balanceOf(inv1Addr);
      await rent.connect(investor1).claimRentBatch([1n, 2n]);
      const after = await usdc.balanceOf(inv1Addr);

      expect(after - before).to.equal(2n * ((100n * RENT) / SUPPLY));
    });
  });
});
