import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { uploadRouter } from "./src/routes";

const app = express();

const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("File uploads that fly 🪁");
});

app.use("/upload", uploadRouter);

const PORT = process.env.PORT || 2001;

app.listen(PORT, () => {
  console.log("Live!");
});
