const course = require("../models/course");
const Couse=require("../models/course");
const Category=require("../models/category");
const User=require("../models/userSchema")
const Section=require("../models/section")
const SubSection=require("../models/subSection");
const CourseProgress=require("../models/courseProgress")
const {imageUpload}=require("../utils/imageUpload");
const {convertSecondsToDuration} =require("../utils/secToDuration");
const { populate } = require("../models/ratingAndReview");

require("dotenv").config();

// create course
exports.createCourse=async(req,res)=>{

    try {
         // fetch the all data from the body
        let {courseName
          ,courseDescription
          ,whatYouWillLearn
          ,price
          ,tag
          ,category
          ,status
          ,instructions
        }=req.body;

        const thumbnail=req.files.thumbnail;
        
        //check all data are present are not
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category){
           
            return res.status(400).json({
                success:false,
                message:"all field are require"
            })
        }

        //fetch the insturctor ID
        let userId=req.user.id;
        if (!status || status === undefined) {
			status = "Draft";
		}
        //***** must see again it mightbe changeble
        //fetch the instructor details from the Data Base for course [detils_instructor] follow the user schema 
        // instructor Object ID
        const instructorDetails=await User.findById(userId,{
            accountType: "Instructor",
        });

        //validate the instructor 
        if(!instructorDetails){

            return res.status(404).json({
                success:false,
                message:"Instructor are not valid"
            })
        }

        const categoryDetails=await Category.findById(category);

        if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			});
		}

        // i this both are same
        console.log("ARRE YER USER_ID & INSTRUCTOR_ID TOH same HAIN ::--",userId,instructorDetails._id);


    
        
        //upload thumb nail image to cloudinary
        const uploadThumbnail=await imageUpload(thumbnail,process.env.FOLDER_NAME);

        // create a new course by instructor
        const newCouse=await Couse.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price,
            tag:tag,
            category:categoryDetails._id,
            status:status,
            instructions:instructions,
            thumbnail:uploadThumbnail.secure_url
        })

        // update the course on course list of instructor
        await User.findByIdAndUpdate( {_id:instructorDetails._id},
                                    {
                                        $push:{
                                            courses:newCouse._id,
                                        }
                                    },
                                    {
                                        new:true
                                    }
                                     );


        // update on category schema
        await Category.findByIdAndUpdate( 
                                      {_id:categoryDetails.id},
                                      {
                                        $push:{
                                            course:newCouse._id
                                        }
                                      },
                                      {
                                        new:true
                                      }
        )  ;
        
        return res.status(200).json({
            success:true,
            message:"Course created successfully",
            data:newCouse
        });




    } catch (error) {
        console.log(error);
        return  res.status(500).json({
            success:false,
            message:`Error in created course : ${error.message}`
        })
    }
}

// Edit Course Details
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const cOurse = await course.findById(courseId)
  
      if (!cOurse) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnail
        const thumbnailImage = await imageUpload(
          thumbnail,
          process.env.FOLDER_NAME
        )
        cOurse.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          // if (key === "tag" || key === "instructions") {
          //   cOurse[key] = JSON.parse(updates[key])
          // } else {
          //   cOurse[key] = updates[key]
          // }

          cOurse[key] = updates[key]
        }
      }
      
      console.log("ok upto here , im ok before save()")
      await cOurse.save()
      console.log("ok upto here , im ok after save()")
      const updatedCourse = await course.findOne({
        _id: cOurse._id,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additonalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }

  
    
 }

 //edit course 
/* exports.editCourse = async (req, res) => {
    
  try {
    const { courseId } = req.body;
    const updates = req.body;
    const COURSE = await course.findById(courseId);

    if (!COURSE) {
      return res.status(404).json({ error: "Course not found" });
    }

    // If Thumbnail Image is found, update it
    if (req.files) {
      console.log("thumbnail update");
      const thumbnail = req.files.thumbnail;
      const thumbnailImage = await imageUpload(thumbnail, process.env.FOLDER_NAME);
      COURSE.thumbnail = thumbnailImage.secure_url;
    }

    // Update only the fields that are present in the request body
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (key === "tag" || key === "instructions") {
          // Assuming "tag" is received as a comma-separated string
          COURSE[key] = updates[key].split(",").map((tag) => tag.trim());
        } else {
          COURSE[key] = updates[key];
        }
      }
    }

    console.log("ok up to here, I'm ok before save()");
    await COURSE.save();
    console.log("ok up to here, I'm ok after save()");

    const updatedCourse = await course.findById(COURSE._id)
      .populate({
        path: "instructor",
        populate: {
          path: "additonalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}; */

  //delete course
 exports.deleteCourse=async(req,res)=>{

  try {
    const { courseId } = req.body;
    const Course = await Couse.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    //course also nedd to deleted from the category**my added
     // const upDatedCategoryCourse=await Category.find()


      // Unenroll students from the course
      const studentsEnrolled = Course.studentsEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
    // Delete sections and sub-sections
    const courseSections = Course.courseContent
    for (const sectionId of courseSections) {

      // Delete sub-sections of the section
      const section = await Section.findById(sectionId)
      if (section) {
        const subSections = section.subSection
        for (const subSectionId of subSections) {
          await SubSection.findByIdAndDelete(subSectionId)
        }
      }

      // Delete the section
      await Section.findByIdAndDelete(sectionId);
    }

     // Delete the course
     await Couse.findByIdAndDelete(courseId)

     return res.status(200).json({
       success: true,
       message: "Course deleted successfully",
     })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
 } 

//get spefic instructor courses
exports.getInstructorAllCourses=async(req,res)=>{

  try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id;
      
    // Find all courses belonging to the instructor
    const instructorCourses = await Couse.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 })

    // Return the instructor's courses
    res.status(200).json({
      success: true,
      data: instructorCourses,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    })
  }
}

//get all full details of a course
exports.getFullDetailsCourse=async(req,res)=>{

  try {
    
    const { courseId } = req.body;
    const userId = req.user.id;

    const courseDetails=await Couse.findOne(  {
                                                 _id:courseId
                                               } 
                                          ) .populate({
                                            path: "instructor",
                                            populate: {
                                              path: "additonalDetails",
                                            },
                                          })
                                          .populate("category")
                                          .populate(
                                            {
                                              path:"ratingAndReviews",
                                              populate:{
                                                path:"user"
                                              }

                                            }
                                          )
                                          .populate({
                                            path: "courseContent",
                                            populate: {
                                              path: "subSection",
                                            },
                                          })
                                          .exec()
       //this part for student usege
    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userID: userId,
    });
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      })
    }
    
    let totalDurationInSeconds = 0
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration)
        totalDurationInSeconds += timeDurationInSeconds
      })
    })
    const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
    
    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideo
          ? courseProgressCount?.completedVideo
          : [],
      },
    })

  } catch (error) {
     return res.status(500).json({
      success: false,
      message: error.message,
      errorIN:"error in get full detils api"
    })
  }
}

// get all courses
exports.getAllCourses=async(req,res)=>{
    try {
        
        //fetch all course from the DB
        const allCourse=await course.find({},
            {
                courseName:true,
                price:true,
                thumbnail:true,
                instructor:true,
                ratingAndReviews:true,
                studentsEnrolled:true
            }).populate("instructor").exec();

        return res.status(200).json({
            success:true,
            data:allCourse,
        })
         
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:true,
          message:error.message,
        })
    }
}

//get all details of a course
exports.getALldetailsOfCourse=async(req,res)=>{

    try {
        const {courseID}=req.body;
        //path using for nested populate
        // example :- course have course-content and course content Relation to Section :- section related to subSection
        const courseDetails=await course.find({_id:courseID})
                                        .populate(
                                               {
                                                path:"courseContent",
                                                populate:{
                                                   path:"subSuction"
                                                }
                                               }
                                          )
                                          .populate(
                                            {
                                                path:"instructor",
                                                populate:{
                                                    path:"additonalDetails",
                                                    
                                                },
                                            }
                                          ).populate("category").exec();
                                          
               if(!courseDetails ) 
               {
                return res.status(404).json({
                    success:false,
                    message:"Course all details are not found"
               })
               }  
               return res.status(200).json({
                success:true,
                message:"successfulle get all details of course",
                data:courseDetails
            })                             

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:`error in all course details ${error.message}`
        })
    }
}