import { asc } from "drizzle-orm";
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

export async function listAllChirps(): Promise<NewChirpy[]> {
  return await db.select().from(chirps).orderBy(asc(chirps.createdAt));
}
