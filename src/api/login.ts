import type { Request, Response } from "express";

import { BadRequestError, UnauthorizedError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash, makeJWT } from "../auth.js";
import { getUserByEmail } from "../db/queries/users.js";
import { NewUser } from "../db/schema.js";
import { config } from "../config.js";
import { UserResponse } from "./users.js";


type LoginResponse = UserResponse & {
  token: string;
};

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

  let duration: number = config.jwt.defaultDuration;
  
  if(params.expiresInSeconds && params.expiresInSeconds < config.jwt.defaultDuration) {
    duration = params.expiresInSeconds;
  }
  
  const token = makeJWT(user.id, duration, config.jwt.secret);   

  respondWithJSON(res, 200, {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    token: token
  } satisfies LoginResponse )
  

}
