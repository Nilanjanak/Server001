import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeDashboardSecSchema = new SCHEMA(
  {
    
    htext1:{
    type: String,
      require: true,
    },
    dtext1:{
    type: String,
      require: true,
    },
    vd:{
    type: String,
      require: true,
    },
    
  
  },{ timestamps: true }
);
export const HomeDashboardSec = mongoose.model("HomeDashboardSec", HomeDashboardSecSchema);