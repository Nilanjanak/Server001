import express from "express";
import {createEnquiry, getAllEnquiries } from "../../Controllers/Global/Enquiry.js";

const EnquiryRouter = express.Router();

// PUBLIC
EnquiryRouter.route("/")
.post( createEnquiry)
.get(getAllEnquiries); 

export default EnquiryRouter;