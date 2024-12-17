const mongoose=require("mongoose")
const InternshipSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    immidiateHiring:
    {
        type:Boolean,
        required:true
    },
    vacancy:{
        type:Number,
        required:true
    }

})

module.exports=new mongoose.model("InternshipModel",InternshipSchema)