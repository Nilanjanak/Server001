// Server/src/Controllers/HomeFeatureShowcaseController.js
import mongoose from "mongoose";
import { HomeFeatureShowcase } from "../../Models/Homepage/FeatureShowcase.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * Create HomeFeatureShowcase
 * Body: chtext1, cdtext1, chtext2, cdtext2, chtext3, cdtext3, chtext4, cdtext5
 */
export const createHomeFeatureShowcase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      chtext1: norm(req.body.chtext1),
      cdtext1: norm(req.body.cdtext1),
      chtext2: norm(req.body.chtext2),
      cdtext2: norm(req.body.cdtext2),
      chtext3: norm(req.body.chtext3),
      cdtext3: norm(req.body.cdtext3),
      chtext4: norm(req.body.chtext4),
      cdtext4: norm(req.body.cdtext4),
    };

    const missing = [];
    if (!payload.chtext1) missing.push("chtext1");
    if (!payload.cdtext1) missing.push("cdtext1");
    if (!payload.chtext2) missing.push("chtext2");
    if (!payload.cdtext2) missing.push("cdtext2");
    if (!payload.chtext3) missing.push("chtext3");
    if (!payload.cdtext3) missing.push("cdtext3");
    if (!payload.chtext4) missing.push("chtext4");
    if (!payload.cdtext4) missing.push("cdtext4");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    const doc = new HomeFeatureShowcase(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeFeatureShowcase.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "HomeFeatureShowcase created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeFeatureShowcase error:", err);
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
 * Get list / single / latest
 * GET / -> list
 * GET /latest -> latest
 * GET /:id -> single
 */
export const getHomeFeatureShowcase = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeFeatureShowcase.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "HomeFeatureShowcase not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeFeatureShowcase.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No HomeFeatureShowcase found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeFeatureShowcase.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeFeatureShowcase error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeFeatureShowcase
 * PATCH /:id
 * Accepts any subset of fields; non-empty validation applied.
 */
export const updateHomeFeatureShowcase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeFeatureShowcase.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeFeatureShowcase not found" });
    }

    const setPayload = {};
    const fields = ["chtext1","cdtext1","chtext2","cdtext2","chtext3","cdtext3","chtext4","cdtext4"];
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

    const updated = await HomeFeatureShowcase.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeFeatureShowcase updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeFeatureShowcase error:", err);
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
 * Delete HomeFeatureShowcase
 * DELETE /:id
 */
export const deleteHomeFeatureShowcase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeFeatureShowcase.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeFeatureShowcase not found" });
    }

    await HomeFeatureShowcase.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeFeatureShowcase deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeFeatureShowcase error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
