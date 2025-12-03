// Server/src/Controllers/HomeIntegrationController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { HomeIntegration } from "../../Models/Homepage/Integration.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/** helper to upload file and cleanup local copy */
const uploadAndCleanup = async (filePath) => {
  const r = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
  return r;
};

/**
 * Create HomeIntegration
 * Accepts multipart/form-data files OR body URLs.
 * Required fields: mainhtext, maindtext, centerIcon, outerIcon1..outerIcon6
 */
export const createHomeIntegration = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // files from multer (upload.fields)
    const files = req.files || {};
    const fileCenter = Array.isArray(files.centerIcon) && files.centerIcon[0] ? files.centerIcon[0] : undefined;
    const fileOuter1 = Array.isArray(files.outerIcon1) && files.outerIcon1[0] ? files.outerIcon1[0] : undefined;
    const fileOuter2 = Array.isArray(files.outerIcon2) && files.outerIcon2[0] ? files.outerIcon2[0] : undefined;
    const fileOuter3 = Array.isArray(files.outerIcon3) && files.outerIcon3[0] ? files.outerIcon3[0] : undefined;
    const fileOuter4 = Array.isArray(files.outerIcon4) && files.outerIcon4[0] ? files.outerIcon4[0] : undefined;
    const fileOuter5 = Array.isArray(files.outerIcon5) && files.outerIcon5[0] ? files.outerIcon5[0] : undefined;
    const fileOuter6 = Array.isArray(files.outerIcon6) && files.outerIcon6[0] ? files.outerIcon6[0] : undefined;

    const payload = {
      mainhtext: norm(req.body.mainhtext),
      maindtext: norm(req.body.maindtext),
      centerIcon: norm(req.body.centerIcon) || undefined,
      outerIcon1: norm(req.body.outerIcon1) || undefined,
      outerIcon2: norm(req.body.outerIcon2) || undefined,
      outerIcon3: norm(req.body.outerIcon3) || undefined,
      outerIcon4: norm(req.body.outerIcon4) || undefined,
      outerIcon5: norm(req.body.outerIcon5) || undefined,
      outerIcon6: norm(req.body.outerIcon6) || undefined,
    };

    // required check
    const missing = [];
    if (!payload.mainhtext) missing.push("mainhtext");
    if (!payload.maindtext) missing.push("maindtext");

    // for each icon, require either file or url
    if (!fileCenter && !payload.centerIcon) missing.push("centerIcon (file or url)");
    if (!fileOuter1 && !payload.outerIcon1) missing.push("outerIcon1 (file or url)");
    if (!fileOuter2 && !payload.outerIcon2) missing.push("outerIcon2 (file or url)");
    if (!fileOuter3 && !payload.outerIcon3) missing.push("outerIcon3 (file or url)");
    if (!fileOuter4 && !payload.outerIcon4) missing.push("outerIcon4 (file or url)");
    if (!fileOuter5 && !payload.outerIcon5) missing.push("outerIcon5 (file or url)");
    if (!fileOuter6 && !payload.outerIcon6) missing.push("outerIcon6 (file or url)");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // Upload files if present and set payload fields
    if (fileCenter) {
      const up = await uploadAndCleanup(fileCenter.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "centerIcon upload failed" }); }
      payload.centerIcon = up.secure_url || up.url || "";
    }
    if (fileOuter1) {
      const up = await uploadAndCleanup(fileOuter1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "outerIcon1 upload failed" }); }
      payload.outerIcon1 = up.secure_url || up.url || "";
    }
    if (fileOuter2) {
      const up = await uploadAndCleanup(fileOuter2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "outerIcon2 upload failed" }); }
      payload.outerIcon2 = up.secure_url || up.url || "";
    }
    if (fileOuter3) {
      const up = await uploadAndCleanup(fileOuter3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "outerIcon3 upload failed" }); }
      payload.outerIcon3 = up.secure_url || up.url || "";
    }
    if (fileOuter4) {
      const up = await uploadAndCleanup(fileOuter4.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "outerIcon4 upload failed" }); }
      payload.outerIcon4 = up.secure_url || up.url || "";
    }
    if (fileOuter5) {
      const up = await uploadAndCleanup(fileOuter5.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "outerIcon5 upload failed" }); }
      payload.outerIcon5 = up.secure_url || up.url || "";
    }
    if (fileOuter6) {
      const up = await uploadAndCleanup(fileOuter6.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "outerIcon6 upload failed" }); }
      payload.outerIcon6 = up.secure_url || up.url || "";
    }

    const doc = new HomeIntegration(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeIntegration.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "HomeIntegration created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeIntegration error:", err);
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
export const getHomeIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeIntegration.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "HomeIntegration not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeIntegration.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No HomeIntegration found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeIntegration.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeIntegration error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeIntegration
 * PATCH /:id
 * Accepts any subset of fields; supports replacing icons via file or URL
 */
export const updateHomeIntegration = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeIntegration.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeIntegration not found" });
    }

    const files = req.files || {};
    const fileCenter = Array.isArray(files.centerIcon) && files.centerIcon[0] ? files.centerIcon[0] : undefined;
    const fileOuter1 = Array.isArray(files.outerIcon1) && files.outerIcon1[0] ? files.outerIcon1[0] : undefined;
    const fileOuter2 = Array.isArray(files.outerIcon2) && files.outerIcon2[0] ? files.outerIcon2[0] : undefined;
    const fileOuter3 = Array.isArray(files.outerIcon3) && files.outerIcon3[0] ? files.outerIcon3[0] : undefined;
    const fileOuter4 = Array.isArray(files.outerIcon4) && files.outerIcon4[0] ? files.outerIcon4[0] : undefined;
    const fileOuter5 = Array.isArray(files.outerIcon5) && files.outerIcon5[0] ? files.outerIcon5[0] : undefined;
    const fileOuter6 = Array.isArray(files.outerIcon6) && files.outerIcon6[0] ? files.outerIcon6[0] : undefined;

    const setPayload = {};
    if (typeof req.body.mainhtext !== "undefined") {
      const v = norm(req.body.mainhtext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"mainhtext cannot be empty" }); }
      setPayload.mainhtext = v;
    }
    if (typeof req.body.maindtext !== "undefined") {
      const v = norm(req.body.maindtext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"maindtext cannot be empty" }); }
      setPayload.maindtext = v;
    }

    // handle icon file replacements or URL updates
    if (fileCenter) {
      const up = await uploadAndCleanup(fileCenter.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "centerIcon upload failed" }); }
      setPayload.centerIcon = up.secure_url || up.url || "";
    } else if (typeof req.body.centerIcon !== "undefined") {
      const v = norm(req.body.centerIcon);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"centerIcon cannot be empty" }); }
      setPayload.centerIcon = v;
    }

    const handleOuterFileOrUrl = async (file, bodyFieldName) => {
      if (file) {
        const up = await uploadAndCleanup(file.path);
        if (!up) throw new Error(`${bodyFieldName} upload failed`);
        return up.secure_url || up.url || "";
      } else if (typeof req.body[bodyFieldName] !== "undefined") {
        const v = norm(req.body[bodyFieldName]);
        if (!v) throw new Error(`${bodyFieldName} cannot be empty`);
        return v;
      }
      return undefined;
    };

    try {
      const val1 = await handleOuterFileOrUrl(fileOuter1, "outerIcon1");
      if (typeof val1 !== "undefined") setPayload.outerIcon1 = val1;
      const val2 = await handleOuterFileOrUrl(fileOuter2, "outerIcon2");
      if (typeof val2 !== "undefined") setPayload.outerIcon2 = val2;
      const val3 = await handleOuterFileOrUrl(fileOuter3, "outerIcon3");
      if (typeof val3 !== "undefined") setPayload.outerIcon3 = val3;
      const val4 = await handleOuterFileOrUrl(fileOuter4, "outerIcon4");
      if (typeof val4 !== "undefined") setPayload.outerIcon4 = val4;
      const val5 = await handleOuterFileOrUrl(fileOuter5, "outerIcon5");
      if (typeof val5 !== "undefined") setPayload.outerIcon5 = val5;
      const val6 = await handleOuterFileOrUrl(fileOuter6, "outerIcon6");
      if (typeof val6 !== "undefined") setPayload.outerIcon6 = val6;
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("update icon error:", e);
      return res.status(400).json({ success: false, message: e.message || "Icon update failed" });
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeIntegration.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeIntegration updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeIntegration error:", err);
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
 * Delete HomeIntegration
 */
export const deleteHomeIntegration = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeIntegration.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeIntegration not found" });
    }

    await HomeIntegration.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeIntegration deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeIntegration error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
