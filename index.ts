import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

app.use(cors());
app.use(bodyParser);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 2001;

app.listen(PORT, () => {
  console.log("Live!");
});
