import { expect } from "chai";
import { ethers } from "hardhat";
import { PropertyRegistry, Marketplace, MockUSDC } from "../typechain-types";
import { Signer } from "ethers";

describe("Marketplace", () => {
  let usdc: MockUSDC;
  let registry: PropertyRegistry;
  let market: Marketplace;
  let owner: Signer;
  let seller: Signer;
  let buyer: Signer;
  let ownerAddr: string;
  let sellerAddr: string;
  let buyerAddr: string;

  const SUPPLY = 1000n;
  const PRICE = 50n * 10n ** 6n;   // $50 primary price
  const LIST_PRICE = 75n * 10n ** 6n; // $75 secondary price

  beforeEach(async () => {
    [owner, seller, buyer] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    sellerAddr = await seller.getAddress();
    buyerAddr = await buyer.getAddress();

    usdc = await ethers.deployContract("MockUSDC");
    registry = await ethers.deployContract("PropertyRegistry", [await usdc.getAddress()]);
    market = await ethers.deployContract("Marketplace", [
      await registry.getAddress(),
      await usdc.getAddress(),
    ]);

    // Mint USDC to all
    const big = 1_000_000n * 10n ** 6n;
    await usdc.mint(ownerAddr, big);
    await usdc.mint(sellerAddr, big);
    await usdc.mint(buyerAddr, big);

    // List property + seller buys 100 tokens
    await registry.connect(owner).listProperty("ipfs://test", SUPPLY, PRICE);
    const cost = 100n * PRICE;
    await usdc.connect(seller).approve(await registry.getAddress(), cost);
    await registry.connect(seller).purchaseTokens(1n, 100n);

    // Seller approves marketplace for ERC-1155 transfers
    await registry.connect(seller).setApprovalForAll(await market.getAddress(), true);
  });

  describe("createListing", () => {
    it("should create an active listing", async () => {
      await expect(market.connect(seller).createListing(1n, 50n, LIST_PRICE))
        .to.emit(market, "ListingCreated")
        .withArgs(1n, sellerAddr, 1n, 50n, LIST_PRICE);
    });

    it("should revert with zero amount", async () => {
      await expect(market.connect(seller).createListing(1n, 0n, LIST_PRICE))
        .to.be.revertedWithCustomError(market, "InvalidAmount");
    });

    it("should revert with zero price", async () => {
      await expect(market.connect(seller).createListing(1n, 50n, 0n))
        .to.be.revertedWithCustomError(market, "InvalidPrice");
    });

    it("should revert if seller has insufficient tokens", async () => {
      await expect(market.connect(seller).createListing(1n, 500n, LIST_PRICE))
        .to.be.revertedWithCustomError(market, "InsufficientTokenBalance");
    });

    it("should revert if marketplace not approved", async () => {
      // Revoke approval
      await registry.connect(seller).setApprovalForAll(await market.getAddress(), false);
      await expect(market.connect(seller).createListing(1n, 50n, LIST_PRICE))
        .to.be.revertedWithCustomError(market, "MarketplaceNotApproved");
    });
  });

  describe("buyListing", () => {
    let listingId: bigint;

    beforeEach(async () => {
      const tx = await market.connect(seller).createListing(1n, 50n, LIST_PRICE);
      listingId = 1n;
    });

    it("should atomically swap USDC and tokens", async () => {
      const totalCost = 50n * LIST_PRICE;
      await usdc.connect(buyer).approve(await market.getAddress(), totalCost);

      const buyerUSDCBefore = await usdc.balanceOf(buyerAddr);
      const sellerUSDCBefore = await usdc.balanceOf(sellerAddr);

      await expect(market.connect(buyer).buyListing(listingId))
        .to.emit(market, "ListingFulfilled")
        .withArgs(listingId, buyerAddr, totalCost);

      expect(await registry.balanceOf(buyerAddr, 1n)).to.equal(50n);
      expect(await usdc.balanceOf(buyerAddr)).to.equal(buyerUSDCBefore - totalCost);
      expect(await usdc.balanceOf(sellerAddr)).to.equal(sellerUSDCBefore + totalCost);
    });

    it("should mark listing as Sold", async () => {
      await usdc.connect(buyer).approve(await market.getAddress(), 50n * LIST_PRICE);
      await market.connect(buyer).buyListing(listingId);
      const listing = await market.getListing(listingId);
      expect(listing.status).to.equal(1n); // ListingStatus.Sold
    });

    it("should revert on double buy", async () => {
      await usdc.connect(buyer).approve(await market.getAddress(), 50n * LIST_PRICE);
      await market.connect(buyer).buyListing(listingId);
      await expect(market.connect(buyer).buyListing(listingId))
        .to.be.revertedWithCustomError(market, "ListingNotActive");
    });

    it("should revert if seller tries to buy their own listing", async () => {
      await expect(market.connect(seller).buyListing(listingId))
        .to.be.revertedWithCustomError(market, "SelfPurchaseNotAllowed");
    });
  });

  describe("cancelListing", () => {
    it("should cancel an active listing", async () => {
      await market.connect(seller).createListing(1n, 50n, LIST_PRICE);
      await expect(market.connect(seller).cancelListing(1n))
        .to.emit(market, "ListingCancelled")
        .withArgs(1n, sellerAddr);
    });

    it("should revert if not the seller", async () => {
      await market.connect(seller).createListing(1n, 50n, LIST_PRICE);
      await expect(market.connect(buyer).cancelListing(1n))
        .to.be.revertedWithCustomError(market, "NotListingSeller");
    });

    it("should revert on already cancelled listing", async () => {
      await market.connect(seller).createListing(1n, 50n, LIST_PRICE);
      await market.connect(seller).cancelListing(1n);
      await expect(market.connect(seller).cancelListing(1n))
        .to.be.revertedWithCustomError(market, "ListingNotActive");
    });
  });

  describe("getActiveListings", () => {
    it("should return only active listing IDs", async () => {
      await market.connect(seller).createListing(1n, 10n, LIST_PRICE);
      await market.connect(seller).createListing(1n, 10n, LIST_PRICE);
      await market.connect(seller).cancelListing(1n);

      const active = await market.getActiveListings(1n);
      expect(active.length).to.equal(1);
      expect(active[0]).to.equal(2n);
    });
  });
});
