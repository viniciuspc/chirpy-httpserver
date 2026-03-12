import type { Request, Response } from "express";

import { createUser } from "../db/queries/users.js";
import { NewUser } from "src/db/schema.js";
import { BadRequestError } from "./errors.js";
import { respondWithJSON } from "./json.js";
import { hashPassword } from "../auth.js";

export type UserResponse = Omit<NewUser, "hashedPassword"> 

export async function handlerCreateUser(req: Request, res: Response) {
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

  const hashedPassowrd = await hashPassword(password);


  const newUser: NewUser = { email: params.email, hashedPassword: hashedPassowrd };

  const createdUser: UserResponse = await createUser(newUser);
  
  if(!createdUser) {
    throw new Error("Could not create user");
  }
  
  respondWithJSON(res, 201, createdUser);
}


