import express from "express";
import {
  createHomeCompare,
  getHomeCompare,
  updateHomeCompare,
  deleteHomeCompare,

} from "../../Controllers/HomePage/Compare.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js";

const CompareRouter = express.Router();

CompareRouter.route("/")
  .post(authenticate, createHomeCompare)
  .get(getHomeCompare);

CompareRouter.route("/latest")
  .get(getHomeCompare);

CompareRouter.route("/:id")
  .get(getHomeCompare)
  .patch(authenticate, updateHomeCompare)
  .delete(authenticate, deleteHomeCompare);
export default CompareRouter;