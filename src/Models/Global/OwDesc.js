// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const OwDescSchema = new SCHEMA(
  {
  
    text:{
        type: String,
      required: true,
     
   },
    
  },
  { timestamps: true }
);

export const OwDesc = mongoose.model("OwDesc", OwDescSchema);
export default OwDesc;
