const User=require("../models/userSchema");
require("dotenv").config();
const jwt=require("jsonwebtoken");

 
//auth
 exports.auth=async(req,res,next)=>{
 try {
    
    const token = req.cookies.token 
    || req.body.token 
    || req.header("Authorisation").replace("Bearer ", "");



    if(!token)
    {
        return res.status(400).json({
            success:false,
            message:"token not found",
            
        })
    }
    try {
        // jwt.verify() return payload
        const decode= jwt.verify(token, process.env.JWT_SECRET);

        // insert the payload in requset 
         req.user=decode;
    } catch (error) {
        return res.status(403).json({
            success:false,
            message:"token is invalid"
        })
    }
    next();
 } catch (error) {
    return res.status(405).json({
        success:false,
        message:"token verification failed",
        data:error.message
    })
 }
  
 }

// student

exports.isStudent=(req,res,next)=>{
 
    try {
        if(req.user.role !=="Student")
        {
            return res.status(500).json({
                success:false,
                message:"You are not a astudent bro"
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"error in student route",
            data: console.log(error)
        })
    }
}

//instructor
exports.isInstructor=(req,res,next)=>{
    try {
        if(req.user.role !=="Instructor")
        {
            return res.status(500).json({
                success:false,
                message:"You are not a instructor bro"
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"error in instructor route",
            data: console.log(error)
        })
    }
}

//admin
exports.isAdmin=(req,res,next)=>{
    try {
        if(req.user.role !=="Admin")
        {
            return res.status(500).json({
                success:false,
                message:"You are not a admin bro"
            })
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"error in admin route",
            data: console.log(error)
        })
    }
}