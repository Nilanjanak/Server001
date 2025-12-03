// Server/src/Routes/owdescRoutes.js
import express from "express";


import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed
import { createOwDesc, deleteOwDesc, getOwDesc, updateOwDesc } from "../../Controllers/Global/Owdtext.js";

const OwdtextRouter = express.Router();

OwdtextRouter.route("/")
  .post(authenticate, createOwDesc)
  .get(getOwDesc);

OwdtextRouter.route("/latest")
  .get(getOwDesc);

OwdtextRouter.route("/:id")
  .get(getOwDesc)
  .patch(authenticate, updateOwDesc)
  .delete(authenticate, deleteOwDesc);

export default OwdtextRouter;