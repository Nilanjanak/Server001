import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeTestimonialSchema = new SCHEMA(
  {
    
    htext1:{
    type: String,
      require: true,
    },
    dtext1:{
    type: String,
      require: true,
    },
    founders:[{
     type: mongoose.Schema.Types.ObjectId,
     ref: "Founder",
    }],
    
  
  },{ timestamps: true }
);
export const HomeTestimonial = mongoose.model("HomeTestimonial", HomeTestimonialSchema);