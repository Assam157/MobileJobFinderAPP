const mongoose=require("mongoose")
const JobSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    immediateHiring:
    {
        type:Boolean,
        required:true
    },
    vacancy:{
        type:Number,
        required:true
    }

})

module.exports=new mongoose.model("JobModel",JobSchema)