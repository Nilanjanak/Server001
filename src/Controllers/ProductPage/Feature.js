// Server/src/Controllers/ProductFeatureController.js
import mongoose from "mongoose";
import fs from "fs";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";
import { ProductFeature } from "../../Models/Productpage/Feature.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/** upload to cloudinary then cleanup local file */
const uploadAndCleanup = async (filePath) => {
  const r = await uploadOnCloudinary(filePath);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }
  return r;
};

/**
 * Create ProductFeature
 * Accepts multipart/form-data files OR body URLs.
 * Required fields: htext, cardvd1, cardhtext1, carddtext1, cardvd2, cardhtext2, carddtext2, cardvd3, cardhtext3, carddtext3
 * cardvd1/2/3 can be files (multipart) or URLs (string in body).
 */
export const createProductFeature = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const files = req.files || {};
    const f1 = Array.isArray(files.cardvd1) && files.cardvd1[0] ? files.cardvd1[0] : undefined;
    const f2 = Array.isArray(files.cardvd2) && files.cardvd2[0] ? files.cardvd2[0] : undefined;
    const f3 = Array.isArray(files.cardvd3) && files.cardvd3[0] ? files.cardvd3[0] : undefined;

    const payload = {
      htext: norm(req.body.htext),
      cardvd1: norm(req.body.cardvd1) || undefined,
      cardhtext1: norm(req.body.cardhtext1),
      carddtext1: norm(req.body.carddtext1),
      cardvd2: norm(req.body.cardvd2) || undefined,
      cardhtext2: norm(req.body.cardhtext2),
      carddtext2: norm(req.body.carddtext2),
      cardvd3: norm(req.body.cardvd3) || undefined,
      cardhtext3: norm(req.body.cardhtext3),
      carddtext3: norm(req.body.carddtext3),
    };

    const missing = [];
    if (!payload.htext) missing.push("htext");
    if (!f1 && !payload.cardvd1) missing.push("cardvd1 (file or url)");
    if (!payload.cardhtext1) missing.push("cardhtext1");
    if (!payload.carddtext1) missing.push("carddtext1");
    if (!f2 && !payload.cardvd2) missing.push("cardvd2 (file or url)");
    if (!payload.cardhtext2) missing.push("cardhtext2");
    if (!payload.carddtext2) missing.push("carddtext2");
    if (!f3 && !payload.cardvd3) missing.push("cardvd3 (file or url)");
    if (!payload.cardhtext3) missing.push("cardhtext3");
    if (!payload.carddtext3) missing.push("carddtext3");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // Upload files if present and set payload fields
    if (f1) {
      const up = await uploadAndCleanup(f1.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"cardvd1 upload failed" }); }
      payload.cardvd1 = up.secure_url || up.url || "";
    }
    if (f2) {
      const up = await uploadAndCleanup(f2.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"cardvd2 upload failed" }); }
      payload.cardvd2 = up.secure_url || up.url || "";
    }
    if (f3) {
      const up = await uploadAndCleanup(f3.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success:false, message:"cardvd3 upload failed" }); }
      payload.cardvd3 = up.secure_url || up.url || "";
    }

    const doc = new ProductFeature(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await ProductFeature.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "ProductFeature created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createProductFeature error:", err);
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
export const getProductFeature = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success:false, message:"Invalid ID" });
      const doc = await ProductFeature.findById(id).lean();
      if (!doc) return res.status(404).json({ success:false, message:"ProductFeature not found" });
      return res.status(200).json({ success:true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await ProductFeature.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success:false, message:"No ProductFeature found" });
      return res.status(200).json({ success:true, data: latest });
    }

    const items = await ProductFeature.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success:true, data: items });
  } catch (err) {
    console.error("getProductFeature error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};

/**
 * Update ProductFeature
 * PATCH /:id
 * Accepts subset of fields and supports replacing cardvd files or updating via URL
 */
export const updateProductFeature = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"Invalid ID" });
    }

    const existing = await ProductFeature.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success:false, message:"ProductFeature not found" });
    }

    const files = req.files || {};
    const f1 = Array.isArray(files.cardvd1) && files.cardvd1[0] ? files.cardvd1[0] : undefined;
    const f2 = Array.isArray(files.cardvd2) && files.cardvd2[0] ? files.cardvd2[0] : undefined;
    const f3 = Array.isArray(files.cardvd3) && files.cardvd3[0] ? files.cardvd3[0] : undefined;

    const setPayload = {};
    if (typeof req.body.htext !== "undefined") {
      const v = norm(req.body.htext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"htext cannot be empty" }); }
      setPayload.htext = v;
    }

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

    // file/url fields for cardvd1..3
    try {
      const v1 = await handleFileOrUrl(f1, "cardvd1");
      if (typeof v1 !== "undefined") setPayload.cardvd1 = v1;
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

      const v2 = await handleFileOrUrl(f2, "cardvd2");
      if (typeof v2 !== "undefined") setPayload.cardvd2 = v2;
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

      const v3 = await handleFileOrUrl(f3, "cardvd3");
      if (typeof v3 !== "undefined") setPayload.cardvd3 = v3;
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
    } catch (e) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error("update file/url error:", e);
      return res.status(400).json({ success:false, message: e.message || "File update failed" });
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"No fields provided to update" });
    }

    const updated = await ProductFeature.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success:true, message:"ProductFeature updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateProductFeature error:", err);
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
 * Delete ProductFeature
 * DELETE /:id
 */
export const deleteProductFeature = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success:false, message:"Invalid ID" });
    }

    const existing = await ProductFeature.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success:false, message:"ProductFeature not found" });
    }

    await ProductFeature.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success:true, message:"ProductFeature deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteProductFeature error:", err);
    return res.status(500).json({ success:false, message:"Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
