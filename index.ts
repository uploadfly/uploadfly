import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { ufRouter } from "./src/routes";
import { record } from "@logdrop/node";
import { authenticateApiKey } from "./src/middlewares/authenticateApiKey";

const app = express();

const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const logDrop = record(process.env.LOGDROP_API_KEY!);

app.use(logDrop);

app.get("/", (req: Request, res: Response) => {
  res.redirect("https://uploadfly.co");
});

app.use("/", ufRouter);

const PORT = process.env.PORT || 2001;

app.listen(PORT, () => {
  console.log("Live!");
});
