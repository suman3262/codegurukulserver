const bcrypt=require("bcrypt");
const User=require("../models/userSchema");
const OTP=require("../models/otp");
const otpGenerator=require("otp-generator")
const Profile=require("../models/profileSchema");
const jwt=require("jsonwebtoken");
const mailsender = require("../utils/mailSender");
require("dotenv").config();
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

//send otp
exports.sendOTP=async(req,res)=>{

    try {
        const {email}=req.body;

        // check user exsist or not
        const userExsist=await User.findOne({email});

        if(userExsist){
            return res.status(400).json({
                success:false,
                message:"User already present "
            })
        }
      // generate otp
      var otp=otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false
      });

      console.log("otp->", otp);

      //check the unique otp or not
      let result= await OTP.findOne({otp:otp});

      while(result)
      {
        otpGenerator.generate(6,{
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
          });
          result= await OTP.findOne({otp:otp});
      }
      const otpPayload={email ,otp};
      const otpBody=await OTP.create(otpPayload);
      console.log("otp body-->:",otpBody);

      res.status(200).json({
        success:true,
        message:"Otp sent sucessfully",
        otp,
      })

    } catch (error) {
        
        res.status(500).json({
            success:false,
            message:error.message,

        })
    }
}

// sign up
exports.signUp=async(req,res)=>{

    try {
        const{
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        }=req.body;

        //check password match or not
        // verify otp , cause user only done sign up when email verififcation done before create a new entry in DB
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp)
        {
            return res.status(403).json({
                success:false,
                message:"all field are require"
            })
        }
        // check password
        if(password !==confirmPassword){
            return res.status(401).json({
                success:false,
                message:"password did not match"
            })
        }
        // check user already present
        if(await User.findOne({email}))
        {
            return res.status(400).json({
                success:false,
                message:"user already exsist"
            })
        }

        //find most recent otp
        const recentOTP=await OTP.findOne({email:email}).sort({createdAt:-1}).limit(1);
       
        console.log(recentOTP);
        //VALIDATE OTP
       if(recentOTP.length ===0)
       {
        return res.status(400).json({
            success:false,
            message:"OTP not found"
        })
       }
       
       else if(otp !==recentOTP.otp){
        return res.status(401).json({
            success:false,
            message:"Invalid otp",
            data:otp,
            op:recentOTP
        });
       }
      
       //hash password
       const hashPassword =await bcrypt.hash(password,10); 

       //enty create user in db

       //create crossponding Profile collection which use in additionals details
       const profile= await Profile.create({
        gender:null,
        dateOfBirth:null,
        about:null,
        contactNumber:null
       });

       const user=await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        password:hashPassword,
        accountType,
        additonalDetails:profile._id,
        image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
       })
       
       return res.status(200).json({
        success:true,
        message:"User created successfully",
        data:user,
       })
    } catch (error) {
        return res.status(401).json({
            success:false,
            message:"Error in creating user",
            data:error.message,
        })
    }
}

// log in
exports.logIn=async(req,res)=>{

    try {
        // fetch the data from req body
        const{email,password}=req.body;

        //valid data or not
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"All filed are require"
            })
        }
        // check user exist or not
        let user=await User.findOne({ email }).populate("additonalDetails");
        if(!user){
            return res.status(500).json({
                success:false,
                message:"User not exsist"
            })
        }

        //compare password
        if(await bcrypt.compare(password,user.password)){
         
            // create JWT tokens
            const payload={
                email:user.email,
                id:user._id,
                role: user.accountType
            }
           
            //payload , secretkey ,options
            const token=jwt.sign(payload,process.env.JWT_SECRET,{
                expiresIn: "1w"
            });
            user.token=token;
            user.password=undefined;
          
            //create cookie
            const options={
                maxAge: 10 * 24 * 60 * 60 * 1000, // Expires after 3 days
                httpOnly: true
            }
          return   res.cookie("token",  token, options).status(200).json({
                success:true,
                token,
                user,
                message:`Logedin successfully and token id ${token}`

            })

        }
        else{
            return res.status(401).json({
                success:false,
                message:"Password incorect"
            })
        }
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login fail eroor in network call",
            data:error.message
        })
    }
};

//change password
exports.changePassword=async(req,res)=>{

    try {
        //fetch the data from req body
        const userID=req.user.id;

        const userDetails=await User.findById(userID);
        const{ newpassword , oldpassword }=req.body;
        console.log(newpassword,oldpassword);

        //get the new,old,confirm password
          if(!newpassword || !oldpassword )
          {
            return res.json({
                success:false,
                message:"all field are required"
            })
          }

          // check both password match or not
        //   if (newpassword !== confirmpassword) {
		// 	// If new password and confirm new password do not match, return a 400 (Bad Request) error
		// 	return res.status(400).json({
		// 		success: false,
		// 		message: "The password and confirm password does not match",
		// 	});
		// }
        //validation

    const isPasswordMatch = await bcrypt.compare(
        oldpassword,
        userDetails.password
    );

    //if user send OLD PASSWORD Incorrect
       if(!isPasswordMatch)
       {
        return res.status(500).json({
            success:false,
            message:"Password incorrect",
        
        });
       }
       // hash the password
       let hashPass=await bcrypt.hash(newpassword,10);

        //  update password in DB
        let updateDetails=await User.findOneAndUpdate(    {_id:userID},
                                                                  {password:hashPass},
                                                                  {new:true}
                                                           );
         console.log(userDetails);
        //send email -using send mailer function`
        await mailsender(
            updateDetails.email,
            passwordUpdated(
                updateDetails.email,
                `Password updated successfully for ${updateDetails.firstName} ${updateDetails.lastName}`
                            )
            );

        //return responce

        return res.status(200).json({
            success:true,
            message:"password change successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error in password cahnge",
            error:error.message
        })
    }
};