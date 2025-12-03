// server.js
import os from "os";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import DB_Connection from "./src/DB/DB.js";
import UserRouter from "./src/Router/Global/User.js";
import EnquiryRouter from "./src/Router/Global/Enquiry.js";
import ContactRouter from "./src/Router/Global/Contact.js";
import SocialRouter from "./src/Router/Global/Social.js";
import FooterRouter from "./src/Router/Global/Footer.js";
import BannerRouter from "./src/Router/HomePage/Banner.js";
import AicapRouter from "./src/Router/HomePage/Aicapability.js";
import CompareRouter from "./src/Router/HomePage/Compare.js";
import OwdtextRouter from "./src/Router/Global/Owdtext.js";
import HwdtextRouter from "./src/Router/Global/Hwdtext.js";
import DashSecRouter from "./src/Router/HomePage/Dashboardsec.js";
import FeatureShowcaseRouter from "./src/Router/HomePage/FeatureShowcase.js";
import FocusIntoRouter from "./src/Router/HomePage/Focusinto.js";
import IntegrationRouter from "./src/Router/HomePage/Integration.js";
import MagicBoxRouter from "./src/Router/HomePage/MagicBox.js";
import TestimonialRouter from "./src/Router/HomePage/testimonial.js";
import FounderRouter from "./src/Router/Global/Founder.js";
import WorkprocessRouter from "./src/Router/HomePage/Workingprocess.js";
import ReviewRouter from "./src/Router/Global/Reviews.js";
import FAQRouter from "./src/Router/Global/FAQ.js";
import ProductFeatureRouter from "./src/Router/ProductPage/Feature.js";
import ProductHerosecRouter from "./src/Router/ProductPage/Herosec.js";
import ProductSnapshotRouter from "./src/Router/ProductPage/Snapshot.js";
import ResourceExplorerRouter from "./src/Router/ResourcePage/Explorer.js";
import ResourceHerosecRouter from "./src/Router/ResourcePage/Herosec.js";
import ResourceSnapRouter from "./src/Router/ResourcePage/Snapshot.js";
import GalaxyCardRouter from "./src/Router/SolutionPage/Galaxycard.js";
import SolutionHeroSecRouter from "./src/Router/SolutionPage/Herosec.js";
import SolutionSnapshotRouter from "./src/Router/SolutionPage/Snapshot.js";
import NwdtextRouter from "./src/Router/Global/Hwdtext.js";


// If you have a separate Home M&V router, import it here:
// import HomeMAndVRouter from "./src/Route/Home/MAndV.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

function getLocalIP() {
  try {
    const networkInterfaces = os.networkInterfaces();
    for (const name in networkInterfaces) {
      const addrs = networkInterfaces[name];
      if (!Array.isArray(addrs)) continue;
      for (const iface of addrs) {
        if ((iface.family === "IPv4" || iface.family === 4) && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.warn("getLocalIP failed:", err);
  }
  return "127.0.0.1";
}

const localIP = getLocalIP();

// CORS - dev-friendly list; add production FRONTEND_URL to env and it'll be included
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:8086",
  `http://${localIP}:5173`,
  `http://${localIP}:5174`,
  `http://${localIP}:8080`,
  `http://${localIP}:8086`,
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser requests (Postman, curl) that have no origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("❌ CORS: Not allowed by server"));
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Use built-in body parsers instead of body-parser package
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Mount routers
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/enquiry", EnquiryRouter);
app.use("/api/v1/contact", ContactRouter);
app.use("/api/v1/footer", FooterRouter);
app.use("/api/v1/footer/social", SocialRouter);
app.use("/api/v1/owdtext", OwdtextRouter);
app.use("/api/v1/nwdtext", NwdtextRouter);
app.use("/api/v1/founder", FounderRouter);
app.use("/api/v1/review", ReviewRouter);
app.use("/api/v1/faq", FAQRouter);




// Home page end points
app.use("/api/v1/home/banner", BannerRouter);
app.use("/api/v1/home/aicap", AicapRouter);
app.use("/api/v1/home/compare",CompareRouter);
app.use("/api/v1/home/dashsec",DashSecRouter);
app.use("/api/v1/home/featureshow",FeatureShowcaseRouter);
app.use("/api/v1/home/focusinto",FocusIntoRouter);
app.use("/api/v1/home/integration",IntegrationRouter);
app.use("/api/v1/home/magicbox",MagicBoxRouter);
app.use("/api/v1/home/testimonial",TestimonialRouter);
app.use("/api/v1/home/workprocess",WorkprocessRouter);

// Product page end points
app.use("/api/v1/product/feature",ProductFeatureRouter);
app.use("/api/v1/product/herosec",ProductHerosecRouter);
app.use("/api/v1/product/snapshot",ProductSnapshotRouter);

// Resourse page end points
app.use("/api/v1/resource/explorer",ResourceExplorerRouter);
app.use("/api/v1/resource/herosec",ResourceHerosecRouter);
app.use("/api/v1/resource/snapshot",ResourceSnapRouter);


// Solution page end points
app.use("/api/v1/solution/galaxy",GalaxyCardRouter);
app.use("/api/v1/solution/herosec",SolutionHeroSecRouter);
app.use("/api/v1/solution/snapshot",SolutionSnapshotRouter);












// app.use("/api/v1/footer", FooterRouter);


// If there is a separate home mandv router, mount it instead of re-using MAndVRouter:
// app.use("/api/v1/home/mandv", HomeMAndVRouter);

DB_Connection(process.env.DB_URI, process.env.DB_NAME)
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(` ✅  Local:   http://localhost:${PORT}`);
      console.log(` ✅ Server is running at http://${localIP}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});