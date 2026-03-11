import { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
};

type DBConfig = {
  url: string,
 migrationConfig: MigrationConfig 
}

type Config = {
  api: APIConfig,
  db: DBConfig
}

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/out",
};

const apiConfig: APIConfig = {
  fileserverHits: 0,
};

const dbConfig: DBConfig = {
  url:  envOrThrow("DB_URL"),
  migrationConfig: migrationConfig
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
  db: dbConfig
}
