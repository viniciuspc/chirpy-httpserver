import postgres from "postgres";
import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./errors.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { NewChirpy, NewUser } from "./db/schema.js";
import { createUser, deleteAllUsers } from "./db/queries/users.js";
import { createChirpy, listAllChirps } from "./db/queries/chirps.js";

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

const handlerReset = async (req: Request, res: Response) => {
  const { platform } = config.api;

  if (platform != "dev") {
    throw new ForbiddenError("Reset endpoint only allowed in dev.");
  }
  
  await deleteAllUsers();

  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits reset to 0`);
};

app.post("/admin/reset", async (req, res, next) => {
  try {
    handlerReset(req, res);
  } catch (err) {
    next(err);
  }
});

async function handlerCreateChirp(req: Request, res: Response) {
  type parameters = {
    body: string;
    userId: string;
  };

  const params: parameters = req.body;

  if (params.body.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  } else {
    const profaneWords = ["kerfuffle", "sharbert", "fornax"];
    const chirpyWords = params.body.split(" ");

    const profaneIndexes: number[] = [];

    for (let i = 0; i < chirpyWords.length; i++) {
      const word = chirpyWords[i];
      if (profaneWords.includes(word.toLowerCase())) {
        profaneIndexes.push(i);
      }
    }

    for (const index of profaneIndexes) {
      chirpyWords[index] = "****";
    }
    
    const newChirpy: NewChirpy = {userId: params.userId, body: chirpyWords.join(" ")};    
    const createdChirpy: NewChirpy = await createChirpy(newChirpy);
    res
      .status(201)
      .send(JSON.stringify(createdChirpy));
    return;
  }
}

app.post("/api/chirps", async (req, res, next) => {
  try {
    await handlerCreateChirp(req, res);
  } catch (err) {
    next(err);
  }
});

async function handlerListAllChirps(req: Request, res: Response) {
  const chirps: NewChirpy[] = await listAllChirps();

  res.status(200).send(JSON.stringify(chirps));
}

app.get("/api/chirps", handlerListAllChirps);

// Users

async function handlerCreateUser(req: Request, res: Response) {
  type parameters = {
    email: string;
  };

  const params: parameters = req.body;
  const email = params.email;
  
  if (!email) {
    throw new BadRequestError("Provide an email to create a new user.");
  }

  const newUser: NewUser = { email: params.email };

  const createdUser: NewUser = await createUser(newUser);

  res.status(201).send(JSON.stringify(createdUser));
}

app.post("/api/users", async (req, res, next) => {
  try {
    await handlerCreateUser(req, res);
  } catch (err) {
    next(err);
  }
});

//Middlewares

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
  if (err instanceof BadRequestError) {
    res.status(400).json({
      error: err.message,
    });
    return;
  }
  if (err instanceof UnauthorizedError) {
    res.status(401).json({
      error: err.message,
    });
    return;
  }
  if (err instanceof ForbiddenError) {
    res.status(403).json({
      error: err.message,
    });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: err.message,
    });
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
