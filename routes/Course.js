
const express=require("express");
const router=express.Router();

// import course controler
const {
    createCourse,
    getAllCourses,
    getALldetailsOfCourse,
    editCourse,
    deleteCourse,
    getInstructorAllCourses,
    getFullDetailsCourse
}=require("../controller/Courses");

// import Category controlers
const {
    createCatagory,
    getAllcategory,
    categoryPageDetails
}=require("../controller/Category");

//section controler import
const {
    createScetion,
    updateSection,
    deleteSection
}= require("../controller/Section");

//sub-section controler
const{
    createSubSuction,
    updateSubSection,
    deleteSubSection
}=require("../controller/SubSection");

//rating and review
const{
    createReview,
    getAvgReview,
    getAllRating
}=require("../controller/Rating&Review");

const{
    updateCourseProgress
}=require("../controller/courseProgres");

//import MiddleWares
const {auth,isStudent,isInstructor,isAdmin}=require("../middleware/authentication");
//const { createCategory, showAllCategories } = require("c:/users/hp/downloads/server 6/server/controllers/category");

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

//create course that only create only instructor
 router.post("/create-course",auth,isInstructor,createCourse);

 //edit course for instructor
 router.post("/edit/course",auth,isInstructor,editCourse);

//delete a perticuler course
router.delete("/delete/course",auth,isInstructor,deleteCourse);

//get full details of course
router.post("/full/details/of-course",auth,getFullDetailsCourse);

//get spefic instructor course
 router.get("/instructor/all-course",auth,isInstructor,getInstructorAllCourses);

 //add a section of a course onlu instructor
 router.post("/add-section",auth,isInstructor,createScetion);

 //upadte a section
router.post("/update/section",auth,isInstructor,updateSection);

//delete section
router.post("/delete/section",auth,isInstructor,deleteSection);


// add sub-section into a section
router.post("/add/subsection",auth,isInstructor,createSubSuction);

//update sub-section of a section
router.post("/update/subsection",auth,isInstructor,updateSubSection);

//delete sub-section of a section
router.post("/delete/subsection",auth,isInstructor,deleteSubSection);


//get all Registered course
router.get("/get-all-course",getAllCourses);

// get details of a course
router.post("/get/course-details",getALldetailsOfCourse);

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// *****TODO: Put IsAdmin Middleware here
router.post("/create/course-category",auth, isAdmin,createCatagory);

// show all categories
router.get("/show/all-categories",getAllcategory);

//get categories page details
router.post("/get/category/page-details",categoryPageDetails)


// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
//create rating and review by student
router.post("/create/rating-review",auth,isStudent,createReview)

//get avarage rating of the course
router.get("get-avg-rating",getAvgReview);

//get all rating and review
router.get("/get/all/rating-review",getAllRating);

//mark lecture colmpleted
router.post("/mark/complete-lecture",auth,isStudent,updateCourseProgress);

module.exports=router;