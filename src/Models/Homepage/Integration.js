import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeIntegrationSchema = new SCHEMA(
  {
    
    mainhtext:{
    type: String,
      require: true,
    },
    maindtext:{
    type: String,
      require: true,
    },
    centerIcon:{
    type: String,
      require: true,
    },
    outerIcon1:{
    type: String,
      require: true,
    },
    outerIcon2:{
    type: String,
      require: true,
    },
    outerIcon3:{
    type: String,
      require: true,
    },
    outerIcon4:{
    type: String,
      require: true,
    },
    outerIcon5:{
    type: String,
      require: true,
    },
    outerIcon6:{
    type: String,
      require: true,
    }
 
  
  },{ timestamps: true }
);
export const HomeIntegration = mongoose.model("HomeIntegration", HomeIntegrationSchema);