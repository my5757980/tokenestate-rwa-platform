// Seeds the live Sepolia deployment with three demo properties and runs every user flow once,
// checking balances after each step: KYC, primary purchase, rent deposit + claim, marketplace sale.
// Run: npx hardhat run scripts/seed-demo.ts --network sepolia   (keys come from .env, never printed)
import { ethers } from "hardhat";
import * as fs from "fs";
import type { PropertyRegistry, RentDistributor, Marketplace, KYCBadge, MockUSDC } from "../typechain-types";

const ADDR = {
  registry: "0x0970bb32A1F21a94DF5Bb23f37f180f5EEd8f5E9",
  rent: "0xfCC46865f53fb17f78ea885E43B07E2848298c97",
  market: "0x33BB456DfA41FA4b1D9a3Cfc2CA66588E260d340",
  kyc: "0x4149C0d1Dc520ce4b8EcE0ee212b64c9369F776C",
  usdc: "0xcc5Af8412f3c2951630Aeeafeb8b70E4B0BC9ac3",
};
const USDC = (n: number) => BigInt(Math.round(n * 1e6));
const PROPS = [
  { name: "Marina Heights Apartment", cid: "QmZKr62FJtA7qnkyHXYnCRpRgGa4Lecb8fNfTFxKC5Cpiu", supply: 1000n, price: USDC(250) },
  { name: "Clifton Sea View Villa", cid: "QmP2AFN9qXhn77NBFbtoAqmv1YA5uT4MHcXuTUxCWaDm8f", supply: 900n, price: USDC(200) },
  { name: "Gulberg Commercial Plaza", cid: "QmWhsqsAxbZ7qQWkLfYjUqbELZpmo5BsZPduWS6YSu89a8", supply: 2000n, price: USDC(250) },
];

function check(ok: boolean, what: string) {
  if (!ok) throw new Error(`CHECK FAILED: ${what}`);
  console.log(`  ✔ ${what}`);
}

async function main() {
  const provider = ethers.provider;
  const [owner] = await ethers.getSigners();

  // A second wallet plays the investor. Its key is kept in .env next to the deployer's.
  let buyerKey = process.env.DEMO_BUYER_PRIVATE_KEY;
  if (!buyerKey) {
    buyerKey = ethers.Wallet.createRandom().privateKey;
    fs.appendFileSync(".env", `DEMO_BUYER_PRIVATE_KEY=${buyerKey}\n`);
  }
  const buyer = new ethers.Wallet(buyerKey, provider);
  console.log("owner", owner.address, "| buyer", buyer.address);

  // Track nonces locally: the public RPC is load-balanced and can report a stale count.
  const nonce: Record<string, number> = {
    [owner.address]: await provider.getTransactionCount(owner.address, "pending"),
    [buyer.address]: await provider.getTransactionCount(buyer.address, "pending"),
  };
  const send = async (label: string, from: string, fn: (o: { nonce: number }) => Promise<any>) => {
    const tx = await fn({ nonce: nonce[from]++ });
    const r = await tx.wait();
    if (r.status !== 1) throw new Error(`${label} reverted`);
    console.log(`${label}: ${tx.hash}`);
    return r;
  };

  const registry = (await ethers.getContractAt("PropertyRegistry", ADDR.registry)) as unknown as PropertyRegistry;
  const rent = (await ethers.getContractAt("RentDistributor", ADDR.rent)) as unknown as RentDistributor;
  const market = (await ethers.getContractAt("Marketplace", ADDR.market)) as unknown as Marketplace;
  const kyc = (await ethers.getContractAt("KYCBadge", ADDR.kyc)) as unknown as KYCBadge;
  const usdc = (await ethers.getContractAt("MockUSDC", ADDR.usdc)) as unknown as MockUSDC;

  // 0. gas for the buyer
  if ((await provider.getBalance(buyer.address)) < ethers.parseEther("0.002")) {
    await send("fund buyer 0.004 ETH", owner.address, o => owner.sendTransaction({ to: buyer.address, value: ethers.parseEther("0.004"), ...o }));
  }

  // 1. KYC badges (the owner needs one too, to buy on the marketplace later)
  for (const w of [owner.address, buyer.address]) {
    if (!(await kyc.isVerified(w))) await send(`KYC badge -> ${w.slice(0, 8)}`, owner.address, o => kyc.connect(owner).issueBadge(w, o));
  }
  check(await kyc.isVerified(owner.address) && await kyc.isVerified(buyer.address), "owner and buyer are KYC verified");

  // 2. list the three properties (only once)
  if ((await registry.totalProperties()) === 0n) {
    for (const p of PROPS) await send(`list ${p.name}`, owner.address, o => registry.connect(owner).listProperty(p.cid, p.supply, p.price, o));
  }
  check((await registry.totalProperties()) >= 3n, "three properties are listed");
  const p1 = await registry.getProperty(1);
  check(p1.metadataCID === PROPS[0].cid && p1.pricePerToken === PROPS[0].price, "property #1 carries the right CID and price");

  // 3. investor buys in the primary sale
  await send("mint 20,000 test USDC to buyer", buyer.address, o => usdc.connect(buyer).mint(buyer.address, USDC(20000), o));
  await send("buyer approves registry", buyer.address, o => usdc.connect(buyer).approve(ADDR.registry, ethers.MaxUint256, o));
  const usdcBefore = await usdc.balanceOf(buyer.address);
  await send("buyer purchases 20 tokens of #1", buyer.address, o => registry.connect(buyer).purchaseTokens(1, 20, o));
  await send("buyer purchases 10 tokens of #2", buyer.address, o => registry.connect(buyer).purchaseTokens(2, 10, o));
  check((await registry.balanceOf(buyer.address, 1)) === 20n && (await registry.balanceOf(buyer.address, 2)) === 10n, "buyer holds 20 of #1 and 10 of #2");
  check(usdcBefore - (await usdc.balanceOf(buyer.address)) === 20n * PROPS[0].price + 10n * PROPS[1].price, "buyer paid exactly 20x250 + 10x200 USDC");

  // 4. owner deposits rent; only the sold share (20 of 1,000 tokens) is collected and owed to holders
  await send("mint 50,000 test USDC to owner", owner.address, o => usdc.connect(owner).mint(owner.address, USDC(50000), o));
  await send("owner approves rent distributor", owner.address, o => usdc.connect(owner).approve(ADDR.rent, ethers.MaxUint256, o));
  await send("owner deposits 10,000 USDC rent on #1", owner.address, o => rent.connect(owner).depositRent(1, USDC(10000), o));
  const pending = await rent.pendingRent(buyer.address, 1);
  check(pending === USDC(200), `buyer's pending rent is 200 USDC (20/1000 of 10,000), got ${Number(pending) / 1e6}`);
  const beforeClaim = await usdc.balanceOf(buyer.address);
  await send("buyer claims rent on #1", buyer.address, o => rent.connect(buyer).claimRent(1, o));
  check((await usdc.balanceOf(buyer.address)) - beforeClaim === USDC(200), "buyer received 200 USDC rent");
  check((await rent.pendingRent(buyer.address, 1)) === 0n, "nothing left to claim (no double claim)");

  // 5. marketplace: buyer lists 5 tokens, owner buys them; then a second listing stays open for the demo
  await send("buyer approves marketplace for tokens", buyer.address, o => registry.connect(buyer).setApprovalForAll(ADDR.market, true, o));
  const rcA = await send("buyer lists 5 tokens of #1 at 260 USDC", buyer.address, o => market.connect(buyer).createListing(1, 5, USDC(260), o));
  const idA = market.interface.parseLog(rcA.logs.find((l: any) => l.address.toLowerCase() === ADDR.market.toLowerCase()))!.args[0];
  await send("owner approves marketplace for USDC", owner.address, o => usdc.connect(owner).approve(ADDR.market, ethers.MaxUint256, o));
  const sellerBefore = await usdc.balanceOf(buyer.address);
  await send(`owner buys listing #${idA}`, owner.address, o => market.connect(owner).buyListing(idA, o));
  check((await registry.balanceOf(buyer.address, 1)) === 15n && (await registry.balanceOf(owner.address, 1)) === 5n, "5 tokens moved from buyer to owner");
  check((await usdc.balanceOf(buyer.address)) - sellerBefore === 5n * USDC(260), "seller received 5 x 260 USDC");
  await send("buyer lists 4 tokens of #2 at 210 USDC (stays open)", buyer.address, o => market.connect(buyer).createListing(2, 4, USDC(210), o));

  console.log("\nALL CHECKS PASSED");
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
