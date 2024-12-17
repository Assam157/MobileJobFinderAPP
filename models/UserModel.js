const { default: mongoose } = require("mongoose");

const UserSchema=new mongoose.Schema({
name:{
    type:String,
    required:true
},
password:{
    type:String,
    required:true 
},
avatar:{
    type:String
},
contact:{
    type:String,
    required:true
}})

const UserModel=new mongoose.model("UserModel",UserSchema)
module.exports=UserModel