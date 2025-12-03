// Server/src/Routes/nwdescRoutes.js
import express from "express";
import {
  createNwDesc,
  getNwDesc,
  updateNwDesc,
  deleteNwDesc,
} from "../../Controllers/Global/Nwdtext.js";

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const NwdtextRouter = express.Router();

NwdtextRouter.route("/")
  .post(authenticate, createNwDesc)
  .get(getNwDesc);

NwdtextRouter.route("/latest")
  .get(getNwDesc);

NwdtextRouter.route("/:id")
  .get(getNwDesc)
  .patch(authenticate, updateNwDesc)
  .delete(authenticate, deleteNwDesc);

export default NwdtextRouter;
