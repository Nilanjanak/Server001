// Server/src/Controllers/HomeWorkingProcessController.js
import mongoose from "mongoose";
import { HomeWorkingProcess } from "../../Models/Homepage/WorkingProcess.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * Create HomeWorkingProcess
 * Body: {
 *   htext, dtext,
 *   chtext1, cdtext1,
 *   chtext2, cdtext2,
 *   chtext3, cdtext3,
 *   chtext4, cdtext4
 * }
 */
export const createHomeWorkingProcess = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      htext: norm(req.body.htext),
      dtext: norm(req.body.dtext),
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
    if (!payload.htext) missing.push("htext");
    if (!payload.dtext) missing.push("dtext");
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
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    const doc = new HomeWorkingProcess(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeWorkingProcess.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "HomeWorkingProcess created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeWorkingProcess error:", err);
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
 * Get HomeWorkingProcess: list / single / latest
 * GET /            -> list
 * GET /latest      -> latest
 * GET /:id         -> single
 */
export const getHomeWorkingProcess = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeWorkingProcess.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "HomeWorkingProcess not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeWorkingProcess.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No HomeWorkingProcess found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeWorkingProcess.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeWorkingProcess error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeWorkingProcess
 * PATCH /:id
 * Accepts any subset of fields; non-empty validation applied.
 */
export const updateHomeWorkingProcess = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeWorkingProcess.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeWorkingProcess not found" });
    }

    const fields = ["htext","dtext","chtext1","cdtext1","chtext2","cdtext2","chtext3","cdtext3","chtext4","cdtext4"];
    const setPayload = {};
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

    const updated = await HomeWorkingProcess.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeWorkingProcess updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeWorkingProcess error:", err);
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
 * Delete HomeWorkingProcess
 * DELETE /:id
 */
export const deleteHomeWorkingProcess = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeWorkingProcess.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeWorkingProcess not found" });
    }

    await HomeWorkingProcess.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeWorkingProcess deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeWorkingProcess error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
