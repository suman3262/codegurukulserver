
const mongoose=require("mongoose");

const userSchema= new mongoose.Schema({

    firstName:{
        type:String,
        required:true,
        trim:true
    },
    lastName:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true
    },
    password:{
        type:String,
        required:true
    },
    // Define the role field with type String and enum values of "Admin", "Student", or "Visitor"
    accountType:{
        type:String,
        required:true,
        enum:["Admin","Student","Instructor"]
    },
    active: {
        type: Boolean,
        default: true,
    },
    approved: {
        type: Boolean,
        default: true,
    },
    additonalDetails:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Profile"
    },

    //token for reset password
    token:{
        type:String
    },

    resetPassExpires:{
        type:Date
    },

    // array for a user enroll more then on course
    courses:[
        {
          type:mongoose.Schema.Types.ObjectId,
          ref:"Course"  
        }
    ],
    image:{
        type:String,
        required:true
    },
    courseProgress:[
     {
        type:mongoose.Schema.Types.ObjectId,
        ref:"CourseProgress"
     }
    ]
});

module.exports=mongoose.model("User", userSchema);