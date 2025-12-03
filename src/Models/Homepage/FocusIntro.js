import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeFocusIntroSchema = new SCHEMA(
  {
    
    htext:{
    type: String,
      require: true,
    },
   para1:{
        type: String,
      require: true,
    },
   para2:{
        type: String,
      require: true,
    },
   para3:{
        type: String,
      require: true,
    },
  
  },{ timestamps: true }
);
export const HomeFocusIntro = mongoose.model("HomeFocusIntro", HomeFocusIntroSchema);