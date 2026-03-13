import type { Request } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { ForbiddenError } from "./api/errors.js";

const TOKEN_ISSUER = "chirpy";
type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string{
  const iat = Math.floor(Date.now() / 1000);

  const payload: payload = {
    iss: TOKEN_ISSUER,
    sub: userID,
    iat: iat,
    exp: iat + expiresIn
  }

  return jwt.sign(payload, secret, {algorithm: "HS256"});

}

export function validateJWT(tokenString: string, secret: string) {
  let decoded: payload;
  try {
    decoded = jwt.verify(tokenString, secret) as JwtPayload;
  } catch (e) {
    throw new ForbiddenError("Invalid token");
  }

  if (decoded.iss !== TOKEN_ISSUER) {
    throw new ForbiddenError("Invalid issuer");
  }

  if (!decoded.sub) {
    throw new ForbiddenError("No user ID in token");
  }

  return decoded.sub;
}

export function getBearerToken(req: Request): string {
  const authorization = req.get("Authorization");
  if(!authorization) {
    throw new ForbiddenError("No Authorization header found");
  }
  const splitAuthorization = authorization.split(" ");
  
  if(splitAuthorization.length < 2) {
    throw new ForbiddenError("No bearer token found in Authorization header");
  }

  return splitAuthorization[1];
  
}
