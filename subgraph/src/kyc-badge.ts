import { BadgeIssued, BadgeRevoked } from "../generated/KYCBadge/KYCBadge";
import { KYCBadge } from "../generated/schema";

export function handleBadgeIssued(event: BadgeIssued): void {
  const id = event.params.holder.toHexString();
  const b = new KYCBadge(id);
  b.holder = event.params.holder;
  b.tokenId = event.params.tokenId;
  b.revoked = false;
  b.issuedAt = event.block.timestamp;
  b.save();
}

export function handleBadgeRevoked(event: BadgeRevoked): void {
  const b = KYCBadge.load(event.params.holder.toHexString());
  if (!b) return;
  b.revoked = true;
  b.save();
}
