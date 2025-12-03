// Server/src/Routes/founderRoutes.js
import express from "express";
import {
  createFounder,
  getFounders,
  updateFounder,
  deleteFounder,
} from "../../Controllers/Global/Founder.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path as needed

const FounderRouter = express.Router();

FounderRouter.route("/")
  .post(authenticate, createFounder)
  .get(getFounders);

FounderRouter.route("/latest")
  .get(getFounders);

FounderRouter.route("/:id")
  .get(getFounders)
  .patch(authenticate, updateFounder)
  .delete(authenticate, deleteFounder);

export default FounderRouter;
