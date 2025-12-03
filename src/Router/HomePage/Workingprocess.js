// Server/src/Routes/homeWorkingProcessRoutes.js
import express from "express";
import {
  createHomeWorkingProcess,
  getHomeWorkingProcess,
  updateHomeWorkingProcess,
  deleteHomeWorkingProcess,
} from "../../Controllers/HomePage/Workingprocess.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const WorkprocessRouter = express.Router();

WorkprocessRouter.route("/")
  .post(authenticate, createHomeWorkingProcess)
  .get(getHomeWorkingProcess);

WorkprocessRouter.route("/latest")
  .get(getHomeWorkingProcess);

WorkprocessRouter.route("/:id")
  .get(getHomeWorkingProcess)
  .patch(authenticate, updateHomeWorkingProcess)
  .delete(authenticate, deleteHomeWorkingProcess);

export default WorkprocessRouter;
