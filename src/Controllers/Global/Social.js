import mongoose, { isValidObjectId } from "mongoose";
import Social from "../../Models/Global/Social.js";
import Footer from "../../Models/Global/Footer.js";
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // your cloudinary util

// Simple normalizer used across controllers
const norm = (v) => (typeof v === "string" ? v.trim() : v);

/**
 * Create social (transactional) — attaches to footer.socials if possible.
 * Body: { link, footerId? } + file: icon (multipart/form-data)
 * Expects multer to have placed file under req.file (single upload)
 */
export const createSocial = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // multer single('icon') -> req.file
    const file = req.file;

    const payload = {
      link: norm(req.body.link),
      icon: undefined,
    };

    const missing = [];
    // icon file is required for this flow (you can make optional if you want)
    if (!file) missing.push("icon file");
    if (!payload.link) missing.push("link");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // upload icon to cloudinary
    const uploadResult = await uploadOnCloudinary(file.path);
    if (!uploadResult) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Icon upload failed" });
    }
    payload.icon = uploadResult.secure_url || uploadResult.url || "";

    // Optional footerId validation and default attach
    let footerId;
    if (typeof req.body.footerId !== "undefined") {
      footerId = norm(req.body.footerId);
      if (!footerId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "footerId cannot be empty if provided" });
      }
      if (!isValidObjectId(footerId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid footerId" });
      }
      const footerExists = await Footer.findById(footerId).session(session).lean();
      if (!footerExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Footer not found" });
      }
    } else {
      const defaultFooter = await Footer.findOne().session(session).lean();
      if (defaultFooter) footerId = defaultFooter._id;
    }

    // create social
    const social = new Social({ icon: payload.icon, link: payload.link });
    await social.save({ session });

    // attach to footer if footerId resolved
    if (footerId) {
      await Footer.findByIdAndUpdate(
        footerId,
        { $addToSet: { socials: social._id } },
        { session }
      );
    }

    await session.commitTransaction();

    const result = await Social.findById(social._id);
    return res.status(201).json({ success: true, message: "Social created successfully", data: { social: result, footerId: footerId || null } });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (abortErr) { console.error("abortTransaction error:", abortErr); }
    console.error("createSocial error:", err);
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
 * GET /api/socials/         -> list
 * GET /api/socials/latest   -> latest
 * GET /api/socials/:id      -> single
 */
export const getSocials = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await Social.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "Social not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await Social.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No social found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await Social.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getSocials error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update social (transactional).
 * Params: :id
 * Body: { link? } + optional file: icon (multipart/form-data)
 */
export const updateSocial = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid social id" });
    }

    const updates = {};
    if (typeof req.body.link !== "undefined") updates.link = norm(req.body.link);

    // file handling: optional replacement of icon
    const file = req.file;
    if (file) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (!uploaded) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Icon upload failed." });
      }
      updates.icon = uploaded.secure_url || uploaded.url || "";
    }

    if (Object.keys(updates).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const existing = await Social.findById(id).session(session).lean();
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Social not found" });
    }

    const updated = await Social.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true, session });

    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Social updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (abortErr) { console.error("abortTransaction error:", abortErr); }
    console.error("updateSocial error:", err);
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
 * Delete social (transactional) — deletes social and removes references from Footer.socials
 * Params: :id
 */
export const deleteSocial = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid social id" });
    }

    const existing = await Social.findById(id).session(session).lean();
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Social not found" });
    }

    // Optionally: if you store cloudinary public_id, you can remove remote asset here.

    const deleted = await Social.findByIdAndDelete(id, { session });
    if (!deleted) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Failed to delete social" });
    }

    // Remove references from any footers
    await Footer.updateMany({ socials: id }, { $pull: { socials: id } }, { session });

    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Social deleted and references removed", data: deleted });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (abortErr) { console.error("abortTransaction error:", abortErr); }
    console.error("deleteSocial error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};