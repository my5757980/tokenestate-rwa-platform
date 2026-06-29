import { expect } from "chai";
import { ethers } from "hardhat";
import { MockUSDC } from "../typechain-types";

describe("MockUSDC", function () {
  let usdc: MockUSDC;
  let owner: any, user1: any, user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
  });

  describe("Deployment", function () {
    it("should have correct name and symbol", async function () {
      expect(await usdc.name()).to.equal("USD Coin");
      expect(await usdc.symbol()).to.equal("USDC");
    });

    it("should have 6 decimals", async function () {
      expect(await usdc.decimals()).to.equal(6);
    });

    it("should start with zero total supply", async function () {
      expect(await usdc.totalSupply()).to.equal(0n);
    });
  });

  describe("Mint", function () {
    it("should mint tokens to a given address", async function () {
      const amount = 1_000_000_000n; // 1000 USDC (6 decimals)
      await usdc.mint(user1.address, amount);
      expect(await usdc.balanceOf(user1.address)).to.equal(amount);
    });

    it("should allow anyone to call mint (testnet)", async function () {
      await usdc.connect(user2).mint(user2.address, 500_000_000n);
      expect(await usdc.balanceOf(user2.address)).to.equal(500_000_000n);
    });

    it("should update total supply after mint", async function () {
      await usdc.mint(user1.address, 1_000_000n);
      await usdc.mint(user2.address, 2_000_000n);
      expect(await usdc.totalSupply()).to.equal(3_000_000n);
    });
  });

  describe("Transfer", function () {
    it("should transfer between accounts", async function () {
      await usdc.mint(user1.address, 1_000_000n);
      await usdc.connect(user1).transfer(user2.address, 400_000n);
      expect(await usdc.balanceOf(user1.address)).to.equal(600_000n);
      expect(await usdc.balanceOf(user2.address)).to.equal(400_000n);
    });

    it("should support approve and transferFrom", async function () {
      await usdc.mint(user1.address, 1_000_000n);
      await usdc.connect(user1).approve(user2.address, 500_000n);
      await usdc.connect(user2).transferFrom(user1.address, user2.address, 500_000n);
      expect(await usdc.balanceOf(user2.address)).to.equal(500_000n);
    });
  });
});
