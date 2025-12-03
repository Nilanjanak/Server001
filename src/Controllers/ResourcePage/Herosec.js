// Server/src/Controllers/ProductHeroSecController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { ResourceHeroSec } from "../../Models/Resourcepage/Herosec.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);

/** Upload + cleanup helper */
const uploadAndCleanup = async (filePath) => {
  const result = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) {}
  return result;
};

/**
 * CREATE ProductHeroSec
 * — Only one document should exist
 * — Replaces old doc if it exists
 */
export const createResourceHeroSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const file = req.file;

    if (!file && !req.body.HeroImg) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "HeroImg (file or url) is required",
      });
    }

    // Upload file if provided
    let HeroImg = norm(req.body.HeroImg) || undefined;
    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Upload failed" });
      }
      HeroImg = up.secure_url || up.url || "";
    }

    // Delete old doc (keep only one)
    await ResourceHeroSec.deleteMany({}, { session });

    const doc = new ResourceHeroSec({ HeroImg });
    await doc.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Product hero section saved",
      data: doc,
    });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch {}
    console.error("createOrReplaceProductHeroSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET hero section (always returns one or empty)
 */
export const getResourceHeroSec = async (req, res) => {
  try {
    const doc = await ResourceHeroSec.findOne().lean();
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error("getProductHeroSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * UPDATE hero section (same as create, but updates existing)
 */
export const updateResourceHeroSec = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const file = req.file;
    let v = norm(req.body.HeroImg) || undefined;

    let newHeroImg;

    if (file) {
      const up = await uploadAndCleanup(file.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Upload failed" });
      }
      newHeroImg = up.secure_url || up.url || "";
    } else if (v) {
      newHeroImg = v;
    } else {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "HeroImg (file or url) required for update",
      });
    }

    const existing = await ResourceHeroSec.findOne().session(session);
    if (!existing) {
      // If no doc exists, create it
      const doc = new ResourceHeroSec({ HeroImg: newHeroImg });
      await doc.save({ session });
      await session.commitTransaction();
      return res.status(200).json({ success: true, message: "Created", data: doc });
    }

    existing.HeroImg = newHeroImg;
    await existing.save({ session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Updated", data: existing });

  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch {}
    console.error("updateProductHeroSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * DELETE hero section (no ID needed)
 */
export const deleteResourceHeroSec = async (req, res) => {
  try {
    await ResourceHeroSec.deleteMany({});
    return res.status(200).json({ success: true, message: "Product hero section deleted" });
  } catch (err) {
    console.error("deleteProductHeroSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
