// Server/src/Controllers/HomeAicapController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { HomeAicap } from "../../Models/Homepage/Aicapability.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);


// helper to upload a file and cleanup local temp
const uploadAndCleanup = async (filePath) => {
  const res = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
  return res;
};

/**
 * Create HomeAicap
 * Accepts multipart/form-data:
 * - optional file fields tagIcon1..4 (images) OR text fields tagIcon1..4 (string URL)
 * - file fields tagImg1..4 (images) OR text fields tagImg1..4 (string URL)
 * - text fields taghtext1..4 (required)
 */
export const createHomeAicap = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const files = req.files || {};

    // file candidates (may be undefined)
    const fileIcon1 = Array.isArray(files.tagIcon1) && files.tagIcon1.length ? files.tagIcon1[0] : undefined;
    const fileIcon2 = Array.isArray(files.tagIcon2) && files.tagIcon2.length ? files.tagIcon2[0] : undefined;
    const fileIcon3 = Array.isArray(files.tagIcon3) && files.tagIcon3.length ? files.tagIcon3[0] : undefined;
    const fileIcon4 = Array.isArray(files.tagIcon4) && files.tagIcon4.length ? files.tagIcon4[0] : undefined;

    const fileImg1 = Array.isArray(files.tagImg1) && files.tagImg1.length ? files.tagImg1[0] : undefined;
    const fileImg2 = Array.isArray(files.tagImg2) && files.tagImg2.length ? files.tagImg2[0] : undefined;
    const fileImg3 = Array.isArray(files.tagImg3) && files.tagImg3.length ? files.tagImg3[0] : undefined;
    const fileImg4 = Array.isArray(files.tagImg4) && files.tagImg4.length ? files.tagImg4[0] : undefined;

    const payload = {
      tagIcon1: norm(req.body.tagIcon1) || undefined,
      tagIcon2: norm(req.body.tagIcon2) || undefined,
      tagIcon3: norm(req.body.tagIcon3) || undefined,
      tagIcon4: norm(req.body.tagIcon4) || undefined,
      taghtext1: norm(req.body.taghtext1),
      taghtext2: norm(req.body.taghtext2),
      taghtext3: norm(req.body.taghtext3),
      taghtext4: norm(req.body.taghtext4),
      tagImg1: norm(req.body.tagImg1) || undefined,
      tagImg2: norm(req.body.tagImg2) || undefined,
      tagImg3: norm(req.body.tagImg3) || undefined,
      tagImg4: norm(req.body.tagImg4) || undefined,
    };

    const missing = [];
    // require taghtext1..4
    if (!payload.taghtext1) missing.push("taghtext1");
    if (!payload.taghtext2) missing.push("taghtext2");
    if (!payload.taghtext3) missing.push("taghtext3");
    if (!payload.taghtext4) missing.push("taghtext4");

    // require either file or text url for each icon & img
    // icon1
    if (!payload.tagIcon1 && !fileIcon1) missing.push("tagIcon1 (file or url)");
    if (!payload.tagIcon2 && !fileIcon2) missing.push("tagIcon2 (file or url)");
    if (!payload.tagIcon3 && !fileIcon3) missing.push("tagIcon3 (file or url)");
    if (!payload.tagIcon4 && !fileIcon4) missing.push("tagIcon4 (file or url)");

    // image files
    if (!payload.tagImg1 && !fileImg1) missing.push("tagImg1 (file or url)");
    if (!payload.tagImg2 && !fileImg2) missing.push("tagImg2 (file or url)");
    if (!payload.tagImg3 && !fileImg3) missing.push("tagImg3 (file or url)");
    if (!payload.tagImg4 && !fileImg4) missing.push("tagImg4 (file or url)");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // Upload any provided files and store secure_url
    if (fileIcon1) {
      const up = await uploadAndCleanup(fileIcon1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagIcon1 upload failed" }); }
      payload.tagIcon1 = up.secure_url || up.url || "";
    }
    if (fileIcon2) {
      const up = await uploadAndCleanup(fileIcon2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagIcon2 upload failed" }); }
      payload.tagIcon2 = up.secure_url || up.url || "";
    }
    if (fileIcon3) {
      const up = await uploadAndCleanup(fileIcon3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagIcon3 upload failed" }); }
      payload.tagIcon3 = up.secure_url || up.url || "";
    }
    if (fileIcon4) {
      const up = await uploadAndCleanup(fileIcon4.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagIcon4 upload failed" }); }
      payload.tagIcon4 = up.secure_url || up.url || "";
    }

    if (fileImg1) {
      const up = await uploadAndCleanup(fileImg1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagImg1 upload failed" }); }
      payload.tagImg1 = up.secure_url || up.url || "";
    }
    if (fileImg2) {
      const up = await uploadAndCleanup(fileImg2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagImg2 upload failed" }); }
      payload.tagImg2 = up.secure_url || up.url || "";
    }
    if (fileImg3) {
      const up = await uploadAndCleanup(fileImg3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagImg3 upload failed" }); }
      payload.tagImg3 = up.secure_url || up.url || "";
    }
    if (fileImg4) {
      const up = await uploadAndCleanup(fileImg4.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message: "tagImg4 upload failed" }); }
      payload.tagImg4 = up.secure_url || up.url || "";
    }

    // create doc
    const doc = new HomeAicap(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeAicap.findById(doc._id);
    return res.status(201).json({ success: true, message: "HomeAicap created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeAicap error:", err);
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
 * GET list / single / latest
 */
export const getHomeAicap = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeAicap.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "HomeAicap not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeAicap.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No HomeAicap found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeAicap.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeAicap error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeAicap
 * PATCH /:id
 * Accepts optional tag text/icon fields and optional image files to replace
 */
export const updateHomeAicap = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"ID required" }); }
    if (!mongoose.Types.ObjectId.isValid(String(id))) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"Invalid ID" }); }

    const existing = await HomeAicap.findById(id).session(session);
    if (!existing) { if (session.inTransaction()) await session.abortTransaction(); return res.status(404).json({ success:false, message:"HomeAicap not found" }); }

    const setPayload = {};
    // accept text/icon string updates if provided (must be non-empty)
    const textKeys = [
      "tagIcon1","tagIcon2","tagIcon3","tagIcon4",
      "taghtext1","taghtext2","taghtext3","taghtext4",
      "tagImg1","tagImg2","tagImg3","tagImg4"
    ];
    for (const k of textKeys) {
      if (typeof req.body[k] !== "undefined") {
        const v = norm(req.body[k]);
        if (!v) {
          if (session.inTransaction()) await session.abortTransaction();
          return res.status(400).json({ success:false, message: `${k} cannot be empty` });
        }
        setPayload[k] = v;
      }
    }

    // file handling (optional replacements)
    const files = req.files || {};
    const fileIcon1 = Array.isArray(files.tagIcon1) && files.tagIcon1.length ? files.tagIcon1[0] : undefined;
    const fileIcon2 = Array.isArray(files.tagIcon2) && files.tagIcon2.length ? files.tagIcon2[0] : undefined;
    const fileIcon3 = Array.isArray(files.tagIcon3) && files.tagIcon3.length ? files.tagIcon3[0] : undefined;
    const fileIcon4 = Array.isArray(files.tagIcon4) && files.tagIcon4.length ? files.tagIcon4[0] : undefined;

    const fileImg1 = Array.isArray(files.tagImg1) && files.tagImg1.length ? files.tagImg1[0] : undefined;
    const fileImg2 = Array.isArray(files.tagImg2) && files.tagImg2.length ? files.tagImg2[0] : undefined;
    const fileImg3 = Array.isArray(files.tagImg3) && files.tagImg3.length ? files.tagImg3[0] : undefined;
    const fileImg4 = Array.isArray(files.tagImg4) && files.tagImg4.length ? files.tagImg4[0] : undefined;

    if (fileIcon1) {
      const up = await uploadAndCleanup(fileIcon1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagIcon1 upload failed" }); }
      setPayload.tagIcon1 = up.secure_url || up.url || "";
    }
    if (fileIcon2) {
      const up = await uploadAndCleanup(fileIcon2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagIcon2 upload failed" }); }
      setPayload.tagIcon2 = up.secure_url || up.url || "";
    }
    if (fileIcon3) {
      const up = await uploadAndCleanup(fileIcon3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagIcon3 upload failed" }); }
      setPayload.tagIcon3 = up.secure_url || up.url || "";
    }
    if (fileIcon4) {
      const up = await uploadAndCleanup(fileIcon4.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagIcon4 upload failed" }); }
      setPayload.tagIcon4 = up.secure_url || up.url || "";
    }

    if (fileImg1) {
      const up = await uploadAndCleanup(fileImg1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagImg1 upload failed" }); }
      setPayload.tagImg1 = up.secure_url || up.url || "";
    }
    if (fileImg2) {
      const up = await uploadAndCleanup(fileImg2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagImg2 upload failed" }); }
      setPayload.tagImg2 = up.secure_url || up.url || "";
    }
    if (fileImg3) {
      const up = await uploadAndCleanup(fileImg3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagImg3 upload failed" }); }
      setPayload.tagImg3 = up.secure_url || up.url || "";
    }
    if (fileImg4) {
      const up = await uploadAndCleanup(fileImg4.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"tagImg4 upload failed" }); }
      setPayload.tagImg4 = up.secure_url || up.url || "";
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"No fields provided to update" });
    }

    const updated = await HomeAicap.findByIdAndUpdate(id, { $set: setPayload }, { new:true, runValidators:true, session });

    await session.commitTransaction();

    const result = await HomeAicap.findById(updated._id);
    return res.status(200).json({ success:true, message:"HomeAicap updated", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeAicap error:", err);
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
 * Delete HomeAicap
 */
export const deleteHomeAicap = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeAicap.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeAicap not found" });
    }

    await HomeAicap.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "HomeAicap deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeAicap error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
