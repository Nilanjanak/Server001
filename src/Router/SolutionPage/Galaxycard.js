// Server/src/Routes/solutionGalaryCardRoutes.js
import express from "express";
import {
  createSolutionGalaryCard,
  getSolutionGalaryCard,
  updateSolutionGalaryCard,
  deleteSolutionGalaryCard,
} from "../../Controllers/SolutionPage/GalaxyCard.js"; // adjust path if needed

import { upload } from "../../Middleware/Upload.js"; // your multer instance
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const GalaxyCardRouter = express.Router();

// single file field bgVd
const uploadMiddleware = upload.single("bgVd");

GalaxyCardRouter.route("/")
  .post(authenticate, uploadMiddleware, createSolutionGalaryCard)
  .get(getSolutionGalaryCard);

GalaxyCardRouter.route("/latest").get(getSolutionGalaryCard);

GalaxyCardRouter.route("/:id")
  .get(getSolutionGalaryCard)
  .patch(authenticate, uploadMiddleware, updateSolutionGalaryCard)
  .delete(authenticate, deleteSolutionGalaryCard);

export default GalaxyCardRouter;
