import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  PropertyListed,
  TokensPurchased,
  PropertyPaused,
  PropertyUnpaused,
  TransferSingle,
  TransferBatch,
} from "../generated/PropertyRegistry/PropertyRegistry";
import { Property, Holding } from "../generated/schema";

export function handlePropertyListed(event: PropertyListed): void {
  const id = event.params.propertyId.toString();
  const p = new Property(id);
  p.owner = event.params.owner;
  p.metadataCID = event.params.metadataCID;
  p.totalSupply = event.params.totalSupply;
  p.pricePerToken = event.params.pricePerToken;
  p.tokensSold = BigInt.fromI32(0);
  p.active = true;
  p.createdAt = event.block.timestamp;
  p.save();
}

export function handleTokensPurchased(event: TokensPurchased): void {
  const id = event.params.propertyId.toString();
  const p = Property.load(id);
  if (!p) return;
  p.tokensSold = p.tokensSold.plus(event.params.amount);
  p.save();
  // The buyer's holding is credited by handleTransferSingle: the purchase also emits TransferSingle,
  // so adding the amount here as well counted every purchased token twice.
}

export function handlePropertyPaused(event: PropertyPaused): void {
  const p = Property.load(event.params.propertyId.toString());
  if (!p) return;
  p.active = false;
  p.save();
}

export function handlePropertyUnpaused(event: PropertyUnpaused): void {
  const p = Property.load(event.params.propertyId.toString());
  if (!p) return;
  p.active = true;
  p.save();
}

export function handleTransferSingle(event: TransferSingle): void {
  const from = event.params.from;
  const to = event.params.to;
  const id = event.params.id.toString();
  const value = event.params.value;

  if (from.toHexString() != "0x0000000000000000000000000000000000000000") {
    const holdingId = id + "-" + from.toHexString();
    const h = Holding.load(holdingId);
    if (h) {
      h.balance = h.balance.minus(value);
      h.updatedAt = event.block.timestamp;
      h.save();
    }
  }

  if (to.toHexString() != "0x0000000000000000000000000000000000000000") {
    const holdingId = id + "-" + to.toHexString();
    let h = Holding.load(holdingId);
    if (!h) {
      h = new Holding(holdingId);
      h.property = id;
      h.holder = to;
      h.balance = BigInt.fromI32(0);
    }
    h.balance = h.balance.plus(value);
    h.updatedAt = event.block.timestamp;
    h.save();
  }
}

export function handleTransferBatch(event: TransferBatch): void {
  const from = event.params.from;
  const to = event.params.to;
  const ids = event.params.ids;
  const values = event.params.values;
  const zeroAddr = "0x0000000000000000000000000000000000000000";

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i].toString();
    const value = values[i];

    if (from.toHexString() != zeroAddr) {
      const holdingId = id + "-" + from.toHexString();
      const h = Holding.load(holdingId);
      if (h) {
        h.balance = h.balance.minus(value);
        h.updatedAt = event.block.timestamp;
        h.save();
      }
    }

    if (to.toHexString() != zeroAddr) {
      const holdingId = id + "-" + to.toHexString();
      let h = Holding.load(holdingId);
      if (!h) {
        h = new Holding(holdingId);
        h.property = id;
        h.holder = to;
        h.balance = BigInt.fromI32(0);
      }
      h.balance = h.balance.plus(value);
      h.updatedAt = event.block.timestamp;
      h.save();
    }
  }
}
