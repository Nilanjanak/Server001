// Server/src/Routes/socialRoutes.js
import express from "express";
import {
  createSocial,

  updateSocial,
  deleteSocial,
  getSocials,
} from "../../Controllers/Global/Social.js";
import { upload } from "../../Middleware/Upload.js";
import { authenticate } from "../../Middleware/AuthMiddleware.js";


// Single file upload for 'icon'
const uploadMiddleware = upload.single("icon");

const SocialRouter = express.Router();

SocialRouter.route("/").post(authenticate, uploadMiddleware, createSocial).get(getSocials);

SocialRouter.route("/:id").patch(authenticate, uploadMiddleware,updateSocial).delete(authenticate, deleteSocial).get(getSocials)

export default SocialRouter;
