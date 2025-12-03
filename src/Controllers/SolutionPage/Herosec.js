// Server/src/Controllers/SolutionHeroSecController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { SolutionHeroSec } from "../../Models/Solutionpage/Herosec.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const uploadAndCleanup = async (filePath) => {
  const res = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
  return res;
};

/**
 * Create SolutionHeroSec
 * Accepts multipart/form-data (file field: HeroImg) OR body url HeroImg (string).
 */
export const createSolutionHeroSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const file = req.file; // upload.single('HeroImg')
    const payload = {
      HeroImg: norm(req.body.HeroImg) || undefined,
    };

    // Validate presence
    if (!file && !payload.HeroImg) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "HeroImg (file or url) is required" });
    }

    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "HeroImg upload failed" });
      }
      payload.HeroImg = up.secure_url || up.url || "";
    }

    const doc = new SolutionHeroSec(payload);
    await doc.save({ session });

    await session.commitTransaction();
    const result = await SolutionHeroSec.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "SolutionHeroSec created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createSolutionHeroSec error:", err);
    if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: `Unexpected file field: ${err.field}. Use 'HeroImg'` });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get list / single / latest
 * GET / -> list (all)
 * GET /latest -> latest
 * GET /:id -> single
 */
export const getSolutionHeroSec = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await SolutionHeroSec.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "SolutionHeroSec not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await SolutionHeroSec.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No SolutionHeroSec found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await SolutionHeroSec.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getSolutionHeroSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update SolutionHeroSec (single-document — no id required)
 * PATCH /   -> updates the latest or the only doc
 * Accepts file field 'HeroImg' (multipart) or body 'HeroImg' (url)
 */
export const updateSolutionHeroSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // find the single doc to update (if multiple exist we update the latest)
    let existing = await SolutionHeroSec.findOne({}).session(session);
    if (!existing) {
      // nothing to update
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "No SolutionHeroSec exists to update" });
    }

    const setPayload = {};
    // file handling
    const file = req.file; // optional
    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "HeroImg upload failed" });
      }
      setPayload.HeroImg = up.secure_url || up.url || "";
    } else if (typeof req.body.HeroImg !== "undefined") {
      const v = norm(req.body.HeroImg);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "HeroImg cannot be empty" });
      }
      setPayload.HeroImg = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await SolutionHeroSec.findByIdAndUpdate(
      existing._id,
      { $set: setPayload },
      { new: true, runValidators: true, session }
    ).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "SolutionHeroSec updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateSolutionHeroSec error:", err);
    if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: `Unexpected file field: ${err.field}. Use 'HeroImg'` });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete SolutionHeroSec (single-document)
 * DELETE /  -> deletes the latest/only document
 */
export const deleteSolutionHeroSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const existing = await SolutionHeroSec.findOne({}).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "No SolutionHeroSec found to delete" });
    }

    await SolutionHeroSec.findByIdAndDelete(existing._id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "SolutionHeroSec deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteSolutionHeroSec error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
