// Server/src/Controllers/HomeDashboardSecController.js
import mongoose from "mongoose";
import fs from "fs";

import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { HomeDashboardSec } from "../../Models/Homepage/DashboardSection.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/** helper to upload file and cleanup local copy */
const uploadAndCleanup = async (filePath) => {
  const res = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
  return res;
};

/**
 * Create HomeDashboardSec
 * Will refuse if a document already exists (use update instead)
 */
export const createHomeDashboardSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // require either file upload or vd url
    const file = req.file; // multer single('vd')
    const payload = {
      htext1: norm(req.body.htext1),
      dtext1: norm(req.body.dtext1),
      vd: norm(req.body.vd) || undefined,
    };

    const missing = [];
    if (!payload.htext1) missing.push("htext1");
    if (!payload.dtext1) missing.push("dtext1");
    if (!file && !payload.vd) missing.push("vd (file or url)");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // ensure single-document constraint
    const existing = await HomeDashboardSec.findOne().session(session).lean();
    if (existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: "HomeDashboardSec already exists. Use the update endpoint to modify it.",
        data: existing,
      });
    }

    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "vd upload failed" });
      }
      payload.vd = up.secure_url || up.url || "";
    }

    const doc = new HomeDashboardSec(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeDashboardSec.findById(doc._id).lean().exec();
    return res.status(201).json({ success: true, message: "HomeDashboardSec created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeDashboardSec error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get single/latest HomeDashboardSec
 */
export const getHomeDashboardSec = async (req, res) => {
  try {
    const doc = await HomeDashboardSec.findOne({}).sort({ createdAt: -1 }).lean();
    if (!doc) return res.status(404).json({ success: false, message: "HomeDashboardSec not found" });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error("getHomeDashboardSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update single HomeDashboardSec (no :id)
 * - accepts multipart file 'vd' or body vd (url)
 * - updates htext1/dtext1 if provided
 */
export const updateHomeDashboardSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existing = await HomeDashboardSec.findOne().session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeDashboardSec not found. Create it first." });
    }

    const setPayload = {};

    // Helper to check "provided and non-empty"
    const providedNonEmpty = (val) => {
      if (typeof val === "undefined" || val === null) return false;
      if (typeof val === "string" && val.trim().length === 0) return false;
      return true;
    };

    // Only validate/set if field provided and non-empty
    if (Object.prototype.hasOwnProperty.call(req.body, "htext1") && providedNonEmpty(req.body.htext1)) {
      const v = norm(req.body.htext1);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "htext1 cannot be empty" });
      }
      setPayload.htext1 = v;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "dtext1") && providedNonEmpty(req.body.dtext1)) {
      const v = norm(req.body.dtext1);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "dtext1 cannot be empty" });
      }
      setPayload.dtext1 = v;
    }

    // file handling (multer single('vd'))
    const file = req.file;
    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "vd upload failed" });
      }
      setPayload.vd = up.secure_url || up.url || "";
    } else if (Object.prototype.hasOwnProperty.call(req.body, "vd") && providedNonEmpty(req.body.vd)) {
      // Only treat vd in body as provided when it's non-empty string
      const v = norm(req.body.vd);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "vd cannot be empty" });
      }
      setPayload.vd = v;
    }

    // If nothing to update -> error
    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeDashboardSec.findOneAndUpdate({}, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();

    const result = await HomeDashboardSec.findById(updated._id).lean();
    return res.status(200).json({ success: true, message: "HomeDashboardSec updated", data: result });
  } catch (err) {
    try {
      if (session.inTransaction()) await session.abortTransaction();
    } catch (e) {
      console.error("abortTransaction error:", e);
    }
    console.error("updateHomeDashboardSec error:", err);
    if (err && err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err?.message ?? String(err) });
  } finally {
    session.endSession();
  }
};


/**
 * Delete single HomeDashboardSec (no :id)
 */
export const deleteHomeDashboardSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existing = await HomeDashboardSec.findOne().session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeDashboardSec not found" });
    }

    await HomeDashboardSec.findOneAndDelete({}, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeDashboardSec deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeDashboardSec error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};