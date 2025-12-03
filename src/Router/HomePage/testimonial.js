// Server/src/Routes/homeTestimonialRoutes.js
import express from "express";
import {
  createHomeTestimonial,
  getHomeTestimonial,
  updateHomeTestimonial,
  deleteHomeTestimonial,

} from "../../Controllers/HomePage/Testimonial.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const TestimonialRouter = express.Router();

// standard create/list
TestimonialRouter.route("/")
  .post(authenticate, createHomeTestimonial)
  .get(getHomeTestimonial);

// latest
TestimonialRouter.route("/latest")
  .get(getHomeTestimonial);

// single / update / delete
TestimonialRouter.route("/:id")
  .get(getHomeTestimonial)
  .patch(authenticate, updateHomeTestimonial)
  .delete(authenticate, deleteHomeTestimonial);



export default TestimonialRouter;
