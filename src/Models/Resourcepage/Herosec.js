import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const ResourceHeroSecSchema = new SCHEMA(
  {
    
    
    HeroImg:{
    type: String,
      require: true,
    },
 
  
  },{ timestamps: true }
);
export const ResourceHeroSec = mongoose.model("ResourceHeroSec", ResourceHeroSecSchema);