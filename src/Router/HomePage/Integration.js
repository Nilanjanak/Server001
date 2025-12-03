// Server/src/Routes/homeIntegrationRoutes.js
import express from "express";
import {
  createHomeIntegration,
  getHomeIntegration,
  updateHomeIntegration,
  deleteHomeIntegration,
} from "../../Controllers/HomePage/Integration.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const IntegrationRouter = express.Router();

// files: centerIcon, outerIcon1..6 (each maxCount:1)
const uploadMiddleware = upload.fields([
  { name: "centerIcon", maxCount: 1 },
  { name: "outerIcon1", maxCount: 1 },
  { name: "outerIcon2", maxCount: 1 },
  { name: "outerIcon3", maxCount: 1 },
  { name: "outerIcon4", maxCount: 1 },
  { name: "outerIcon5", maxCount: 1 },
  { name: "outerIcon6", maxCount: 1 },
]);

IntegrationRouter.route("/")
  .post(authenticate, uploadMiddleware, createHomeIntegration)
  .get(getHomeIntegration);

IntegrationRouter.route("/latest")
  .get(getHomeIntegration);

IntegrationRouter.route("/:id")
  .get(getHomeIntegration)
  .patch(authenticate, uploadMiddleware, updateHomeIntegration)
  .delete(authenticate, deleteHomeIntegration);

export default IntegrationRouter;
