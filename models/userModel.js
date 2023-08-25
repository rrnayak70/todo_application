const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

const userModel = new mongoose.Schema({
    passwordResetToken: {
        type: Number,
        default: 0,
    },
    username:{

        type: String,
        trim:true,
        required:[true,"username filed must not empty"],
        unique: true,
        minlength:[4,"username filed must have atleast 4 characters"]

    }
    ,
    email:{
        type: String,
    required: [true,"email address is required"],
    unique: true,
    trim:true,
    // Regexp to validate emails with more strict rules as added in tests/users.js which also conforms mostly with RFC2822 guide lines
    match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email address",
    ],
  },
    password:String,
    avatar:{
        type:String,
        default:"default.jpg"

    },
    todos: [{ type: mongoose.Schema.Types.ObjectId, ref: "todo" }],

});

userModel.plugin(plm);
const user = mongoose.model("user",userModel);

module.exports=user;