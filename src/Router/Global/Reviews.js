// Server/src/Routes/reviewRoutes.js
import express from "express";
import {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
} from "../../Controllers/Global/Reviews.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const ReviewRouter = express.Router();

ReviewRouter.route("/")
  .post(authenticate, createReview)
  .get(getReviews);

ReviewRouter.route("/latest")
  .get(getReviews);

ReviewRouter.route("/:id")
  .get(getReviews)
  .patch(authenticate, updateReview)
  .delete(authenticate, deleteReview);

export default ReviewRouter;
