// Server/src/Routes/homeFeatureShowcaseRoutes.js
import express from "express";
import {
  createHomeFeatureShowcase,
  getHomeFeatureShowcase,
  updateHomeFeatureShowcase,
  deleteHomeFeatureShowcase,
} from "../../Controllers/HomePage/FeatureShowcase.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const FeatureShowcaseRouter = express.Router();

FeatureShowcaseRouter.route("/")
  .post(authenticate, createHomeFeatureShowcase)
  .get(getHomeFeatureShowcase);

FeatureShowcaseRouter.route("/latest")
  .get(getHomeFeatureShowcase);

FeatureShowcaseRouter.route("/:id")
  .get(getHomeFeatureShowcase)
  .patch(authenticate, updateHomeFeatureShowcase)
  .delete(authenticate, deleteHomeFeatureShowcase);

export default FeatureShowcaseRouter;
