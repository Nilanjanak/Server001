import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeCompareSchema = new SCHEMA(
  {
    
    htext:{
    type: String,
      require: true,
    },
    dtext:{
        type: String,
      require: true,
    },
    owhtext:{
        type: String,
      require: true,
    },
    nwhtext:{
        type: String,
      require: true,
    },
    owdtext:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OwDesc",
    },
    ],
    nwdtext:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NwDesc",
    },
    ]

   
  
  },{ timestamps: true }
);
export const HomeCompare = mongoose.model("HomeCompare", HomeCompareSchema);