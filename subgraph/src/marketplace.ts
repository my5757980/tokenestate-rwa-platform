import { BigInt } from "@graphprotocol/graph-ts";
import { ListingCreated, ListingFulfilled, ListingCancelled } from "../generated/Marketplace/Marketplace";
import { Listing } from "../generated/schema";

export function handleListingCreated(event: ListingCreated): void {
  const id = event.params.listingId.toString();
  const l = new Listing(id);
  l.listingId = event.params.listingId;
  l.seller = event.params.seller;
  l.property = event.params.propertyId.toString();
  l.amount = event.params.amount;
  l.pricePerToken = event.params.pricePerToken;
  l.status = 0; // Active
  l.createdAt = event.block.timestamp;
  l.txHash = event.transaction.hash;
  l.save();
}

export function handleListingFulfilled(event: ListingFulfilled): void {
  const l = Listing.load(event.params.listingId.toString());
  if (!l) return;
  l.status = 1; // Sold
  l.save();
}

export function handleListingCancelled(event: ListingCancelled): void {
  const l = Listing.load(event.params.listingId.toString());
  if (!l) return;
  l.status = 2; // Cancelled
  l.save();
}
