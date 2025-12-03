// Server/src/Controllers/HomeFocusIntroController.js
import mongoose from "mongoose";
import { HomeFocusIntro } from "../../Models/Homepage/FocusIntro.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * Create HomeFocusIntro
 * Body: { htext, para1, para2, para3 }
 */
export const createHomeFocusIntro = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      htext: norm(req.body.htext),
      para1: norm(req.body.para1),
      para2: norm(req.body.para2),
      para3: norm(req.body.para3),
    };

    const missing = [];
    if (!payload.htext) missing.push("htext");
    if (!payload.para1) missing.push("para1");
    if (!payload.para2) missing.push("para2");
    if (!payload.para3) missing.push("para3");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    const doc = new HomeFocusIntro(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeFocusIntro.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "HomeFocusIntro created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeFocusIntro error:", err);
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
 * Get HomeFocusIntro: list / single / latest
 * GET / -> list
 * GET /latest -> latest
 * GET /:id -> single
 */
export const getHomeFocusIntro = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeFocusIntro.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "HomeFocusIntro not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeFocusIntro.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No HomeFocusIntro found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeFocusIntro.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeFocusIntro error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeFocusIntro
 * PATCH /:id
 * Accepts any subset of { htext, para1, para2, para3 } (non-empty validation)
 */
export const updateHomeFocusIntro = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeFocusIntro.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeFocusIntro not found" });
    }

    const setPayload = {};
    const fields = ["htext", "para1", "para2", "para3"];
    for (const f of fields) {
      if (typeof req.body[f] !== "undefined") {
        const v = norm(req.body[f]);
        if (!v) {
          if (session.inTransaction()) await session.abortTransaction();
          return res.status(400).json({ success: false, message: `${f} cannot be empty` });
        }
        setPayload[f] = v;
      }
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeFocusIntro.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeFocusIntro updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeFocusIntro error:", err);
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
 * Delete HomeFocusIntro
 * DELETE /:id
 */
export const deleteHomeFocusIntro = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeFocusIntro.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeFocusIntro not found" });
    }

    await HomeFocusIntro.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeFocusIntro deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeFocusIntro error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
