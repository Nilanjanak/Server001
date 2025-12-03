// Server/src/Routes/resourceExploreSecRoutes.js
import express from "express";
import {
  createResourceExploreSec,
  getResourceExploreSec,
  updateResourceExploreSec,
  deleteResourceExploreSec,
} from "../../Controllers/ResourcePage/Explorer.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const ResourceExplorerRouter = express.Router();

// optional file fields: cardImg1..cardImg3
const uploadMiddleware = upload.fields([
  { name: "cardImg1", maxCount: 1 },
  { name: "cardImg2", maxCount: 1 },
  { name: "cardImg3", maxCount: 1 },
]);

ResourceExplorerRouter.route("/")
  .post(authenticate, uploadMiddleware, createResourceExploreSec)
  .get(getResourceExploreSec);

ResourceExplorerRouter.route("/latest")
  .get(getResourceExploreSec);

ResourceExplorerRouter.route("/:id")
  .get(getResourceExploreSec)
  .patch(authenticate, uploadMiddleware, updateResourceExploreSec)
  .delete(authenticate, deleteResourceExploreSec);

export default ResourceExplorerRouter;
