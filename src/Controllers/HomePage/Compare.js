// Server/src/Controllers/HomeCompareController.js
import mongoose from "mongoose";
import { HomeCompare } from "../../Models/Homepage/Compare.js";


const norm = (v) => (typeof v === "string" ? v.trim() : v);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * Helper: whether a model is registered with mongoose
 */
const hasModel = (name) => mongoose.modelNames().includes(name);

/**
 * Helper: build populate chain only if models exist
 */
const maybePopulate = (query) => {
  const populatePaths = [];
  if (hasModel("OwDesc")) populatePaths.push("owdtext");
  if (hasModel("NwDesc")) populatePaths.push("nwdtext");
  if (populatePaths.length === 0) return query;
  return query.populate(populatePaths.join(" "));
};

/**
 * CREATE HomeCompare
 * NOTE: owdtext and nwdtext are NOT accepted here (they are added via their own endpoints)
 */
export const createHomeCompare = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      htext: norm(req.body.htext),
      dtext: norm(req.body.dtext),
      owhtext: norm(req.body.owhtext),
      nwhtext: norm(req.body.nwhtext),
      owdtext: [],
      nwdtext: [],
    };

    const missing = [];
    if (!payload.htext) missing.push("htext");
    if (!payload.dtext) missing.push("dtext");
    if (!payload.owhtext) missing.push("owhtext");
    if (!payload.nwhtext) missing.push("nwhtext");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    const doc = new HomeCompare(payload);
    await doc.save({ session });

    await session.commitTransaction();

    // If OwDesc/NwDesc models registered -> populate, else return raw
    let resultQuery = HomeCompare.findById(doc._id);
    resultQuery = maybePopulate(resultQuery);
    const result = await resultQuery.lean().exec();

    return res.status(201).json({ success: true, message: "HomeCompare created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeCompare error:", err);
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
 * Get list / single / latest
 */
export const getHomeCompare = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

      let q = HomeCompare.findById(id);
      q = maybePopulate(q);
      const doc = await q.lean().exec();

      if (!doc) return res.status(404).json({ success: false, message: "HomeCompare not found" });

      // If we didn't populate because models missing, include info
      const info = {};
      if (!hasModel("OwDesc")) info.owdtext_populate_missing = true;
      if (!hasModel("NwDesc")) info.nwdtext_populate_missing = true;
      return res.status(200).json({ success: true, data: doc, ...(Object.keys(info).length ? { info } : {}) });
    }

    if (req.path && req.path.endsWith("/latest")) {
      let q = HomeCompare.findOne({}).sort({ createdAt: -1 });
      q = maybePopulate(q);
      const latest = await q.lean().exec();
      if (!latest) return res.status(404).json({ success: false, message: "No HomeCompare found" });

      const info = {};
      if (!hasModel("OwDesc")) info.owdtext_populate_missing = true;
      if (!hasModel("NwDesc")) info.nwdtext_populate_missing = true;
      return res.status(200).json({ success: true, data: latest, ...(Object.keys(info).length ? { info } : {}) });
    }

    let q = HomeCompare.find({}).sort({ createdAt: -1 });
    q = maybePopulate(q);
    const items = await q.lean().exec();

    const info = {};
    if (!hasModel("OwDesc")) info.owdtext_populate_missing = true;
    if (!hasModel("NwDesc")) info.nwdtext_populate_missing = true;
    return res.status(200).json({ success: true, data: items, ...(Object.keys(info).length ? { info } : {}) });
  } catch (err) {
    console.error("getHomeCompare error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update HomeCompare (NOT arrays)
 */
export const updateHomeCompare = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeCompare.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeCompare not found" });
    }

    const setPayload = {};
    const fields = ["htext", "dtext", "owhtext", "nwhtext"];
    for (const f of fields) {
      if (typeof req.body[f] !== "undefined") {
        const v = norm(req.body[f]);
        if (!v) {
          if (session.inTransaction()) await session.abortTransaction();
          return res.status(400).json({ success: false, message: `${f} cannot be empty` });
        }
        setPayload[f] = v;
      }
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeCompare.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });
    await session.commitTransaction();

    // populate conditionally for response
    let q = HomeCompare.findById(updated._id);
    q = maybePopulate(q);
    const result = await q.lean().exec();

    return res.status(200).json({ success: true, message: "HomeCompare updated", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeCompare error:", err);
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
 * Delete HomeCompare
 */
export const deleteHomeCompare = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await HomeCompare.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeCompare not found" });
    }

    await HomeCompare.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeCompare deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeCompare error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Add OwDesc to HomeCompare. PATCH /homecompare/add-owdesc/:compareId/:owId
 * Validates OwDesc exists and uses $addToSet to avoid duplicates.
 */
export const addOwDescToCompare = async (req, res) => {
  const { compareId, owId } = req.params;

  if (!isValidObjectId(compareId)) return res.status(400).json({ success: false, message: "Invalid compareId" });
  if (!isValidObjectId(owId)) return res.status(400).json({ success: false, message: "Invalid owId" });

  // Ensure OwDesc model exists
  if (!hasModel("OwDesc")) {
    return res.status(500).json({ success: false, message: 'OwDesc model not registered. Ensure Models/Global/OwDesc.js exists and is imported at startup.' });
  }

  // Get the OwDesc model
  const OwDesc = mongoose.model("OwDesc");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const ow = await OwDesc.findById(owId).session(session);
    if (!ow) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "OwDesc not found" });
    }

    const compare = await HomeCompare.findByIdAndUpdate(
      compareId,
      { $addToSet: { owdtext: owId } },
      { new: true, session }
    );
    await session.commitTransaction();

    // populate conditionally
    let q = HomeCompare.findById(compare._id);
    q = maybePopulate(q);
    const result = await q.lean().exec();

    return res.status(200).json({ success: true, message: "OwDesc added to HomeCompare", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("addOwDescToCompare error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Remove OwDesc from HomeCompare. PATCH /homecompare/remove-owdesc/:compareId/:owId
 */
export const removeOwDescFromCompare = async (req, res) => {
  const { compareId, owId } = req.params;

  if (!isValidObjectId(compareId)) return res.status(400).json({ success: false, message: "Invalid compareId" });
  if (!isValidObjectId(owId)) return res.status(400).json({ success: false, message: "Invalid owId" });

  if (!hasModel("OwDesc")) {
    return res.status(500).json({ success: false, message: 'OwDesc model not registered. Ensure Models/Global/OwDesc.js exists and is imported at startup.' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const compare = await HomeCompare.findByIdAndUpdate(
      compareId,
      { $pull: { owdtext: owId } },
      { new: true, session }
    );

    await session.commitTransaction();

    let q = HomeCompare.findById(compare._id);
    q = maybePopulate(q);
    const result = await q.lean().exec();

    return res.status(200).json({ success: true, message: "OwDesc removed from HomeCompare", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("removeOwDescFromCompare error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Add NwDesc to HomeCompare. PATCH /homecompare/add-nwdesc/:compareId/:nwId
 */
export const addNwDescToCompare = async (req, res) => {
  const { compareId, nwId } = req.params;

  if (!isValidObjectId(compareId)) return res.status(400).json({ success: false, message: "Invalid compareId" });
  if (!isValidObjectId(nwId)) return res.status(400).json({ success: false, message: "Invalid nwId" });

  if (!hasModel("NwDesc")) {
    return res.status(500).json({ success: false, message: 'NwDesc model not registered. Ensure Models/Global/NwDesc.js exists and is imported at startup.' });
  }

  const NwDesc = mongoose.model("NwDesc");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const nw = await NwDesc.findById(nwId).session(session);
    if (!nw) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "NwDesc not found" });
    }

    const compare = await HomeCompare.findByIdAndUpdate(
      compareId,
      { $addToSet: { nwdtext: nwId } },
      { new: true, session }
    );
    await session.commitTransaction();

    let q = HomeCompare.findById(compare._id);
    q = maybePopulate(q);
    const result = await q.lean().exec();

    return res.status(200).json({ success: true, message: "NwDesc added to HomeCompare", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("addNwDescToCompare error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * Remove NwDesc from HomeCompare. PATCH /homecompare/remove-nwdesc/:compareId/:nwId
 */
export const removeNwDescFromCompare = async (req, res) => {
  const { compareId, nwId } = req.params;

  if (!isValidObjectId(compareId)) return res.status(400).json({ success: false, message: "Invalid compareId" });
  if (!isValidObjectId(nwId)) return res.status(400).json({ success: false, message: "Invalid nwId" });

  if (!hasModel("NwDesc")) {
    return res.status(500).json({ success: false, message: 'NwDesc model not registered. Ensure Models/Global/NwDesc.js exists and is imported at startup.' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const compare = await HomeCompare.findByIdAndUpdate(
      compareId,
      { $pull: { nwdtext: nwId } },
      { new: true, session }
    );

    await session.commitTransaction();

    let q = HomeCompare.findById(compare._id);
    q = maybePopulate(q);
    const result = await q.lean().exec();

    return res.status(200).json({ success: true, message: "NwDesc removed from HomeCompare", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("removeNwDescFromCompare error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
