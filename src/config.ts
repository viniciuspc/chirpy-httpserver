import { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
  port: number;
  platform: string;
};

type DBConfig = {
  url: string,
 migrationConfig: MigrationConfig 
}

type JWTConfig = {
  defaultDuration: number;
  secret: string;
  issuer: string;
};

type Config = {
  api: APIConfig,
  db: DBConfig,
  jwt: JWTConfig
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/out",
};

const apiConfig: APIConfig = {
  fileserverHits: 0,
  port: Number(envOrThrow("PORT")),
  platform: envOrThrow("PLATFORM"),
};

const dbConfig: DBConfig = {
  url:  envOrThrow("DB_URL"),
  migrationConfig: migrationConfig
}

const jwtConfig: JWTConfig = {
  defaultDuration: 60 * 60, // 1 hour in seconds
  secret: envOrThrow("JWT_SECRET"),
  issuer: "chirpy",
}

function envOrThrow(key: string){
  const value = process.env[key];
  if(!value){
    throw `Variable with key ${key} not found in the environment.`;
  }

  return value;
  
}

export const config: Config = {
  api: apiConfig,
  db: dbConfig,
  jwt: jwtConfig
}
