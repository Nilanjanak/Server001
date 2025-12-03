// Server/src/Controllers/ResourceExploreSecController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { ResourceExploreSec } from "../../Models/Resourcepage/Explore.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/** upload helper + cleanup local file */
const uploadAndCleanup = async (filePath) => {
  const r = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
  return r;
};

/**
 * Create ResourceExploreSec
 * Accepts multipart/form-data files OR body URLs.
 * Required: cardImg1..3 (file or url) and cardhtext1..3 and carddtext1..3
 */
export const createResourceExploreSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const files = req.files || {};
    const f1 = Array.isArray(files.cardImg1) && files.cardImg1[0] ? files.cardImg1[0] : undefined;
    const f2 = Array.isArray(files.cardImg2) && files.cardImg2[0] ? files.cardImg2[0] : undefined;
    const f3 = Array.isArray(files.cardImg3) && files.cardImg3[0] ? files.cardImg3[0] : undefined;

    const payload = {
      cardImg1: norm(req.body.cardImg1) || undefined,
      cardhtext1: norm(req.body.cardhtext1),
      carddtext1: norm(req.body.carddtext1),
      cardImg2: norm(req.body.cardImg2) || undefined,
      cardhtext2: norm(req.body.cardhtext2),
      carddtext2: norm(req.body.carddtext2),
      cardImg3: norm(req.body.cardImg3) || undefined,
      cardhtext3: norm(req.body.cardhtext3),
      carddtext3: norm(req.body.carddtext3),
    };

    const missing = [];
    if (!f1 && !payload.cardImg1) missing.push("cardImg1 (file or url)");
    if (!payload.cardhtext1) missing.push("cardhtext1");
    if (!payload.carddtext1) missing.push("carddtext1");
    if (!f2 && !payload.cardImg2) missing.push("cardImg2 (file or url)");
    if (!payload.cardhtext2) missing.push("cardhtext2");
    if (!payload.carddtext2) missing.push("carddtext2");
    if (!f3 && !payload.cardImg3) missing.push("cardImg3 (file or url)");
    if (!payload.cardhtext3) missing.push("cardhtext3");
    if (!payload.carddtext3) missing.push("carddtext3");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // upload files if present
    if (f1) {
      const up = await uploadAndCleanup(f1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"cardImg1 upload failed" }); }
      payload.cardImg1 = up.secure_url || up.url || "";
    }
    if (f2) {
      const up = await uploadAndCleanup(f2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"cardImg2 upload failed" }); }
      payload.cardImg2 = up.secure_url || up.url || "";
    }
    if (f3) {
      const up = await uploadAndCleanup(f3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"cardImg3 upload failed" }); }
      payload.cardImg3 = up.secure_url || up.url || "";
    }

    const doc = new ResourceExploreSec(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await ResourceExploreSec.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "ResourceExploreSec created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createResourceExploreSec error:", err);
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
 */
export const getResourceExploreSec = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success:false, message:"Invalid ID" });
      const doc = await ResourceExploreSec.findById(id).lean();
      if (!doc) return res.status(404).json({ success:false, message:"ResourceExploreSec not found" });
      return res.status(200).json({ success:true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await ResourceExploreSec.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success:false, message:"No ResourceExploreSec found" });
      return res.status(200).json({ success:true, data: latest });
    }

    const items = await ResourceExploreSec.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success:true, data: items });
  } catch (err) {
    console.error("getResourceExploreSec error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};

/**
 * Update ResourceExploreSec
 * PATCH /:id
 * Accepts subset of fields and supports replacing cardImg files or updating via URL
 */
export const updateResourceExploreSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"Invalid ID" });
    }

    const existing = await ResourceExploreSec.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success:false, message:"ResourceExploreSec not found" });
    }

    const files = req.files || {};
    const f1 = Array.isArray(files.cardImg1) && files.cardImg1[0] ? files.cardImg1[0] : undefined;
    const f2 = Array.isArray(files.cardImg2) && files.cardImg2[0] ? files.cardImg2[0] : undefined;
    const f3 = Array.isArray(files.cardImg3) && files.cardImg3[0] ? files.cardImg3[0] : undefined;

    const setPayload = {};
    if (typeof req.body.cardhtext1 !== "undefined") {
      const v = norm(req.body.cardhtext1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"cardhtext1 cannot be empty" }); }
      setPayload.cardhtext1 = v;
    }
    if (typeof req.body.carddtext1 !== "undefined") {
      const v = norm(req.body.carddtext1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"carddtext1 cannot be empty" }); }
      setPayload.carddtext1 = v;
    }
    if (typeof req.body.cardhtext2 !== "undefined") {
      const v = norm(req.body.cardhtext2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"cardhtext2 cannot be empty" }); }
      setPayload.cardhtext2 = v;
    }
    if (typeof req.body.carddtext2 !== "undefined") {
      const v = norm(req.body.carddtext2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"carddtext2 cannot be empty" }); }
      setPayload.carddtext2 = v;
    }
    if (typeof req.body.cardhtext3 !== "undefined") {
      const v = norm(req.body.cardhtext3);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"cardhtext3 cannot be empty" }); }
      setPayload.cardhtext3 = v;
    }
    if (typeof req.body.carddtext3 !== "undefined") {
      const v = norm(req.body.carddtext3);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"carddtext3 cannot be empty" }); }
      setPayload.carddtext3 = v;
    }

    // helper to handle file/url
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
      const v1 = await handleFileOrUrl(f1, "cardImg1"); if (typeof v1 !== "undefined") setPayload.cardImg1 = v1;
      const v2 = await handleFileOrUrl(f2, "cardImg2"); if (typeof v2 !== "undefined") setPayload.cardImg2 = v2;
      const v3 = await handleFileOrUrl(f3, "cardImg3"); if (typeof v3 !== "undefined") setPayload.cardImg3 = v3;
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("update file/url error:", e);
      return res.status(400).json({ success:false, message: e.message || "File update failed" });
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"No fields provided to update" });
    }

    const updated = await ResourceExploreSec.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success:true, message:"ResourceExploreSec updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateResourceExploreSec error:", err);
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
 * Delete ResourceExploreSec
 * DELETE /:id
 */
export const deleteResourceExploreSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"Invalid ID" });
    }

    const existing = await ResourceExploreSec.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success:false, message:"ResourceExploreSec not found" });
    }

    await ResourceExploreSec.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success:true, message:"ResourceExploreSec deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteResourceExploreSec error:", err);
    return res.status(500).json({ success:false, message:"Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
