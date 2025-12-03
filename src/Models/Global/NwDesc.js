// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const NwDescSchema = new SCHEMA(
  {
  
    text:{
        type: String,
      required: true,
     
   },
    
  },
  { timestamps: true }
);

export const NwDesc = mongoose.model("NwDesc", NwDescSchema);
export default NwDesc;
