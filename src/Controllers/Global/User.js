import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { User } from "../../Models/Global/User.js";
import Footer from "../../Models/Global/Footer.js";
import { Enquiry } from "../../Models/Global/Enquiry.js";
import { Contact } from "../../Models/Global/Contact.js";
import { Faq } from "../../Models/Global/FAQ.js";
import Founder from "../../Models/Global/Founder.js";
import NwDesc from "../../Models/Global/NwDesc.js";
import OwDesc from "../../Models/Global/OwDesc.js";
import { Review } from "../../Models/Global/Reviews.js";
import Social from "../../Models/Global/Social.js";
import { HomeAicap } from "../../Models/Homepage/Aicapability.js";
import { HomeBanner } from "../../Models/Homepage/Banner.js";
import { HomeCompare } from "../../Models/Homepage/Compare.js";
import { HomeDashboardSec } from "../../Models/Homepage/DashboardSection.js";
import { HomeFeatureShowcase } from "../../Models/Homepage/FeatureShowcase.js";
import { HomeFocusIntro } from "../../Models/Homepage/FocusIntro.js";
import { HomeIntegration } from "../../Models/Homepage/Integration.js";
import { HomeMagicBox } from "../../Models/Homepage/MagicBox.js";
import { populate } from "dotenv";
import { HomeTestimonial } from "../../Models/Homepage/Testimonial.js";
import { HomeWorkingProcess } from "../../Models/Homepage/WorkingProcess.js";
import { ProductFeature } from "../../Models/Productpage/Feature.js";
import { ProductHeroSec } from "../../Models/Productpage/Herosec.js";
import { ProductSnapshot } from "../../Models/Productpage/Snapshot.js";
import { ResourceExploreSec } from "../../Models/Resourcepage/Explore.js";
import { ResourceHeroSec } from "../../Models/Resourcepage/Herosec.js";
import { ResourceSnapshot } from "../../Models/Resourcepage/Snapshot.js";
import { SolutionGalaryCard } from "../../Models/Solutionpage/Galarycard.js";
import { SolutionHeroSec } from "../../Models/Solutionpage/Herosec.js";
import { SolutionSnapshot } from "../../Models/Solutionpage/Snapshot.js";






// ============================
// Register a new user
// ============================
export const registerUser = async (req, res) => {
  try {
    const {  email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Validate role (since it's enum in schema)


    const user = new User({
      email,
      password,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,

      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Login user
// ============================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    console.log(email,password)
    const token = user.generateAccessToken();

    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("AccessToken", token, {
      httpOnly: true,
      secure: false, // set true in production
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
      },
      token, // Optional: if you want token in response
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Logout user
// ============================
export const logoutUser = (req, res) => {
  try {
    res.clearCookie("AccessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });
    res.json({ message: "User logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================
// Get current authenticated user
// ============================
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};







// ============================
// Update self (user profile)
// ============================
export const updateSelf = async (req, res) => {
  try {
    const allowedFields = ["email", "password"];
    const updates = {};

    allowedFields.forEach((key) => {
      if (req.body[key]) updates[key] = req.body[key];
    });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check new password not same as old
    if (updates.password) {
      const isSame = await user.comparePassword(updates.password);
      if (isSame) {
        return res.status(400).json({
          error: "New password cannot be the same as the old password",
        });
      }
      const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
      updates.password = await bcrypt.hash(updates.password, saltRounds);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// controllers/dashboardController.js


// IMPORT YOUR MODELS — adjust paths as needed


/**
 * Helper to fetch documents:
 *  - model: mongoose model
 *  - userId, role: to decide filtering
 *  - populate: array of paths to populate
 *  - limit: number
 */
const fetchDocs = async (model, { userId = null, role = null, populate = [], limit = 100 } = {}) => {
  // Build base filter: if role is Admin and model has ownerId -> filter by ownerId
  let filter = {};
  if (role === "Admin" && userId) {
    try {
      if (model.schema && model.schema.paths && model.schema.paths.ownerId) {
        filter.ownerId = mongoose.Types.ObjectId(String(userId));
      }
    } catch (e) {
      // ignore, no ownerId
    }
  }

  let q = model.find(filter).lean().sort({ createdAt: -1 }).limit(limit);
  // apply populate if provided
  for (const p of populate) q = q.populate(p);
  const docs = await q.exec();
  return docs;
};

export const dashboardData = async (req, res) => {
  try {
    // prepare all tasks (run in parallel)
    const tasks = {
      Footer: fetchDocs(Footer, {populate:["socials"]}),
      Enquiry: fetchDocs(Enquiry),
      Contact: fetchDocs(Contact),
      FAQ:fetchDocs(Faq),
      Founder:fetchDocs(Founder),
      NwDesc:fetchDocs(NwDesc),
      OwDesc:fetchDocs(OwDesc),
      Review:fetchDocs(Review),
      Social:fetchDocs(Social),
      HomeAicap:fetchDocs(HomeAicap),
      HomeBanner:fetchDocs(HomeBanner),
      HomeCompare:fetchDocs(HomeCompare,{populate:["nwdtext","owdtext"]}),
      HomeDashboardSec:fetchDocs(HomeDashboardSec),
      HomeFeatureShowcase:fetchDocs(HomeFeatureShowcase),
      HomeFocusIntro:fetchDocs(HomeFocusIntro),
      HomeIntegration:fetchDocs(HomeIntegration),
      HomeMagicBox:fetchDocs(HomeMagicBox),
      HomeTestimonial:fetchDocs(HomeTestimonial,{populate:["founders"]}),
      HomeWorkingProcess:fetchDocs(HomeWorkingProcess),
      ProductFeature:fetchDocs(ProductFeature),
      ProductHeroSec:fetchDocs(ProductHeroSec),
      ProductSnapshot:fetchDocs(ProductSnapshot),
      ResourceExploreSec:fetchDocs(ResourceExploreSec),
      ResourceHeroSec:fetchDocs(ResourceHeroSec),
      ResourceSnapshot:fetchDocs(ResourceSnapshot),
      SolutionGalaryCard:fetchDocs(SolutionGalaryCard),
      SolutionHeroSec:fetchDocs(SolutionHeroSec),
      SolutionSnapshot:fetchDocs(SolutionSnapshot)
      
    };

    // Run all queries in parallel and capture results
    const results = await Promise.allSettled(Object.values(tasks));

    const keys = Object.keys(tasks);
    const data = {};

    results.forEach((result, index) => {
      const key = keys[index];
      if (result.status === "fulfilled") {
        data[key] = result.value;
      } else {
        console.error(`Dashboard fetch failed for ${key}:`, result.reason);
        data[key] = []; // default to empty array on error
      }
    });

    return res.status(200).json({ data });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};