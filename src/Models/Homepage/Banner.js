import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeBannerSchema = new SCHEMA(
  {
    vd1: {
      type: String,
      required: true,
    },
    vd2: {
      type: String,
      required: true,
    },
    vd3: {
      type: String,
      required: true,
    },
    htext:{
    type: String,
      require: true,
    },
    dtext:{
        type: String,
      require: true,
    },
   
  
  },{ timestamps: true }
);
export const HomeBanner = mongoose.model("HomeBanner", HomeBannerSchema);