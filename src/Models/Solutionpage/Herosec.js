import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const SolutionHeroSecSchema = new SCHEMA(
  {
    
    
    HeroImg:{
    type: String,
      require: true,
    },
 
  
  },{ timestamps: true }
);
export const SolutionHeroSec = mongoose.model("SolutionHeroSec", SolutionHeroSecSchema);