const mongoose=require("mongoose")

const HRSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    password:{
        type:String,
        requried:true,
    },
    contact:{
        type:String,
        required:true,
    },
    aadharCard:{
        data:Buffer,
        contentType:String,
    },
    PANCard:{
        data:Buffer,
        contentType:String,
    }
})
module.exports=new mongoose.model("HRModel",HRSchema)