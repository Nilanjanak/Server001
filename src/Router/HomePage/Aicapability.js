// Server/src/Routes/homeAicapRoutes.js
import express from "express";
import {
  createHomeAicap,
  getHomeAicap,
  updateHomeAicap,
  deleteHomeAicap,
} from "../../Controllers/HomePage/Aicapability.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path as needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // match your project middleware

const AicapRouter = express.Router();

// Expect four image fields: tagImg1..4
const uploadMiddleware = upload.fields([
  { name: "tagIcon1", maxCount: 1 },
  { name: "tagIcon2", maxCount: 1 },
  { name: "tagIcon3", maxCount: 1 },
  { name: "tagIcon4", maxCount: 1 },
  { name: "tagImg1", maxCount: 1 },
  { name: "tagImg2", maxCount: 1 },
  { name: "tagImg3", maxCount: 1 },
  { name: "tagImg4", maxCount: 1 },
]);


AicapRouter.route("/")
  .post(authenticate, uploadMiddleware, createHomeAicap)
  .get(getHomeAicap);

AicapRouter.route("/latest").get(getHomeAicap);

AicapRouter.route("/:id")
  .get(getHomeAicap)
  .patch(authenticate, uploadMiddleware, updateHomeAicap)
  .delete(authenticate, deleteHomeAicap);

export default AicapRouter;
