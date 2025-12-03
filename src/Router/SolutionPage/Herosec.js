// Server/src/Routes/solutionHeroSecRoutes.js
import express from "express";
import {
  createSolutionHeroSec,
  getSolutionHeroSec,
  updateSolutionHeroSec,
  deleteSolutionHeroSec,
} from "../../Controllers/SolutionPage/Herosec.js"; // adjust path if needed

import { upload } from "../../Middleware/Upload.js"; // your multer instance
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth

const SolutionHeroSecRouter = express.Router();

// use single file field 'HeroImg'
const uploadMiddleware = upload.single("HeroImg");

// Create
SolutionHeroSecRouter.post("/", authenticate, uploadMiddleware, createSolutionHeroSec);

// List / get / latest / by id
SolutionHeroSecRouter.get("/", getSolutionHeroSec);
SolutionHeroSecRouter.get("/latest", getSolutionHeroSec);
SolutionHeroSecRouter.get("/:id", getSolutionHeroSec);

// Update (no id required)
SolutionHeroSecRouter.patch("/", authenticate, uploadMiddleware, updateSolutionHeroSec);

// Delete (no id required)
SolutionHeroSecRouter.delete("/", authenticate, deleteSolutionHeroSec);

export default SolutionHeroSecRouter;
