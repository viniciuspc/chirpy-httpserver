import type { Request, Response } from "express";

import { createUser } from "../db/queries/users.js";
import { NewUser } from "src/db/schema";
import { BadRequestError } from "./errors.js";
import { respondWithJSON } from "./json.js";

export async function handlerCreateUser(req: Request, res: Response) {
  type parameters = {
    email: string;
  };

  const params: parameters = req.body;
  const email = params.email;
  
  if (!email) {
    throw new BadRequestError("Provide an email to create a new user.");
  }

  const newUser: NewUser = { email: params.email };

  const createdUser: NewUser = await createUser(newUser);
  
  if(!createdUser) {
    throw new Error("Could not create user");
  }
  
  respondWithJSON(res, 201, createdUser);
}


