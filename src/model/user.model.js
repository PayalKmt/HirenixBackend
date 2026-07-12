import mongoose from "mongoose";
import { ENV } from "../utils/env.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    select: false,
    default: null
  },
  fullname: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ["local", "google", "linkedin"],
    default: "local"
  },
  googleId: {
    type: String,
    default: null
  },
  profilePics: {
    type: String,
    default: null
  },
  enable30Day: {
    type: Boolean,
    required: true,
    default: false,
    enum: [true, false]
  }
}, { timestamps: true }
);


userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

userSchema.set("toObject", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, ENV.JWT_SECRET, { expiresIn: "7d" })
  return token;
}

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
}

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}
const user = mongoose.model('user', userSchema);
export default user;