// Server/src/Controllers/ResourceSnapshotController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { ResourceSnapshot } from "../../Models/Resourcepage/Snapshot.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/** upload helper + cleanup */
const uploadAndCleanup = async (filePath) => {
  const r = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
  return r;
};

/**
 * Create ResourceSnapshot
 * Accepts multipart/form-data files OR body URLs for snapimg1..4
 */
export const createResourceSnapshot = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const files = req.files || {};
    const f1 = Array.isArray(files.snapimg1) && files.snapimg1[0] ? files.snapimg1[0] : undefined;
    const f2 = Array.isArray(files.snapimg2) && files.snapimg2[0] ? files.snapimg2[0] : undefined;
    const f3 = Array.isArray(files.snapimg3) && files.snapimg3[0] ? files.snapimg3[0] : undefined;
    const f4 = Array.isArray(files.snapimg4) && files.snapimg4[0] ? files.snapimg4[0] : undefined;

    const payload = {
      snapimg1: norm(req.body.snapimg1) || undefined,
      snaptext1: norm(req.body.snaptext1),
      snapimg2: norm(req.body.snapimg2) || undefined,
      snaptext2: norm(req.body.snaptext2),
      snapimg3: norm(req.body.snapimg3) || undefined,
      snaptext3: norm(req.body.snaptext3),
      snapimg4: norm(req.body.snapimg4) || undefined,
      snaptext4: norm(req.body.snaptext4),
    };

    const missing = [];
    if (!f1 && !payload.snapimg1) missing.push("snapimg1 (file or url)");
    if (!payload.snaptext1) missing.push("snaptext1");
    if (!f2 && !payload.snapimg2) missing.push("snapimg2 (file or url)");
    if (!payload.snaptext2) missing.push("snaptext2");
    if (!f3 && !payload.snapimg3) missing.push("snapimg3 (file or url)");
    if (!payload.snaptext3) missing.push("snaptext3");
    if (!f4 && !payload.snapimg4) missing.push("snapimg4 (file or url)");
    if (!payload.snaptext4) missing.push("snaptext4");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // upload files if provided
    if (f1) {
      const up = await uploadAndCleanup(f1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"snapimg1 upload failed" }); }
      payload.snapimg1 = up.secure_url || up.url || "";
    }
    if (f2) {
      const up = await uploadAndCleanup(f2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"snapimg2 upload failed" }); }
      payload.snapimg2 = up.secure_url || up.url || "";
    }
    if (f3) {
      const up = await uploadAndCleanup(f3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"snapimg3 upload failed" }); }
      payload.snapimg3 = up.secure_url || up.url || "";
    }
    if (f4) {
      const up = await uploadAndCleanup(f4.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"snapimg4 upload failed" }); }
      payload.snapimg4 = up.secure_url || up.url || "";
    }

    const doc = new ResourceSnapshot(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await ResourceSnapshot.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "ResourceSnapshot created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createResourceSnapshot error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success:false, message: `Unexpected file field: ${err.field}. Allowed: snapimg1,snapimg2,snapimg3,snapimg4` });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET list / single / latest
 */
export const getResourceSnapshot = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await ResourceSnapshot.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "ResourceSnapshot not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await ResourceSnapshot.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No ResourceSnapshot found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await ResourceSnapshot.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getResourceSnapshot error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update ResourceSnapshot
 * PATCH /:id
 * Accepts partial updates and supports file upload or URL for snapimg fields
 */
export const updateResourceSnapshot = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await ResourceSnapshot.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "ResourceSnapshot not found" });
    }

    const files = req.files || {};
    const f1 = Array.isArray(files.snapimg1) && files.snapimg1[0] ? files.snapimg1[0] : undefined;
    const f2 = Array.isArray(files.snapimg2) && files.snapimg2[0] ? files.snapimg2[0] : undefined;
    const f3 = Array.isArray(files.snapimg3) && files.snapimg3[0] ? files.snapimg3[0] : undefined;
    const f4 = Array.isArray(files.snapimg4) && files.snapimg4[0] ? files.snapimg4[0] : undefined;

    const setPayload = {};

    // text fields allowed to update
    const textFields = ["snaptext1","snaptext2","snaptext3","snaptext4"];
    for (const k of textFields) {
      if (typeof req.body[k] !== "undefined") {
        const v = norm(req.body[k]);
        if (!v) {
          if (session.inTransaction()) await session.abortTransaction();
          return res.status(400).json({ success: false, message: `${k} cannot be empty` });
        }
        setPayload[k] = v;
      }
    }

    // helper to handle file or url (returns undefined if nothing provided)
    const handleFileOrUrl = async (file, bodyField) => {
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
      const v1 = await handleFileOrUrl(f1, "snapimg1"); if (typeof v1 !== "undefined") setPayload.snapimg1 = v1;
      const v2 = await handleFileOrUrl(f2, "snapimg2"); if (typeof v2 !== "undefined") setPayload.snapimg2 = v2;
      const v3 = await handleFileOrUrl(f3, "snapimg3"); if (typeof v3 !== "undefined") setPayload.snapimg3 = v3;
      const v4 = await handleFileOrUrl(f4, "snapimg4"); if (typeof v4 !== "undefined") setPayload.snapimg4 = v4;
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("update file/url error:", e);
      return res.status(400).json({ success: false, message: e.message || "File update failed" });
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await ResourceSnapshot.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "ResourceSnapshot updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateResourceSnapshot error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(x => x.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: `Unexpected file field: ${err.field}. Allowed: snapimg1,snapimg2,snapimg3,snapimg4` });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete ResourceSnapshot
 * DELETE /:id
 */
export const deleteResourceSnapshot = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await ResourceSnapshot.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "ResourceSnapshot not found" });
    }

    await ResourceSnapshot.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "ResourceSnapshot deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteResourceSnapshot error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
