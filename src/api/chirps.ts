import type { Request, Response } from "express";

import { respondWithJSON } from "./json.js";
import { createChirpy, listAllChirps } from "../db/queries/chirps.js";
import { BadRequestError } from "./errors.js";
import { NewChirpy } from "src/db/schema.js";

export async function handlerCreateChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
    userId: string;
  };

  const params: parameters = req.body;

  const cleaned = validateChirp(params.body);

  const newChirpy: NewChirpy = {
    userId: params.userId,
    body: cleaned,
  };
  const createdChirpy: NewChirpy = await createChirpy(newChirpy);

  respondWithJSON(res, 201, createdChirpy);
}

function validateChirp(body: string) {
  const maxChirpLength = 140;
  if (body.length > maxChirpLength) {
    throw new BadRequestError(
      `Chirp is too long. Max length is ${maxChirpLength}`,
    );
  }

  const badWords = ["kerfuffle", "sharbert", "fornax"];
  return getCleanedBody(body, badWords);
}

function getCleanedBody(body: string, badWords: string[]) {
  const words = body.split(" ");

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const loweredWord = word.toLowerCase();
    if (badWords.includes(loweredWord)) {
      words[i] = "****";
    }
  }

  const cleaned = words.join(" ");
  return cleaned;
}

export async function handlerListAllChirps(_: Request, res: Response) {
  const chirps: NewChirpy[] = await listAllChirps();

  respondWithJSON(res, 200, chirps)
}


