import type { Request, Response } from "express";

import { respondWithJSON } from "./json.js";
import { createChirpy, getChirpy, listAllChirps } from "../db/queries/chirps.js";
import { BadRequestError, NotFoundError } from "./errors.js";
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

export async function handlerGetChirpy(req: Request, res: Response) {
  const chirpyId = req.params.chirpyId;
  
  if(Array.isArray(chirpyId)){
    throw new BadRequestError("Only one chirpy id is allowed.")   
  }


  const chirpy = await getChirpy(chirpyId);

  if(!chirpy) {
    throw new NotFoundError(`Can't fin chirpy with id ${chirpyId}`);
  }

  respondWithJSON(res, 200, chirpy);
  
}
