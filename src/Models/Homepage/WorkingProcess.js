import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeWorkingProcessSchema = new SCHEMA(
  {
    
    htext:{
    type: String,
      require: true,
    },
    dtext:{
        type: String,
      require: true,
    },
    chtext1:{
        type: String,
      require: true,
    },
    cdtext1:{
        type: String,
      require: true,
    },
     chtext2:{
        type: String,
      require: true,
    },
    cdtext2:{
        type: String,
      require: true,
    },
     chtext3:{
        type: String,
      require: true,
    },
    cdtext3:{
        type: String,
      require: true,
    },
     chtext4:{
        type: String,
      require: true,
    },
    cdtext4:{
        type: String,
      require: true,
    },

   
  
  },{ timestamps: true }
);
export const HomeWorkingProcess = mongoose.model("HomeWorkingProcess", HomeWorkingProcessSchema);