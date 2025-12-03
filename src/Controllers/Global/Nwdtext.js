// Server/src/Controllers/NwDescController.js
import mongoose from "mongoose";
import NwDesc from "../../Models/Global/NwDesc.js";
import { HomeCompare } from "../../Models/Homepage/Compare.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * Create NwDesc
 * Body: { text, compareId? }
 * If compareId provided, validated and pushed into HomeCompare.nwdtext using $addToSet.
 */
export const createNwDesc = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      text: norm(req.body.text),
    };

    const missing = [];
    if (!payload.text) missing.push("text");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // optional compareId to auto-attach
    let compareId;
    if (typeof req.body.compareId !== "undefined" && req.body.compareId !== null && String(req.body.compareId).length) {
      compareId = norm(req.body.compareId);
      if (!isValidObjectId(compareId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid compareId" });
      }
      const compareExists = await HomeCompare.findById(compareId).session(session).lean();
      if (!compareExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced HomeCompare not found" });
      }
    }

    // create NwDesc
    const doc = new NwDesc(payload);
    await doc.save({ session });

    // attach to HomeCompare if compareId provided
    if (compareId) {
      await HomeCompare.findByIdAndUpdate(
        compareId,
        { $addToSet: { nwdtext: doc._id } },
        { session }
      );
    }

    await session.commitTransaction();

    const result = await NwDesc.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "NwDesc created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createNwDesc error:", err);
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
 * Get NwDesc: list / single / latest
 * GET / -> list
 * GET /latest -> latest
 * GET /:id -> single
 */
export const getNwDesc = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await NwDesc.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "NwDesc not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await NwDesc.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No NwDesc found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await NwDesc.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getNwDesc error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update NwDesc
 * PATCH /:id
 * Body: { text? }
 */
export const updateNwDesc = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await NwDesc.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "NwDesc not found" });
    }

    const updates = {};
    if (typeof req.body.text !== "undefined") {
      const v = norm(req.body.text);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "text cannot be empty" });
      }
      updates.text = v;
    }

    if (Object.keys(updates).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await NwDesc.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "NwDesc updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateNwDesc error:", err);
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
 * Delete NwDesc
 * DELETE /:id
 * Also removes references from any HomeCompare.nwdtext arrays
 */
export const deleteNwDesc = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await NwDesc.findById(id).session(session).lean();
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "NwDesc not found" });
    }

    await NwDesc.findByIdAndDelete(id, { session });

    // remove from any HomeCompare docs
    await HomeCompare.updateMany({ nwdtext: id }, { $pull: { nwdtext: id } }, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "NwDesc deleted and references removed" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteNwDesc error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
