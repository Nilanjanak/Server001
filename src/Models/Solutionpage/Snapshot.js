import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const SolutionSnapshotSchema = new SCHEMA(
  {
    counter1:{
    type: String,
      require: true,
    },
    countertext1:{
    type: String,
      require: true,
    },
     counter2:{
    type: String,
      require: true,
    },
    countertext2:{
    type: String,
      require: true,
    },
     counter3:{
    type: String,
      require: true,
    },
    countertext3:{
    type: String,
      require: true,
    },
    mainhtext:{
    type: String,
      require: true,
    },
    maindtext:{
    type: String,
      require: true,
    },
    snapimg1:{
      type: String,
      require: true,
    },
     snaptext1:{
      type: String,
      require: true,
    },
        snapimg2:{
      type: String,
      require: true,
    },
    snaptext2:{
      type: String,
      require: true,
    },
    snapimg3:{
      type: String,
      require: true,
    },
    snaptext3:{
      type: String,
      require: true,
    },
    snapimg4:{
      type: String,
      require: true,
    },
     snaptext4:{
      type: String,
      require: true,
    }
  },{ timestamps: true }
);
export const SolutionSnapshot = mongoose.model("SolutionSnapshot", SolutionSnapshotSchema);