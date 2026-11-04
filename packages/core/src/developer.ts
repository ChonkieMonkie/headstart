// Headstart, a study companion that helps you get started, stay focused and keep going.
// Copyright (C) 2026  ChonkieMonkie
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

// Signed developer tokens and item grants. Only the holder of a private key
// can make them; the app carries the public keys and can only check them.
// A grant names the installation it is for, so a copied grant does nothing
// on another computer, and the projection checks every grant again.

import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import { hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

ed.hashes.sha512 = sha512;

/**
 * Public keys allowed to sign developer tokens and grants, oldest first.
 * A new key is added (never swapped) so older grants stay valid; a leaked
 * key is removed in the next release.
 */
export const DEVELOPER_KEYS: readonly string[] = [
  "339a179fcaa34c5c869513a7c232d98c6f2efbeb7d8610d2ed699cd7334ec01f",
];

/** A JSON payload and its Ed25519 signature, both as text. */
export interface Signed {
  /** The exact JSON text that was signed. */
  payload: string;
  /** Hex signature of the payload's UTF-8 bytes. */
  signature: string;
}

/** One Exotic item for one installation. */
export interface ItemGrant {
  v: 1;
  kind: "item";
  grantId: string;
  itemId: string;
  installId: string;
  issuedAt: string;
}

/** Unlocks the developer menu on one installation and carries its grants. */
export interface DeveloperToken {
  v: 1;
  kind: "developer";
  installId: string;
  issuedAt: string;
  grants: Signed[];
}

const HEX = /^[0-9a-f]+$/i;

/** The payload, parsed, when one of `keys` signed it. Null for anything else. */
export function verifySigned(signed: unknown, keys: readonly string[] = DEVELOPER_KEYS): unknown {
  if (!signed || typeof signed !== "object") return null;
  const { payload, signature } = signed as Partial<Signed>;
  if (typeof payload !== "string" || typeof signature !== "string" || !HEX.test(signature))
    return null;
  if (signature.length !== 128) return null;
  const message = utf8ToBytes(payload);
  const sig = hexToBytes(signature);
  for (const key of keys) {
    if (key.length !== 64 || !HEX.test(key)) continue;
    try {
      if (ed.verify(sig, message, hexToBytes(key))) return JSON.parse(payload);
    } catch {
      // a malformed signature or payload is simply not valid
    }
  }
  return null;
}

/** A grant that checks out, or null. */
export function readGrant(
  signed: unknown,
  keys: readonly string[] = DEVELOPER_KEYS,
): ItemGrant | null {
  const grant = verifySigned(signed, keys) as Partial<ItemGrant> | null;
  if (grant?.v !== 1 || grant.kind !== "item") return null;
  for (const field of ["grantId", "itemId", "installId", "issuedAt"] as const) {
    if (typeof grant[field] !== "string" || grant[field] === "") return null;
  }
  return grant as ItemGrant;
}

/**
 * The developer token in a token file, if it is signed and made for this
 * installation. Its grants are checked one by one when they are used.
 */
export function readDeveloperToken(
  fileText: string,
  installId: string,
  keys: readonly string[] = DEVELOPER_KEYS,
): DeveloperToken | null {
  let file: unknown;
  try {
    file = JSON.parse(fileText);
  } catch {
    return null;
  }
  const token = verifySigned(file, keys) as Partial<DeveloperToken> | null;
  if (token?.v !== 1 || token.kind !== "developer") return null;
  if (token.installId !== installId || !Array.isArray(token.grants)) return null;
  return token as DeveloperToken;
}
