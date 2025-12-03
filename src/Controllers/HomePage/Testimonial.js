// Server/src/Controllers/HomeTestimonialController.js
import mongoose from "mongoose";
import { HomeTestimonial } from "../../Models/Homepage/Testimonial.js";



const norm = (v) => (typeof v === "string" ? v.trim() : v);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const hasModel = (name) => mongoose.modelNames().includes(name);

/**
 * Create HomeTestimonial
 * NOTE: founders MUST NOT be provided in the request body. They are added via addFounderToTestimonial
 * Body: { htext1, dtext1 }
 */
export const createHomeTestimonial = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      htext1: norm(req.body.htext1),
      dtext1: norm(req.body.dtext1),
      founders: [], // explicitly start empty
    };

    const missing = [];
    if (!payload.htext1) missing.push("htext1");
    if (!payload.dtext1) missing.push("dtext1");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // explicitly ignore any founders passed in the request
    const doc = new HomeTestimonial(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const q = HomeTestimonial.findById(doc._id);
    // populate only if model exists
    if (hasModel("Founder")) q.populate("founders");
    const result = await q.lean().exec();

    return res.status(201).json({ success: true, message: "HomeTestimonial created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeTestimonial error:", err);
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
 * GET / -> list
 * GET /latest -> latest
 * GET /:id -> single
 */
export const getHomeTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      let q = HomeTestimonial.findById(id);
      if (hasModel("Founder")) q = q.populate("founders");
      const doc = await q.lean().exec();
      if (!doc) return res.status(404).json({ success: false, message: "HomeTestimonial not found" });
      const info = {};
      if (!hasModel("Founder")) info.founder_populate_missing = true;
      return res.status(200).json({ success: true, data: doc, ...(Object.keys(info).length ? { info } : {}) });
    }

    if (req.path && req.path.endsWith("/latest")) {
      let q = HomeTestimonial.findOne({}).sort({ createdAt: -1 });
      if (hasModel("Founder")) q = q.populate("founders");
      const latest = await q.lean().exec();
      if (!latest) return res.status(404).json({ success: false, message: "No HomeTestimonial found" });
      const info = {};
      if (!hasModel("Founder")) info.founder_populate_missing = true;
      return res.status(200).json({ success: true, data: latest, ...(Object.keys(info).length ? { info } : {}) });
    }

    let q = HomeTestimonial.find({}).sort({ createdAt: -1 });
    if (hasModel("Founder")) q = q.populate("founders");
    const items = await q.lean().exec();
    const info = {};
    if (!hasModel("Founder")) info.founder_populate_missing = true;
    return res.status(200).json({ success: true, data: items, ...(Object.keys(info).length ? { info } : {}) });
  } catch (err) {
    console.error("getHomeTestimonial error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeTestimonial (NOT founders)
 * PATCH /:id
 * Body: { htext1?, dtext1? }
 */
export const updateHomeTestimonial = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeTestimonial.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeTestimonial not found" });
    }

    const setPayload = {};
    if (typeof req.body.htext1 !== "undefined") {
      const v = norm(req.body.htext1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"htext1 cannot be empty" }); }
      setPayload.htext1 = v;
    }
    if (typeof req.body.dtext1 !== "undefined") {
      const v = norm(req.body.dtext1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success:false, message:"dtext1 cannot be empty" }); }
      setPayload.dtext1 = v;
    }

    // explicitly ignore any founders provided in update body
    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No updatable fields provided" });
    }

    const updated = await HomeTestimonial.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });
    await session.commitTransaction();

    let q = HomeTestimonial.findById(updated._id);
    if (hasModel("Founder")) q = q.populate("founders");
    const result = await q.lean().exec();

    return res.status(200).json({ success: true, message: "HomeTestimonial updated", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeTestimonial error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete HomeTestimonial
 * DELETE /:id
 */
export const deleteHomeTestimonial = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeTestimonial.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeTestimonial not found" });
    }

    await HomeTestimonial.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeTestimonial deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeTestimonial error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Add Founder to HomeTestimonial
 * PATCH /homeTestimonial/add-founder/:testimonyId/:founderId
 */
// export const addFounderToTestimonial = async (req, res) => {
//   const { testimonyId, founderId } = req.params;

//   if (!isValidObjectId(testimonyId)) return res.status(400).json({ success: false, message: "Invalid testimonyId" });
//   if (!isValidObjectId(founderId)) return res.status(400).json({ success: false, message: "Invalid founderId" });

//   if (!hasModel("Founder")) {
//     return res.status(500).json({ success: false, message: "Founder model not registered. Ensure Models/Aboutus/Founder.js exists and is imported at startup." });
//   }

//   const Founder = mongoose.model("Founder");

//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     const f = await Founder.findById(founderId).session(session);
//     if (!f) {
//       if (session.inTransaction()) await session.abortTransaction();
//       return res.status(404).json({ success: false, message: "Founder not found" });
//     }

//     const updated = await HomeTestimonial.findByIdAndUpdate(
//       testimonyId,
//       { $addToSet: { founders: founderId } },
//       { new: true, session }
//     );

//     if (!updated) {
//       if (session.inTransaction()) await session.abortTransaction();
//       return res.status(404).json({ success: false, message: "HomeTestimonial not found" });
//     }

//     await session.commitTransaction();

//     let q = HomeTestimonial.findById(updated._id);
//     q = q.populate("founders");
//     const result = await q.lean().exec();

//     return res.status(200).json({ success: true, message: "Founder added to HomeTestimonial", data: result });
//   } catch (err) {
//     try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
//     console.error("addFounderToTestimonial error:", err);
//     return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
//   } finally {
//     session.endSession();
//   }
// };

// /**
//  * Remove Founder from HomeTestimonial
//  * PATCH /homeTestimonial/remove-founder/:testimonyId/:founderId
//  */
// export const removeFounderFromTestimonial = async (req, res) => {
//   const { testimonyId, founderId } = req.params;

//   if (!isValidObjectId(testimonyId)) return res.status(400).json({ success: false, message: "Invalid testimonyId" });
//   if (!isValidObjectId(founderId)) return res.status(400).json({ success: false, message: "Invalid founderId" });

//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//     const updated = await HomeTestimonial.findByIdAndUpdate(
//       testimonyId,
//       { $pull: { founders: founderId } },
//       { new: true, session }
//     );

//     if (!updated) {
//       if (session.inTransaction()) await session.abortTransaction();
//       return res.status(404).json({ success: false, message: "HomeTestimonial not found" });
//     }

//     await session.commitTransaction();

//     let q = HomeTestimonial.findById(updated._id);
//     if (hasModel("Founder")) q = q.populate("founders");
//     const result = await q.lean().exec();

//     return res.status(200).json({ success: true, message: "Founder removed from HomeTestimonial", data: result });
//   } catch (err) {
//     try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
//     console.error("removeFounderFromTestimonial error:", err);
//     return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
//   } finally {
//     session.endSession();
//   }
// };
