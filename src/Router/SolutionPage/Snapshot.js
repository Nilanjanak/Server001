// Server/src/Routes/solutionSnapshotRoutes.js
import express from "express";
import {
  createSolutionSnapshot,
  getSolutionSnapshot,
  updateSolutionSnapshot,
  deleteSolutionSnapshot,
} from "../../Controllers/SolutionPage/Snapshot.js"; // adjust path if needed

import { upload } from "../../Middleware/Upload.js"; // adjust path if needed
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // adjust path if needed

const SolutionSnapshotRouter = express.Router();

// expected file fields: snapimg1..snapimg4
const uploadMiddleware = upload.fields([
  { name: "snapimg1", maxCount: 1 },
  { name: "snapimg2", maxCount: 1 },
  { name: "snapimg3", maxCount: 1 },
  { name: "snapimg4", maxCount: 1 },
]);

SolutionSnapshotRouter.route("/")
  .post(authenticate, uploadMiddleware, createSolutionSnapshot)
  .get(getSolutionSnapshot);

SolutionSnapshotRouter.route("/latest").get(getSolutionSnapshot);

SolutionSnapshotRouter.route("/:id")
  .get(getSolutionSnapshot)
  .patch(authenticate, uploadMiddleware, updateSolutionSnapshot)
  .delete(authenticate, deleteSolutionSnapshot);

export default SolutionSnapshotRouter;
