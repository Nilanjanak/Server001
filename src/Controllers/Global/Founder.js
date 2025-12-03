// Server/src/Controllers/FounderController.js
import mongoose from "mongoose";
import Founder from "../../Models/Global/Founder.js";
import { HomeTestimonial } from "../../Models/Homepage/Testimonial.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * Create Founder
 * Body: { Dtext, name, designation, testimonyId? }
 * If testimonyId provided, it will validate and $addToSet into HomeTestimonial.founders
 */
export const createFounder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      Dtext: norm(req.body.Dtext),
      name: norm(req.body.name),
      designation: norm(req.body.designation),
    };

    const missing = [];
    if (!payload.Dtext) missing.push("Dtext");
    if (!payload.name) missing.push("name");
    if (!payload.designation) missing.push("designation");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // optional testimonyId
    let testimonyId;
    if (typeof req.body.testimonyId !== "undefined" && req.body.testimonyId !== null && String(req.body.testimonyId).length) {
      testimonyId = norm(req.body.testimonyId);
      if (!isValidObjectId(testimonyId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid testimonyId" });
      }
      const testimonyExists = await HomeTestimonial.findById(testimonyId).session(session).lean();
      if (!testimonyExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced HomeTestimonial not found" });
      }
    }

    const doc = new Founder(payload);
    await doc.save({ session });

    if (testimonyId) {
      await HomeTestimonial.findByIdAndUpdate(
        testimonyId,
        { $addToSet: { founders: doc._id } },
        { session }
      );
    }

    await session.commitTransaction();

    const result = await Founder.findById(doc._id).lean();
    return res.status(201).json({ success: true, message: "Founder created", data: result, attachedToTestimony: testimonyId || null });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createFounder error:", err);
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
 * Get founders: list / single / latest
 */
export const getFounders = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await Founder.findById(id).lean();
      if (!doc) return res.status(404).json({ success: false, message: "Founder not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    if (req.path && req.path.endsWith("/latest")) {
      const latest = await Founder.findOne({}).sort({ createdAt: -1 }).lean();
      if (!latest) return res.status(404).json({ success: false, message: "No Founder found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await Founder.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getFounders error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update Founder
 * PATCH /:id
 * Body: { Dtext?, name?, designation? }
 */
export const updateFounder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await Founder.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Founder not found" });
    }

    const setPayload = {};
    if (typeof req.body.Dtext !== "undefined") {
      const v = norm(req.body.Dtext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"Dtext cannot be empty" }); }
      setPayload.Dtext = v;
    }
    if (typeof req.body.name !== "undefined") {
      const v = norm(req.body.name);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"name cannot be empty" }); }
      setPayload.name = v;
    }
    if (typeof req.body.designation !== "undefined") {
      const v = norm(req.body.designation);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"designation cannot be empty" }); }
      setPayload.designation = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Founder.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session }).lean();

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Founder updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateFounder error:", err);
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
 * Delete Founder
 * DELETE /:id
 * Also removes the founder id from any HomeTestimonial.founders arrays
 */
export const deleteFounder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await Founder.findById(id).session(session).lean();
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Founder not found" });
    }

    await Founder.findByIdAndDelete(id, { session });

    // remove from any HomeTestimonial docs
    await HomeTestimonial.updateMany({ founders: id }, { $pull: { founders: id } }, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Founder deleted and references removed" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteFounder error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
