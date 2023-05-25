import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { apiKeyRouter } from "./src/routes/api-key";
import { flyRouter } from "./src/routes/fly";

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req: Request, res: Response) => {
  res.send("File uploads that fly 🪁");
});

app.use("/api-key", apiKeyRouter);
app.use("/fly", flyRouter);

const PORT = process.env.PORT || 2001;

app.listen(PORT, () => {
  console.log("Live!");
});
