import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeAicapSchema = new SCHEMA(
  {
    
    tagIcon1:{
    type: String,
      require: true,
    },
    tagIcon2:{
    type: String,
      require: true,
    },
    tagIcon3:{
    type: String,
      require: true,
    },
    tagIcon4:{
    type: String,
      require: true,
    },
    taghtext1:{
    type: String,
      require: true,
    },
    taghtext2:{
    type: String,
      require: true,
    },
    taghtext3:{
    type: String,
      require: true,
    },
    taghtext4:{
    type: String,
      require: true,
    },
    tagImg1:{
    type: String,
      require: true,
    },
    tagImg2:{
    type: String,
      require: true,
    },
    tagImg3:{
    type: String,
      require: true,
    },
    tagImg4:{
    type: String,
      require: true,
    },
 
  
  },{ timestamps: true }
);
export const HomeAicap = mongoose.model("HomeAicap", HomeAicapSchema);