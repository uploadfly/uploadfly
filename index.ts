import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import prisma from "./prisma";
import crypto from "crypto";

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  (async () => {
    await prisma.apiKey.create({
      data: {
        key: crypto.randomUUID(),
        owner_id: crypto.randomUUID(),
      },
    });
    console.log("API key created");
    res.send("API key created");
  })();
});

const PORT = process.env.PORT || 2001;

app.listen(PORT, () => {
  console.log("Live!");
});
