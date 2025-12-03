import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const SolutionGalaryCardSchema = new SCHEMA(
  {
    bgVd:{
    type: String,
      require: true,
    },
  htext:{
    type: String,
      require: true,
    },
    dtext:{
    type: String,
      require: true,
    },
    tag:{
      type: String,
      require: true,
    }
  },{ timestamps: true }
);
export const SolutionGalaryCard = mongoose.model("SolutionGalaryCard", SolutionGalaryCardSchema);