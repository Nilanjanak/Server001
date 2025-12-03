// Server/src/Routes/faqRoutes.js
import express from "express";
import {
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
} from "../../Controllers/Global/FAQ.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const FAQRouter = express.Router();

FAQRouter.route("/")
  .post(authenticate, createFaq)
  .get(getFaqs);

FAQRouter.route("/latest")
  .get(getFaqs);

FAQRouter.route("/:id")
  .get(getFaqs)
  .patch(authenticate, updateFaq)
  .delete(authenticate, deleteFaq);

export default FAQRouter;
