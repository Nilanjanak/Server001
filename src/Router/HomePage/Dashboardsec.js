// Server/src/Routes/homeDashboardSecRoutes.js
import express from "express";
import {
  createHomeDashboardSec,
  getHomeDashboardSec,
  updateHomeDashboardSec,
  deleteHomeDashboardSec,
} from "../../Controllers/HomePage/Dashboardsection.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // use your auth middleware
const DashSecRouter = express.Router();

// single file field: vd
const uploadMiddleware = upload.single("vd");

DashSecRouter.route("/")
  .post(authenticate, uploadMiddleware, createHomeDashboardSec)
  .get(getHomeDashboardSec);

DashSecRouter.route("/latest")
  .get(getHomeDashboardSec);

DashSecRouter.route("/update") // no :id — update single section
  .patch(authenticate, uploadMiddleware, updateHomeDashboardSec);

DashSecRouter.route("/delete") // no :id — delete single section
  .delete(authenticate, deleteHomeDashboardSec);

export default DashSecRouter;;
