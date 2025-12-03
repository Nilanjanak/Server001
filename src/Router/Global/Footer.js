import express from "express";
import {
  createFooter,
  getFooter,
  updateFooter,

} from "../../Controllers/Global/Footer.js";
import { authenticate } from "../../Middleware/AuthMiddleware.js";

const FooterRouter = express.Router();

FooterRouter.route("/").post(authenticate, createFooter).get(getFooter).patch(authenticate,updateFooter);



export default FooterRouter;
