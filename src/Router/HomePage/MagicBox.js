// Server/src/Routes/homeMagicBoxRoutes.js
import express from "express";
import {
  createHomeMagicBox,
  getHomeMagicBox,
  updateHomeMagicBox,
  deleteHomeMagicBox,
} from "../../Controllers/HomePage/MagicBox.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const MagicBoxRouter = express.Router();

// files: midIcon, outerIcon1..outerIcon7 (each maxCount:1)
const uploadMiddleware = upload.fields([
  { name: "midIcon", maxCount: 1 },
  { name: "outerIcon1", maxCount: 1 },
  { name: "outerIcon2", maxCount: 1 },
  { name: "outerIcon3", maxCount: 1 },
  { name: "outerIcon4", maxCount: 1 },
  { name: "outerIcon5", maxCount: 1 },
  { name: "outerIcon6", maxCount: 1 },
  { name: "outerIcon7", maxCount: 1 },
]);

MagicBoxRouter.route("/")
  .post(authenticate, uploadMiddleware, createHomeMagicBox)
  .get(getHomeMagicBox);

MagicBoxRouter.route("/latest")
  .get(getHomeMagicBox);

MagicBoxRouter.route("/:id")
  .get(getHomeMagicBox)
  .patch(authenticate, uploadMiddleware, updateHomeMagicBox)
  .delete(authenticate, deleteHomeMagicBox);

export default MagicBoxRouter;
