import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { ForbiddenError } from "./api/errors.js";

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
    iss: "chirpy",
    sub: userID,
    iat: iat,
    exp: iat + expiresIn
  }

  return jwt.sign(payload, secret);

}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const verifiedJWT = jwt.verify(tokenString, secret);
    if(typeof verifiedJWT.sub === "string") {
      return verifiedJWT.sub;
    } else {
      return "";
    }
  } catch (err) {
    throw new ForbiddenError(`JWT token is invalid or has expired: ${tokenString}`);
  }

}
