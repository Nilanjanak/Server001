import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const ResourceSnapshotSchema = new SCHEMA(
  {
    snapimg1:{
    type: String,
      require: true,
    },
    snaptext1:{
       type: String,
      require: true,  
    },
    snapimg2:{
    type: String,
      require: true,
    },
    snaptext2:{
       type: String,
      require: true,  
    },
    snapimg3:{
    type: String,
      require: true,
    },
    snaptext3:{
       type: String,
      require: true,  
    },
    snapimg4:{
    type: String,
      require: true,
    },
    snaptext4:{
       type: String,
      require: true,  
    }
 
  
  },{ timestamps: true }
);
export const ResourceSnapshot = mongoose.model("ResourceSnapshot", ResourceSnapshotSchema);