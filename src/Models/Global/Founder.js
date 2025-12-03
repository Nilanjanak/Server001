// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const FounderSchema = new SCHEMA(
  {
  
    Dtext:{
        type: String,
      required: true,
     
   },
    name:{
        type: String,
      required: true,
     
   },
    designation:{
        type: String,
      required: true,
     
   },
    
  },
  { timestamps: true }
);

export const Founder = mongoose.model("Founder", FounderSchema);
export default Founder;
