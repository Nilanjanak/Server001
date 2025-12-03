// Server/src/Routes/productHeroSecRoutes.js
import express from "express";
import {
  createResourceHeroSec,
  getResourceHeroSec,
  updateResourceHeroSec,
  deleteResourceHeroSec,
} from "../../Controllers/ResourcePage/Herosec.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const ResourceHerosecRouter = express.Router();

const uploadMiddleware = upload.single("HeroImg");

// CREATE or REPLACE (since single document)
ResourceHerosecRouter.route("/")
  .post(authenticate, uploadMiddleware, createResourceHeroSec)
  .get(getResourceHeroSec)
  .patch(authenticate, uploadMiddleware, updateResourceHeroSec)
  .delete(authenticate, deleteResourceHeroSec);

export default ResourceHerosecRouter;
