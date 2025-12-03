import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const ProductFeatureSchema = new SCHEMA(
  {
     
    htext:{
    type: String,
      require: true,
    },
    cardvd1:{
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
    cardvd2:{
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
    cardvd3:{
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
export const ProductFeature = mongoose.model("ProductFeature", ProductFeatureSchema);