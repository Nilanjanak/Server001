import { upload } from "../Middleware/Upload.js"; // your multer instance

export const acceptOnlyExpectedFiles = (expected = []) => (req, res, next) => {
  // multer.any() already ran and attached req.files
  if (!req.files || !req.files.length) return next();

  const unexpected = req.files.filter(f => !expected.includes(f.fieldname));
  if (unexpected.length) {
    // cleanup uploaded unexpected files
    for (const f of req.files) {
      try { fs.unlinkSync(f.path); } catch (e) {}
    }
    return res.status(400).json({
      success: false,
      message: `Unexpected file fields: ${unexpected.map(u => u.fieldname).join(", ")}. Allowed: ${expected.join(", ")}`,
    });
  }
  return next();
};