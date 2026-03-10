import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.js";

const app = express();
const PORT = 8080;

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.fileserverHits++;
  next();
}

app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

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
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
};

app.get("/admin/metrics", handlerMetrics);

const handlerReset = (req: Request, res: Response) => {
  config.fileserverHits = 0;
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
    res.status(400).send(JSON.stringify({ error: "Chirp is too long" }));
    return;
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

app.post("/api/validate_chirp", handlerValidateChirp);

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
