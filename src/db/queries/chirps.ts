import { asc, eq } from "drizzle-orm";
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

export async function getChirpy(chirpyId: string): Promise<NewChirpy> {
  const [chirpy] = await db.select().from(chirps).where(eq(chirps.id, chirpyId)).limit(1); 
  return chirpy;
}
