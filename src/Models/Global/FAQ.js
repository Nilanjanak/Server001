import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const FaqSchema = new SCHEMA(
  {
    question:{
        type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },

    
  
  },{ timestamps: true }
);
export const Faq = mongoose.model("Faq", FaqSchema);