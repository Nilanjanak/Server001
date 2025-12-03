import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const ResourceExploreSecSchema = new SCHEMA(
  {
    cardImg1:{
    type: String,
      require: true,
    },
    cardhtext1:{
    type: String,
      require: true,
    },
    carddtext1:{
        type: String,
      require: true,
    },
    cardImg2:{
    type: String,
      require: true,
    },
    cardhtext2:{
    type: String,
      require: true,
    },
    carddtext2:{
        type: String,
      require: true,
    },
    cardImg3:{
    type: String,
      require: true,
    },
    cardhtext3:{
    type: String,
      require: true,
    },
    carddtext3:{
        type: String,
      require: true,
    }
 
  
  },{ timestamps: true }
);
export const ResourceExploreSec = mongoose.model("ResourceExploreSec",ResourceExploreSecSchema);