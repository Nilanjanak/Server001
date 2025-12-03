// Server/src/Controllers/HomeMagicBoxController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { HomeMagicBox } from "../../Models/Homepage/MagicBox.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/** upload to cloudinary then cleanup local file */
const uploadAndCleanup = async (filePath) => {
  const r = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
  return r;
};

/**
 * Create HomeMagicBox
 * Accepts multipart/form-data files OR body URLs.
 * Required: midIcon, outerIcon1..outerIcon7 (each either file or url)
 */
export const createHomeMagicBox = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const files = req.files || {};
    const fMid = Array.isArray(files.midIcon) && files.midIcon[0] ? files.midIcon[0] : undefined;
    const f1 = Array.isArray(files.outerIcon1) && files.outerIcon1[0] ? files.outerIcon1[0] : undefined;
    const f2 = Array.isArray(files.outerIcon2) && files.outerIcon2[0] ? files.outerIcon2[0] : undefined;
    const f3 = Array.isArray(files.outerIcon3) && files.outerIcon3[0] ? files.outerIcon3[0] : undefined;
    const f4 = Array.isArray(files.outerIcon4) && files.outerIcon4[0] ? files.outerIcon4[0] : undefined;
    const f5 = Array.isArray(files.outerIcon5) && files.outerIcon5[0] ? files.outerIcon5[0] : undefined;
    const f6 = Array.isArray(files.outerIcon6) && files.outerIcon6[0] ? files.outerIcon6[0] : undefined;
    const f7 = Array.isArray(files.outerIcon7) && files.outerIcon7[0] ? files.outerIcon7[0] : undefined;

    const payload = {
      midIcon: norm(req.body.midIcon) || undefined,
      outerIcon1: norm(req.body.outerIcon1) || undefined,
      outerIcon2: norm(req.body.outerIcon2) || undefined,
      outerIcon3: norm(req.body.outerIcon3) || undefined,
      outerIcon4: norm(req.body.outerIcon4) || undefined,
      outerIcon5: norm(req.body.outerIcon5) || undefined,
      outerIcon6: norm(req.body.outerIcon6) || undefined,
      outerIcon7: norm(req.body.outerIcon7) || undefined,
    };

    // required checks (each icon must be provided as file or url)
    const missing = [];
    if (!fMid && !payload.midIcon) missing.push("midIcon (file or url)");
    if (!f1 && !payload.outerIcon1) missing.push("outerIcon1 (file or url)");
    if (!f2 && !payload.outerIcon2) missing.push("outerIcon2 (file or url)");
    if (!f3 && !payload.outerIcon3) missing.push("outerIcon3 (file or url)");
    if (!f4 && !payload.outerIcon4) missing.push("outerIcon4 (file or url)");
    if (!f5 && !payload.outerIcon5) missing.push("outerIcon5 (file or url)");
    if (!f6 && !payload.outerIcon6) missing.push("outerIcon6 (file or url)");
    if (!f7 && !payload.outerIcon7) missing.push("outerIcon7 (file or url)");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // upload files if present and set payload fields
    if (fMid) {
      const up = await uploadAndCleanup(fMid.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"midIcon upload failed" }); }
      payload.midIcon = up.secure_url || up.url || "";
    }
    const uploadIf = async (file, fieldName) => {
      if (!file) return;
      const up = await uploadAndCleanup(file.path);
      if (!up) throw new Error(`${fieldName} upload failed`);
      payload[fieldName] = up.secure_url || up.url || "";
    };

    try {
      await uploadIf(f1, "outerIcon1");
      await uploadIf(f2, "outerIcon2");
      await uploadIf(f3, "outerIcon3");
      await uploadIf(f4, "outerIcon4");
      await uploadIf(f5, "outerIcon5");
      await uploadIf(f6, "outerIcon6");
      await uploadIf(f7, "outerIcon7");
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("upload error:", e);
      return res.status(500).json({ success: false, message: e.message || "Icon upload failed" });
    }

    const doc = new HomeMagicBox(payload);
    await doc.save({ session });

    await session.commitTransaction();
    const result = await HomeMagicBox.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "HomeMagicBox created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch(e){ console.error("abortTransaction error:", e); }
    console.error("createHomeMagicBox error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success:false, message:"Validation failed", errors });
    }
    return res.status(500).json({ success:false, message:"Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET list / single / latest
 */
export const getHomeMagicBox = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success:false, message:"Invalid ID" });
      const doc = await HomeMagicBox.findById(id).lean();
      if (!doc) return res.status(404).json({ success:false, message:"HomeMagicBox not found" });
      return res.status(200).json({ success:true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeMagicBox.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success:false, message:"No HomeMagicBox found" });
      return res.status(200).json({ success:true, data: latest });
    }

    const items = await HomeMagicBox.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success:true, data: items });
  } catch (err) {
    console.error("getHomeMagicBox error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};

/**
 * Update HomeMagicBox (PATCH /:id)
 * Accepts any subset of fields; supports file replacement or url strings
 */
export const updateHomeMagicBox = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"Invalid ID" });
    }

    const existing = await HomeMagicBox.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success:false, message:"HomeMagicBox not found" });
    }

    const files = req.files || {};
    const fMid = Array.isArray(files.midIcon) && files.midIcon[0] ? files.midIcon[0] : undefined;
    const f1 = Array.isArray(files.outerIcon1) && files.outerIcon1[0] ? files.outerIcon1[0] : undefined;
    const f2 = Array.isArray(files.outerIcon2) && files.outerIcon2[0] ? files.outerIcon2[0] : undefined;
    const f3 = Array.isArray(files.outerIcon3) && files.outerIcon3[0] ? files.outerIcon3[0] : undefined;
    const f4 = Array.isArray(files.outerIcon4) && files.outerIcon4[0] ? files.outerIcon4[0] : undefined;
    const f5 = Array.isArray(files.outerIcon5) && files.outerIcon5[0] ? files.outerIcon5[0] : undefined;
    const f6 = Array.isArray(files.outerIcon6) && files.outerIcon6[0] ? files.outerIcon6[0] : undefined;
    const f7 = Array.isArray(files.outerIcon7) && files.outerIcon7[0] ? files.outerIcon7[0] : undefined;

    const setPayload = {};
    if (typeof req.body.midIcon !== "undefined") {
      const v = norm(req.body.midIcon);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"midIcon cannot be empty" }); }
      setPayload.midIcon = v;
    }

    // upload replacements if files present
    if (fMid) {
      const up = await uploadAndCleanup(fMid.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"midIcon upload failed" }); }
      setPayload.midIcon = up.secure_url || up.url || "";
    }

    const handleField = async (file, bodyField) => {
      if (file) {
        const up = await uploadAndCleanup(file.path);
        if (!up) throw new Error(`${bodyField} upload failed`);
        return up.secure_url || up.url || "";
      } else if (typeof req.body[bodyField] !== "undefined") {
        const v = norm(req.body[bodyField]);
        if (!v) throw new Error(`${bodyField} cannot be empty`);
        return v;
      }
      return undefined;
    };

    try {
      const v1 = await handleField(f1, "outerIcon1"); if (typeof v1 !== "undefined") setPayload.outerIcon1 = v1;
      const v2 = await handleField(f2, "outerIcon2"); if (typeof v2 !== "undefined") setPayload.outerIcon2 = v2;
      const v3 = await handleField(f3, "outerIcon3"); if (typeof v3 !== "undefined") setPayload.outerIcon3 = v3;
      const v4 = await handleField(f4, "outerIcon4"); if (typeof v4 !== "undefined") setPayload.outerIcon4 = v4;
      const v5 = await handleField(f5, "outerIcon5"); if (typeof v5 !== "undefined") setPayload.outerIcon5 = v5;
      const v6 = await handleField(f6, "outerIcon6"); if (typeof v6 !== "undefined") setPayload.outerIcon6 = v6;
      const v7 = await handleField(f7, "outerIcon7"); if (typeof v7 !== "undefined") setPayload.outerIcon7 = v7;
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("update icon error:", e);
      return res.status(400).json({ success:false, message: e.message || "Icon update failed" });
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"No fields provided to update" });
    }

    const updated = await HomeMagicBox.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success:true, message:"HomeMagicBox updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch(e){ console.error("abortTransaction error:", e); }
    console.error("updateHomeMagicBox error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(x => x.message);
      return res.status(400).json({ success:false, message:"Validation failed", errors });
    }
    return res.status(500).json({ success:false, message:"Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete HomeMagicBox
 */
export const deleteHomeMagicBox = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"Invalid ID" });
    }

    const existing = await HomeMagicBox.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success:false, message:"HomeMagicBox not found" });
    }

    await HomeMagicBox.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success:true, message:"HomeMagicBox deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch(e){ console.error("abortTransaction error:", e); }
    console.error("deleteHomeMagicBox error:", err);
    return res.status(500).json({ success:false, message:"Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
