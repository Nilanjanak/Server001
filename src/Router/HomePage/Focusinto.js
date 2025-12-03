// Server/src/Routes/homeFocusIntroRoutes.js
import express from "express";
import {
  createHomeFocusIntro,
  getHomeFocusIntro,
  updateHomeFocusIntro,
  deleteHomeFocusIntro,
} from "../../Controllers/HomePage/Focusinto.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const FocusIntoRouter = express.Router();

FocusIntoRouter.route("/")
  .post(authenticate, createHomeFocusIntro)
  .get(getHomeFocusIntro);

FocusIntoRouter.route("/latest")
  .get(getHomeFocusIntro);

FocusIntoRouter.route("/:id")
  .get(getHomeFocusIntro)
  .patch(authenticate, updateHomeFocusIntro)
  .delete(authenticate, deleteHomeFocusIntro);

export default FocusIntoRouter;
