var crypto = require("crypto");
const User = require("../models/userSchema");
const mailSender = require("../utils/mailSender");
const bcrypt=require("bcrypt")

// reset password token
exports.resetPasswordToken =async(req, res) => {
  try {
    //get the email from the request body
    const { email } = req.body;

    // validate the email
    let user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User are not present",
      });
    }

    //generate token

    const token = crypto.randomBytes(20).toString("hex");

    // insert token and expirey time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPassExpires: Date.now() + 5 * 60 * 1000,
      },
      {
        new: true,
      } 
    );

    //link share with mail
     let url=`https://codegurukul0.netlify.app/update-password/${token}`

    await mailSender(email,"Password Reset Link" ,`link : ${url}`)

    return res.status(200).json({
      success:true,
      message:`Password Reset link send to your given mail address `
    })
  } catch (error) {
       console.log(error);
     return res.status(500).json({
        success:false,
        message:"eroor in token generate "
     })
  }
};

//reset password
exports.resestPassword=async(req,res)=>{

    try {
        // data fetch
        const {token ,password,confirmpassword}=req.body;

        //validation
        if(password !==confirmpassword)
           {
            return res.status(500).json({
                success:false,
                message:"Password not matched"
            })
           }
        //get the user details from DB using user token generate the password reset link...
         const user=await User.findOne({token:token});
         // user agar present na hoo
         if(!user)
         {
            return res.status(400).json({
                success:false,
                message:"Token in valid"
            })
         }

        //token time validation
         // if(user.resetPassExpires >Date.now())   
         // {
         //    return res.json({
         //        success:false,
         //        message:"Please regenerate your token"
         //    })
         // }

        //hash password and update the user password
       const hashPass=await bcrypt.hash(password,10);

       const updatePass=await User.findOneAndUpdate( {token:token},
                                                     {password:hashPass},
                                                     {new:true}
                                                   );
         return res.status(200).json({
            success:true,
            message:"password reset successfully",
            data:updatePass
         })                                          

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong in reseting the password"
        })
    }
}
