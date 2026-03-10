
process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
};

export const config: APIConfig = {
  fileserverHits: 0,
  dbURL: envOrThrow("DB_URL")
};

function envOrThrow(key: string){
  const value = process.env[key];
  if(!value){
    throw `Variable with key ${key} not found in the environment.`;
  }

  return value;
  
}
