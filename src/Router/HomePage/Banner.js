import express from "express";
import {
  createHomeBanner,
  getHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
} from "../../Controllers/HomePage/Banner.js";

import { upload } from "../../Middleware/Upload.js";
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // same naming as your Social router

const BannerRouter = express.Router();

// 3 video uploads: vd1, vd2, vd3
const uploadMiddleware = upload.fields([
  { name: "vd1", maxCount: 1 },
  { name: "vd2", maxCount: 1 },
  { name: "vd3", maxCount: 1 },
]);

// =============================
// Routes
// =============================

// LIST ALL + CREATE
BannerRouter.route("/")
  .post(authenticate, uploadMiddleware, createHomeBanner)
  .get(getHomeBanner);

// GET LATEST (matches your controller style)
BannerRouter.route("/latest")
  .get(getHomeBanner);

// GET ONE / UPDATE / DELETE
BannerRouter.route("/:id")
  .get(getHomeBanner)
  .patch(authenticate, uploadMiddleware, updateHomeBanner)
  .delete(authenticate, deleteHomeBanner);

export default BannerRouter;
