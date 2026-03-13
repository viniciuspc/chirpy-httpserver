import type { Request, Response } from "express";

import { BadRequestError, UnauthorizedError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash, makeJWT } from "../auth.js";
import { getUserByEmail } from "../db/queries/users.js";
import { NewUser } from "../db/schema.js";
import { config } from "../config.js";


export async function handlerLogin(req: Request, res: Response) {
  type parameters = {
    password: string,
    email: string,
    expiresInSeconds?: number;
  };

  const params: parameters = req.body;
  const email = params.email;
  
  if (!email) {
    throw new BadRequestError("Provide an email to create a new user.");
  }

  const password = params.password;
  if (!password) {
    throw new BadRequestError("Provide a password to create a new user.");
  }
  
  const user: NewUser = await getUserByEmail(email);

  if(!user || !user.id || !user.hashedPassword || !await checkPasswordHash(password, user.hashedPassword)) {
    throw new UnauthorizedError("incorrect email or password");
  }

  let maxExpiresInSeconds: number = 60 * 60; // 1 Hour
  
  if(params.expiresInSeconds && params.expiresInSeconds < maxExpiresInSeconds) {
    maxExpiresInSeconds = params.expiresInSeconds;
  }
  
  const token = makeJWT(user.id, maxExpiresInSeconds, config.api.secret);   

  respondWithJSON(res, 200, {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    token: token
  })
  

}
