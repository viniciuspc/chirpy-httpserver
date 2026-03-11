import { db } from "../index.js";
import { chirps, NewChirpy } from "../schema.js";

export async function createChirpy(chirpy: NewChirpy) {
  const [result] = await db
    .insert(chirps)
    .values(chirpy)
    .onConflictDoNothing()
    .returning();
  return result;
}
