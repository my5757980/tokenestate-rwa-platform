import { expect } from "chai";
import { ethers } from "hardhat";
import { PropertyRegistry, MockUSDC, RentDistributor } from "../typechain-types";

describe("PropertyRegistry", function () {
  let registry: PropertyRegistry;
  let usdc: MockUSDC;
  let rentDistributor: RentDistributor;
  let owner: any, seller: any, buyer: any, admin: any;

  const METADATA_CID = "QmTestCID123abc";
  const TOTAL_SUPPLY = 1000n;
  const PRICE_PER_TOKEN = 10_000_000n; // $10 USDC (6 decimals)

  beforeEach(async function () {
    [owner, seller, buyer, admin] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy RentDistributor with placeholder (will be updated)
    const RentDistributor = await ethers.getContractFactory("RentDistributor");

    const kyc = await ethers.deployContract("KYCBadge");
    await kyc.issueBadge(buyer.address);

    const Registry = await ethers.getContractFactory("PropertyRegistry");
    registry = await Registry.deploy(await usdc.getAddress(), await kyc.getAddress());

    rentDistributor = await RentDistributor.deploy(
      await usdc.getAddress(),
      await registry.getAddress()
    );

    await registry.setRentDistributor(await rentDistributor.getAddress());
  });

  // ─── US1: Property Tokenization ────────────────────────────────────────────

  describe("listProperty", function () {
    it("should list a property and mint ERC-1155 tokens", async function () {
      await expect(
        registry.connect(seller).listProperty(METADATA_CID, TOTAL_SUPPLY, PRICE_PER_TOKEN)
      )
        .to.emit(registry, "PropertyListed")
        .withArgs(1n, seller.address, METADATA_CID, TOTAL_SUPPLY, PRICE_PER_TOKEN);

      const property = await registry.getProperty(1n);
      expect(property.owner).to.equal(seller.address);
      expect(property.totalSupply).to.equal(TOTAL_SUPPLY);
      expect(property.pricePerToken).to.equal(PRICE_PER_TOKEN);
      expect(property.tokensSold).to.equal(0n);
      expect(property.active).to.equal(true);
    });

    it("should increment propertyCounter", async function () {
      await registry.connect(seller).listProperty(METADATA_CID, TOTAL_SUPPLY, PRICE_PER_TOKEN);
      await registry.connect(seller).listProperty("QmCID2", 500n, 5_000_000n);
      expect(await registry.totalProperties()).to.equal(2n);
    });

    it("should hold all minted tokens in registry contract", async function () {
      await registry.connect(seller).listProperty(METADATA_CID, TOTAL_SUPPLY, PRICE_PER_TOKEN);
      const registryBalance = await registry.balanceOf(await registry.getAddress(), 1n);
      expect(registryBalance).to.equal(TOTAL_SUPPLY);
    });

    it("should revert on zero totalSupply", async function () {
      await expect(
        registry.connect(seller).listProperty(METADATA_CID, 0n, PRICE_PER_TOKEN)
      ).to.be.revertedWithCustomError(registry, "InvalidTokenAmount");
    });

    it("should revert on zero pricePerToken", async function () {
      await expect(
        registry.connect(seller).listProperty(METADATA_CID, TOTAL_SUPPLY, 0n)
      ).to.be.revertedWithCustomError(registry, "InvalidPrice");
    });

    it("should revert on empty metadataCID", async function () {
      await expect(
        registry.connect(seller).listProperty("", TOTAL_SUPPLY, PRICE_PER_TOKEN)
      ).to.be.revertedWithCustomError(registry, "EmptyMetadataCID");
    });
  });

  describe("pauseProperty / unpauseProperty", function () {
    beforeEach(async function () {
      await registry.connect(seller).listProperty(METADATA_CID, TOTAL_SUPPLY, PRICE_PER_TOKEN);
    });

    it("should allow owner to pause their property", async function () {
      await registry.connect(seller).pauseProperty(1n);
      const property = await registry.getProperty(1n);
      expect(property.active).to.equal(false);
    });

    it("should allow owner to unpause their property", async function () {
      await registry.connect(seller).pauseProperty(1n);
      await registry.connect(seller).unpauseProperty(1n);
      const property = await registry.getProperty(1n);
      expect(property.active).to.equal(true);
    });

    it("should revert if non-owner tries to pause", async function () {
      await expect(
        registry.connect(buyer).pauseProperty(1n)
      ).to.be.revertedWithCustomError(registry, "NotPropertyOwner");
    });
  });

  // ─── US2: Fractional Investment ────────────────────────────────────────────

  describe("purchaseTokens", function () {
    beforeEach(async function () {
      await registry.connect(seller).listProperty(METADATA_CID, TOTAL_SUPPLY, PRICE_PER_TOKEN);
      // Mint USDC for buyer
      const purchaseCost = 10n * PRICE_PER_TOKEN;
      await usdc.mint(buyer.address, purchaseCost);
      await usdc.connect(buyer).approve(await registry.getAddress(), purchaseCost);
    });

    it("should transfer tokens to buyer on purchase", async function () {
      await expect(
        registry.connect(buyer).purchaseTokens(1n, 10n)
      )
        .to.emit(registry, "TokensPurchased")
        .withArgs(1n, buyer.address, 10n, 10n * PRICE_PER_TOKEN);

      expect(await registry.balanceOf(buyer.address, 1n)).to.equal(10n);
    });

    it("should deduct USDC from buyer and send to seller", async function () {
      const buyerBalanceBefore = await usdc.balanceOf(buyer.address);
      const sellerBalanceBefore = await usdc.balanceOf(seller.address);

      await registry.connect(buyer).purchaseTokens(1n, 10n);

      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalanceBefore - 10n * PRICE_PER_TOKEN);
      expect(await usdc.balanceOf(seller.address)).to.equal(sellerBalanceBefore + 10n * PRICE_PER_TOKEN);
    });

    it("should update tokensSold", async function () {
      await registry.connect(buyer).purchaseTokens(1n, 10n);
      const property = await registry.getProperty(1n);
      expect(property.tokensSold).to.equal(10n);
    });

    it("should revert if tokens exceed available supply", async function () {
      await usdc.mint(buyer.address, TOTAL_SUPPLY * PRICE_PER_TOKEN * 2n);
      await usdc.connect(buyer).approve(await registry.getAddress(), TOTAL_SUPPLY * PRICE_PER_TOKEN * 2n);
      await expect(
        registry.connect(buyer).purchaseTokens(1n, TOTAL_SUPPLY + 1n)
      ).to.be.revertedWithCustomError(registry, "InsufficientTokensAvailable");
    });

    it("should revert purchase on paused property", async function () {
      await registry.connect(seller).pauseProperty(1n);
      await expect(
        registry.connect(buyer).purchaseTokens(1n, 10n)
      ).to.be.revertedWithCustomError(registry, "PropertyNotActive");
    });

    it("should revert with zero amount", async function () {
      await expect(
        registry.connect(buyer).purchaseTokens(1n, 0n)
      ).to.be.revertedWithCustomError(registry, "InvalidTokenAmount");
    });
  });
});
