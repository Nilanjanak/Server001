// Server/src/Routes/resourceSnapshotRoutes.js
import express from "express";
import {
  createResourceSnapshot,
  getResourceSnapshot,
  updateResourceSnapshot,
  deleteResourceSnapshot,
} from "../../Controllers/ResourcePage/Snapshot.js"; // adjust path if needed

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const ResourceSnapRouter = express.Router();

// expected file fields: snapimg1..snapimg4 (lowercase)
const uploadMiddleware = upload.fields([
  { name: "snapimg1", maxCount: 1 },
  { name: "snapimg2", maxCount: 1 },
  { name: "snapimg3", maxCount: 1 },
  { name: "snapimg4", maxCount: 1 },
]);

ResourceSnapRouter.route("/")
  .post(authenticate, uploadMiddleware, createResourceSnapshot)
  .get(getResourceSnapshot);

ResourceSnapRouter.route("/latest").get(getResourceSnapshot);

ResourceSnapRouter.route("/:id")
  .get(getResourceSnapshot)
  .patch(authenticate, uploadMiddleware, updateResourceSnapshot)
  .delete(authenticate, deleteResourceSnapshot);

export default ResourceSnapRouter;

