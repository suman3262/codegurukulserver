const express=require("express");
const router=express.Router();

//import the require controler and middleware

// logIN,signUP ,otpSend/changepassword
const {
    logIn, signUp,sendOTP,chnagePassword, changePassword
}=require("../controller/Auth");

// reset password && generate token
const{resetPasswordToken,resestPassword}=require("../controller/ResetPassword");

//Protected routes and Authorization

const{auth}=require("../middleware/authentication");

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************
//Routes for log in
router.post("/login",logIn);

//Routes for user sign up
 router.post("/signup",signUp);

 //router for send otp user mail
 router.post("/sendotp",sendOTP);

 //Route for changing password 
 //before change pass check first authentic user or not using JWT TOKEN 
 router.post("/changepassword",auth,changePassword);

 // ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************
// Route for generating a reset password token
router.post("/reset/password/token",resetPasswordToken);

//Route for reseting password
router.post("/reset/password",resestPassword);

//export the routes
module.exports=router;