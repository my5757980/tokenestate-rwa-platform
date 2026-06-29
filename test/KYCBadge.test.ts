import { expect } from "chai";
import { ethers } from "hardhat";
import { KYCBadge } from "../typechain-types";
import { Signer } from "ethers";

describe("KYCBadge", () => {
  let badge: KYCBadge;
  let admin: Signer;
  let investor1: Signer;
  let investor2: Signer;
  let adminAddr: string;
  let inv1Addr: string;
  let inv2Addr: string;

  beforeEach(async () => {
    [admin, investor1, investor2] = await ethers.getSigners();
    adminAddr = await admin.getAddress();
    inv1Addr = await investor1.getAddress();
    inv2Addr = await investor2.getAddress();
    badge = await ethers.deployContract("KYCBadge");
  });

  describe("Deployment", () => {
    it("should have correct name and symbol", async () => {
      expect(await badge.name()).to.equal("TokenEstate KYC Badge");
      expect(await badge.symbol()).to.equal("TEKYC");
    });

    it("should grant deployer KYC_ADMIN_ROLE", async () => {
      const role = await badge.KYC_ADMIN_ROLE();
      expect(await badge.hasRole(role, adminAddr)).to.be.true;
    });
  });

  describe("issueBadge", () => {
    it("should issue a badge to a new investor", async () => {
      await expect(badge.issueBadge(inv1Addr))
        .to.emit(badge, "BadgeIssued")
        .withArgs(inv1Addr, 1n);
    });

    it("should allow checking verification after issue", async () => {
      await badge.issueBadge(inv1Addr);
      expect(await badge.isVerified(inv1Addr)).to.be.true;
    });

    it("should revert if investor already has a badge", async () => {
      await badge.issueBadge(inv1Addr);
      await expect(badge.issueBadge(inv1Addr))
        .to.be.revertedWithCustomError(badge, "AlreadyHasBadge")
        .withArgs(inv1Addr);
    });

    it("should revert if caller lacks KYC_ADMIN_ROLE", async () => {
      await expect(badge.connect(investor1).issueBadge(inv2Addr))
        .to.be.revertedWithCustomError(badge, "AccessControlUnauthorizedAccount");
    });
  });

  describe("revokeBadge", () => {
    it("should mark badge as revoked", async () => {
      await badge.issueBadge(inv1Addr);
      const tokenId = await badge.getBadgeId(inv1Addr);
      await expect(badge.revokeBadge(inv1Addr))
        .to.emit(badge, "BadgeRevoked")
        .withArgs(inv1Addr, tokenId);
    });

    it("should return false for isVerified after revoke", async () => {
      await badge.issueBadge(inv1Addr);
      await badge.revokeBadge(inv1Addr);
      expect(await badge.isVerified(inv1Addr)).to.be.false;
    });

    it("should revert if holder has no badge", async () => {
      await expect(badge.revokeBadge(inv1Addr))
        .to.be.revertedWithCustomError(badge, "NoBadgeFound");
    });
  });

  describe("Soulbound — non-transferable", () => {
    it("should revert on transfer attempt", async () => {
      await badge.issueBadge(inv1Addr);
      const tokenId = await badge.getBadgeId(inv1Addr);
      await expect(badge.connect(investor1).transferFrom(inv1Addr, inv2Addr, tokenId))
        .to.be.revertedWithCustomError(badge, "NonTransferable");
    });

    it("should revert on safeTransferFrom attempt", async () => {
      await badge.issueBadge(inv1Addr);
      const tokenId = await badge.getBadgeId(inv1Addr);
      await expect(
        badge.connect(investor1)["safeTransferFrom(address,address,uint256)"](inv1Addr, inv2Addr, tokenId)
      ).to.be.revertedWithCustomError(badge, "NonTransferable");
    });
  });

  describe("isVerified", () => {
    it("should return false for unverified address", async () => {
      expect(await badge.isVerified(inv1Addr)).to.be.false;
    });
  });
});
