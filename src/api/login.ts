import type { Request, Response } from "express";

import { BadRequestError, UnauthorizedError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { checkPasswordHash } from "../auth.js";
import { getUserByEmail } from "../db/queries/users.js";
import { NewUser } from "../db/schema.js";


export async function handlerLogin(req: Request, res: Response) {
  type parameters = {
    password: string,
    email: string;
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

  if(!user || !user.hashedPassword || !await checkPasswordHash(password, user.hashedPassword)) {
    throw new UnauthorizedError("incorrect email or password");
  }

  respondWithJSON(res, 200, {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email
  })
  

}
