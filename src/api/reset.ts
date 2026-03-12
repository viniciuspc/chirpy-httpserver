import type { Request, Response } from "express";
import { config } from "../config.js";
import { ForbiddenError } from "./errors.js";
import { deleteAllUsers } from "../db/queries/users.js";



export const handlerReset = async (_: Request, res: Response) => {
  const { platform } = config.api;

  if (platform != "dev") {
    throw new ForbiddenError("Reset endpoint only allowed in dev.");
  }
  
  await deleteAllUsers();

  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits reset to 0`);
};

