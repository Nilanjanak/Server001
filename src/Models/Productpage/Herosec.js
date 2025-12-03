import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const ProductHeroSecSchema = new SCHEMA(
  {
    
    
    HeroImg:{
    type: String,
      require: true,
    },
 
  
  },{ timestamps: true }
);
export const ProductHeroSec = mongoose.model("ProductHeroSec", ProductHeroSecSchema);