import { app } from ".";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 2001;

app.listen(PORT, () => {
  console.log("Live!");
});
