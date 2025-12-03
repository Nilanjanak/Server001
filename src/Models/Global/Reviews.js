import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const ReviewSchema = new SCHEMA(
  {
    comment:{
        type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    designation:{
    type: String,
      require: true,
    },
    
  
  },{ timestamps: true }
);
export const Review = mongoose.model("Review", ReviewSchema);