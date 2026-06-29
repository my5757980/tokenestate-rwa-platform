import { BigInt } from "@graphprotocol/graph-ts";
import { RentDeposited, RentClaimed } from "../generated/RentDistributor/RentDistributor";
import { RentDistribution, RentClaim } from "../generated/schema";

export function handleRentDeposited(event: RentDeposited): void {
  const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const d = new RentDistribution(id);
  d.property = event.params.propertyId.toString();
  d.depositor = event.params.depositor;
  d.amount = event.params.amount;
  d.timestamp = event.block.timestamp;
  d.txHash = event.transaction.hash;
  d.save();
}

export function handleRentClaimed(event: RentClaimed): void {
  const id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const c = new RentClaim(id);
  c.property = event.params.propertyId.toString();
  c.claimant = event.params.claimer;
  c.amount = event.params.amount;
  c.timestamp = event.block.timestamp;
  c.txHash = event.transaction.hash;
  c.save();
}
