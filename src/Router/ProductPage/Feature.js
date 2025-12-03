// Server/src/Routes/productFeatureRoutes.js
import express from "express";
import {
  createProductFeature,
  getProductFeature,
  updateProductFeature,
  deleteProductFeature,
} from "../../Controllers/ProductPage/Feature.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const ProductFeatureRouter = express.Router();

// optional files: cardvd1, cardvd2, cardvd3
const uploadMiddleware = upload.fields([
  { name: "cardvd1", maxCount: 1 },
  { name: "cardvd2", maxCount: 1 },
  { name: "cardvd3", maxCount: 1 },
]);

ProductFeatureRouter.route("/")
  .post(authenticate, uploadMiddleware, createProductFeature)
  .get(getProductFeature);

ProductFeatureRouter.route("/latest")
  .get(getProductFeature);

ProductFeatureRouter.route("/:id")
  .get(getProductFeature)
  .patch(authenticate, uploadMiddleware, updateProductFeature)
  .delete(authenticate, deleteProductFeature);

export default ProductFeatureRouter;
