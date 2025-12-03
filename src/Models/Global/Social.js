// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const SocialSchema = new SCHEMA(
  {
   icon:{
         type: String,
      required: true,
     
   },
    link:{
        type: String,
      required: true,
     
   },
    
  },
  { timestamps: true }
);

export const Social = mongoose.model("Social", SocialSchema);
export default Social;
