// Server/src/Controllers/ProductHeroSecController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { ProductHeroSec } from "../../Models/Productpage/Herosec.js";


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
export const createProductHeroSec = async (req, res) => {
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
    await ProductHeroSec.deleteMany({}, { session });

    const doc = new ProductHeroSec({ HeroImg });
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
export const getProductHeroSec = async (req, res) => {
  try {
    const doc = await ProductHeroSec.findOne().lean();
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error("getProductHeroSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * UPDATE hero section (same as create, but updates existing)
 */
export const updateProductHeroSec = async (req, res) => {
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

    const existing = await ProductHeroSec.findOne().session(session);
    if (!existing) {
      // If no doc exists, create it
      const doc = new ProductHeroSec({ HeroImg: newHeroImg });
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
export const deleteProductHeroSec = async (req, res) => {
  try {
    await ProductHeroSec.deleteMany({});
    return res.status(200).json({ success: true, message: "Product hero section deleted" });
  } catch (err) {
    console.error("deleteProductHeroSec error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
