// Server/src/Controllers/HomeBannerController.js
import mongoose from "mongoose";

import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { HomeBanner } from "../../Models/Homepage/Banner.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);

/**
 * Create HomeBanner
 * Expects multipart/form-data:
 *  - files: vd1, vd2, vd3 (video files)
 *  - fields: htext, dtext
 */
export const createHomeBanner = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const files = req.files || {};
    const f1 = Array.isArray(files.vd1) && files.vd1.length ? files.vd1[0] : undefined;
    const f2 = Array.isArray(files.vd2) && files.vd2.length ? files.vd2[0] : undefined;
    const f3 = Array.isArray(files.vd3) && files.vd3.length ? files.vd3[0] : undefined;

    const payload = {
      htext: norm(req.body.htext),
      dtext: norm(req.body.dtext),
      vd1: undefined,
      vd2: undefined,
      vd3: undefined,
    };

    const missing = [];
    if (!payload.htext) missing.push("htext");
    if (!payload.dtext) missing.push("dtext");
    if (!f1) missing.push("vd1 file");
    if (!f2) missing.push("vd2 file");
    if (!f3) missing.push("vd3 file");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // Upload each video to Cloudinary (sequential; can be parallelized if desired)
    const up1 = await uploadOnCloudinary(f1.path);
    if (!up1) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "vd1 upload failed" });
    }
    payload.vd1 = up1.secure_url || up1.url || "";

    const up2 = await uploadOnCloudinary(f2.path);
    if (!up2) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "vd2 upload failed" });
    }
    payload.vd2 = up2.secure_url || up2.url || "";

    const up3 = await uploadOnCloudinary(f3.path);
    if (!up3) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "vd3 upload failed" });
    }
    payload.vd3 = up3.secure_url || up3.url || "";

    // create doc
    const doc = new HomeBanner(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeBanner.findById(doc._id);
    return res.status(201).json({ success: true, message: "HomeBanner created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeBanner error:", err);
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
 * Get HomeBanner(s)
 * GET /api/homebanner         -> list
 * GET /api/homebanner/latest  -> latest
 * GET /api/homebanner/:id     -> single
 */
export const getHomeBanner = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeBanner.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "HomeBanner not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeBanner.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No HomeBanner found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeBanner.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeBanner error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeBanner
 * PATCH /api/homebanner/:id
 * Accepts optional files vd1, vd2, vd3 to replace existing videos
 * Accepts optional fields htext, dtext
 */
export const updateHomeBanner = async (req, res) => {
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

    const existing = await HomeBanner.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeBanner not found" });
    }

    const setPayload = {};
    if (typeof req.body.htext !== "undefined") {
      const v = norm(req.body.htext);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "htext cannot be empty" });
      }
      setPayload.htext = v;
    }
    if (typeof req.body.dtext !== "undefined") {
      const v = norm(req.body.dtext);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "dtext cannot be empty" });
      }
      setPayload.dtext = v;
    }

    // files
    const files = req.files || {};
    const f1 = Array.isArray(files.vd1) && files.vd1.length ? files.vd1[0] : undefined;
    const f2 = Array.isArray(files.vd2) && files.vd2.length ? files.vd2[0] : undefined;
    const f3 = Array.isArray(files.vd3) && files.vd3.length ? files.vd3[0] : undefined;

    if (f1) {
      const up = await uploadOnCloudinary(f1.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "vd1 upload failed" });
      }
      setPayload.vd1 = up.secure_url || up.url || "";
    }
    if (f2) {
      const up = await uploadOnCloudinary(f2.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "vd2 upload failed" });
      }
      setPayload.vd2 = up.secure_url || up.url || "";
    }
    if (f3) {
      const up = await uploadOnCloudinary(f3.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "vd3 upload failed" });
      }
      setPayload.vd3 = up.secure_url || up.url || "";
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeBanner.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();

    const result = await HomeBanner.findById(updated._id);
    return res.status(200).json({ success: true, message: "HomeBanner updated", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeBanner error:", err);
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
 * Delete HomeBanner
 * DELETE /api/homebanner/:id
 */
export const deleteHomeBanner = async (req, res) => {
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

    const existing = await HomeBanner.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeBanner not found" });
    }

    await HomeBanner.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "HomeBanner deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeBanner error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
