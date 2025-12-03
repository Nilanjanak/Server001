// Server/src/Routes/productSnapshotRoutes.js
import express from "express";
import {
  createProductSnapshot,
  getProductSnapshot,
  updateProductSnapshot,
  deleteProductSnapshot,
} from "../../Controllers/ProductPage/Snapshot.js";

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const ProductSnapshotRouter = express.Router();

// fields: snapimg1..snapimg4 (optional files)
const uploadMiddleware = upload.fields([
  { name: "snapimg1", maxCount: 1 },
  { name: "snapimg2", maxCount: 1 },
  { name: "snapimg3", maxCount: 1 },
  { name: "snapimg4", maxCount: 1 },
]);

// Create
ProductSnapshotRouter.post("/", authenticate, uploadMiddleware, createProductSnapshot);

// List
ProductSnapshotRouter.get("/", getProductSnapshot);

// // Single
// ProductSnapshotRouter.get("/:id", getProductSnapshot);

// // Latest
// ProductSnapshotRouter.get("/latest", getProductSnapshot);

// Update
ProductSnapshotRouter.patch("/:id", authenticate, uploadMiddleware, updateProductSnapshot);

// Delete
ProductSnapshotRouter.delete("/:id", authenticate, deleteProductSnapshot);

export default ProductSnapshotRouter;
