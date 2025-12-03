// Server/src/Routes/productHeroSecRoutes.js
import express from "express";
import {
  createProductHeroSec,
  getProductHeroSec,
  updateProductHeroSec,
  deleteProductHeroSec,
} from "../../Controllers/ProductPage/Herosec.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const ProductHerosecRouter = express.Router();

const uploadMiddleware = upload.single("HeroImg");

// CREATE or REPLACE (since single document)
ProductHerosecRouter.route("/")
  .post(authenticate, uploadMiddleware, createProductHeroSec)
  .get(getProductHeroSec)
  .patch(authenticate, uploadMiddleware, updateProductHeroSec)
  .delete(authenticate, deleteProductHeroSec);

export default ProductHerosecRouter;
