
const express=require("express");
const router=express.Router();

//get midlleware

const {auth,isStudent, isInstructor}=require("../middleware/authentication");

const {
    updateProfile,
    deleteAccount,
    getAllUserDetails,
    updateProfilePic,
    getEnrolledCourse,
    instructorDashbord
}=require("../controller/Profile");

//delete user account
router.delete("/delete/profile",auth,deleteAccount);

//update account
router.put("/update/profile",auth,updateProfile);

//get all details of user
router.get("/getuserdetails",auth,getAllUserDetails);

//get upadte profile pic
router.put("/update/profilepicture",auth,updateProfilePic);

//get enrolled course by user
router.get("/get-enrolledcourse",auth,isStudent,getEnrolledCourse);

//get instructor dashboard data
router.get('/get/instructor/dashboard/data',auth,isInstructor,instructorDashbord)

//exports all route
module.exports=router;