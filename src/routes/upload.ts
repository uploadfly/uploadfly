import expres from "express";
import { upload } from "../controllers/upload";

const router = expres.Router();

router.post("/", upload);

export { router as uploadRouter };
