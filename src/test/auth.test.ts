import { describe, it, expect, beforeAll } from "vitest";
import {
  makeJWT,
  validateJWT,
  hashPassword,
  checkPasswordHash,
  getBearerToken,
} from "../auth.js";
import { ForbiddenError } from "../api/errors.js";
import { Request } from "express";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });
});

describe("Create JWT", () => {
  const userId = "123456";
  const expiresIn = 1000;
  const signature = "supersecretsignature";

  const expiredId = "7890"
  const expiresInNow = 0;
  const expiredSignature = "expiresupersecretsignature"

  let tokenString: string;
  let expiredString: string;

  beforeAll(async () => {
    tokenString = makeJWT(userId, expiresIn, signature);
    expiredString = makeJWT(expiredId, expiresInNow, expiredSignature);
  });

  it("should return userId to a valid JWT", async () => {
    const result = validateJWT(tokenString, signature);
    expect(result).toBe(userId);
  });

  it("should throw exception for an expired token", async () => {
    expect(() => validateJWT(expiredString, expiredSignature)).toThrow(ForbiddenError);
    
  });
});

