
const mongoose=require("mongoose");
const mailsender = require("../utils/mailSender");
const emailTemplate=require("../mail/templates/emailVerificationTemplate")

const otpSchema= new mongoose.Schema({

     email:{
        type:String,
        required:true
     },
     otp:{
        type:String,
        required:true
     },
     createdAt:{
        type:Date,
        default:Date.now(),
        expires:60*20
     }
        
});

async function sendVerificationEmail(email,otp){
    try {
        const mailResponce=await mailsender(email,"Verification Email  from Studynation",
        emailTemplate(otp));
        
    } catch (error) {
        console.log("error while sending email",error);
    }
}

otpSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email,this.otp);
    next();
})

module.exports=mongoose.model("Otp", otpSchema);