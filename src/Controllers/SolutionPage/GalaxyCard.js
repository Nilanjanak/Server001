// Server/src/Controllers/SolutionGalaryCardController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { SolutionGalaryCard } from "../../Models/Solutionpage/Galarycard.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const uploadAndCleanup = async (filePath) => {
  const res = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
  return res;
};

export const createSolutionGalaryCard = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const file = req.file; // upload.single('bgVd')
    const payload = {
      bgVd: norm(req.body.bgVd) || undefined,
      htext: norm(req.body.htext),
      dtext: norm(req.body.dtext),
      tag: norm(req.body.tag),
    };

    const missing = [];
    if (!payload.htext) missing.push("htext");
    if (!payload.dtext) missing.push("dtext");
    if (!payload.tag) missing.push("tag");
    if (!file && !payload.bgVd) missing.push("bgVd (file or url)");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "bgVd upload failed" });
      }
      payload.bgVd = up.secure_url || up.url || "";
    }

    const doc = new SolutionGalaryCard(payload);
    await doc.save({ session });

    await session.commitTransaction();
    const result = await SolutionGalaryCard.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "SolutionGalaryCard created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createSolutionGalaryCard error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: `Unexpected file field: ${err.field}. Use 'bgVd'` });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const getSolutionGalaryCard = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await SolutionGalaryCard.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "SolutionGalaryCard not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await SolutionGalaryCard.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No SolutionGalaryCard found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await SolutionGalaryCard.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getSolutionGalaryCard error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSolutionGalaryCard = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await SolutionGalaryCard.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "SolutionGalaryCard not found" });
    }

    const file = req.file; // optional replacement
    const setPayload = {};
    if (typeof req.body.htext !== "undefined") {
      const v = norm(req.body.htext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"htext cannot be empty" }); }
      setPayload.htext = v;
    }
    if (typeof req.body.dtext !== "undefined") {
      const v = norm(req.body.dtext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"dtext cannot be empty" }); }
      setPayload.dtext = v;
    }
    if (typeof req.body.tag !== "undefined") {
      const v = norm(req.body.tag);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"tag cannot be empty" }); }
      setPayload.tag = v;
    }

    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"bgVd upload failed" }); }
      setPayload.bgVd = up.secure_url || up.url || "";
    } else if (typeof req.body.bgVd !== "undefined") {
      const v = norm(req.body.bgVd);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"bgVd cannot be empty" }); }
      setPayload.bgVd = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await SolutionGalaryCard.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "SolutionGalaryCard updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateSolutionGalaryCard error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(x => x.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: `Unexpected file field: ${err.field}. Use 'bgVd'` });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteSolutionGalaryCard = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await SolutionGalaryCard.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "SolutionGalaryCard not found" });
    }

    await SolutionGalaryCard.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "SolutionGalaryCard deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteSolutionGalaryCard error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
