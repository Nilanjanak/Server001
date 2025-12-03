// Server/src/Controllers/FooterController.js
import Footer from "../../Models/Global/Footer.js";


/**
 * @desc Create a new Footer entry
 * NOTE: socials will NOT be accepted from the request body here.
 * Socials must be pushed from the Social controller via addSocialToFooter.
 */
export const createFooter = async (req, res) => {
  try {
    // Explicitly DON'T read socials from req.body
    const { address, phno, email, copyright } = req.body;

    // Basic validation (adjust as required)
    if (!address || !phno || !email || !copyright) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: address, phno, email, copyright",
      });
    }

    // If you want only one footer doc in DB, you can check for existing one
    // and either return it or update it. Here we create a new footer always.
    // If you want single-footer behavior, uncomment the block below.
    /*
    const existing = await Footer.findOne();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Footer already exists. Use update endpoint to modify it.",
        data: existing,
      });
    }
    */

    const footer = await Footer.create({
      // Ensure socials starts empty; it will be populated by addSocialToFooter
      socials: [],
      address,
      phno,
      email,
      copyright,
    });

    return res.status(201).json({
      success: true,
      message: "Footer created successfully",
      data: footer,
    });
  } catch (error) {
    console.error("Create Footer Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get Footer (single – since usually there is only one footer)
 */
export const getFooter = async (req, res) => {
  try {
    const footer = await Footer.findOne().populate("socials");

    return res.status(200).json({
      success: true,
      data: footer,
    });
  } catch (error) {
    console.error("Get Footer Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update Footer Data (without modifying socials)
 */
export const updateFooter = async (req, res) => {
  try {
    const { address, phno, email, copyright } = req.body;

    const updated = await Footer.findOneAndUpdate(
      {},
      { address, phno, email, copyright },
      { new: true, runValidators: true }
    ).populate("socials");

    return res.status(200).json({
      success: true,
      message: "Footer updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Footer Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Push Social IDs from Social Controller side
 * @route PATCH /footer/add-social/:footerId/:socialId
 *
 * This endpoint validates the social exists and uses $addToSet to avoid duplicates.
 */
