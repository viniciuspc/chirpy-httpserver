import postgres from "postgres";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "./errors.js";
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js";

const app = express();
const PORT = 8080;

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.api.fileserverHits++;
  next();
}

app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(express.json());

const handlerReadiness = (req: Request, res: Response) => {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};

app.get("/api/healthz", handlerReadiness);

const handlerMetrics = (req: Request, res: Response) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  </body>
</html>`);
};

app.get("/admin/metrics", handlerMetrics);

const handlerReset = (req: Request, res: Response) => {
  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits reset to 0`);
};

app.post("/admin/reset", handlerReset);

async function handlerValidateChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
  };

  const params: parameters = req.body;

  if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  } else {
    const profaneWords = ["kerfuffle", "sharbert", "fornax"];
    const chirpyWords = params.body.split(" ");
    
    const profaneIndexes: number[] = [];
    
    for(let i = 0; i < chirpyWords.length; i++) {
      const word = chirpyWords[i]
      if(profaneWords.includes(word.toLowerCase())){
        profaneIndexes.push(i);
      } 
    }

    for(const index of profaneIndexes){
      chirpyWords[index] = "****";
    }

    res.status(200).send(JSON.stringify({ cleanedBody: chirpyWords.join(" ") }));
    return;
  }
}

app.post("/api/validate_chirp", async (req, res, next) => { 
  try {
    await handlerValidateChirp(req, res);
  } catch (err) {
    next(err);
  }
});

const middlewareLogResponses = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.on("finish", () => {
    if (res.statusCode != 200) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`,
      );
    }
  });

  next();
};

app.use(middlewareLogResponses);

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(err);
  if(err instanceof BadRequestError) {
    res.status(400).json({
      error: err.message
    })
    return;
  }
  if(err instanceof UnauthorizedError) {
    res.status(401).json({
      error: err.message
    })
    return;
  }
  if(err instanceof ForbiddenError) {
    res.status(403).json({
      error: err.message
    })
    return;
  }
  if(err instanceof NotFoundError) {
    res.status(404).json({
      error: err.message
    })
    return;
  }
 
  res.status(500).json({
    error: "Something went wrong on our end",
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});


