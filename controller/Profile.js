const Profile = require("../models/profileSchema");
const CourseProgress = require("../models/courseProgress");
const User = require("../models/userSchema");
const { imageUpload } = require("../utils/imageUpload");
const Course = require("../models/course");
const { convertSecondsToDuration } = require("../utils/secToDuration");
require("dotenv").config();

//update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you're using authentication middleware to get the user's ID
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

    if (!contactNumber || !gender || !userId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Fetch the user's additionalDetails (Profile ID) from the User model
    const user = await User.findById(userId);
    const profileId = user?.additonalDetails;

    // Update profile fields
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      {
        gender: gender,
        about: about,
        contactNumber: contactNumber,
        dateOfBirth: dateOfBirth,
      },
      { new: true } // Returns the updated profile
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    
    // Populate the additionalDetails field in the user object
    user.additonalDetails = updatedProfile;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      userDetails: user
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile",
    });
  }
};

//delete account
exports.deleteAccount = async (req, res) => {
  try {
    //[H.W]- how to scdule delete request for 5days & explore CRONE_JOB*******
    // it possible solution is b library for task scheduling

    const { userID } = req.body;

    const userDetails = await User.findById({ _id: userID });

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    ///?? if we delete user -> then user reletaed data deleted automatically**********
    //the ans is no.  no atomatic deletion are done you have two choise 1.delete separately 2. write a middle ware a use PRE HOOKS

    // delete profile
    await Profile.findByIdAndDelete({ _id: userDetails?.additonalDetails });

    // delete user
    await User.findByIdAndDelete({ _id: userID });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      data: [Profile, User],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `error in deleting account :${error.message}`,
    });
  }
};

// get the all user details || H.W
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const userDetails = await User.findById(id)
      .populate("additonalDetails")
      .exec();
    console.log(userDetails);
    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update dispalyProfile picture
exports.updateProfilePic = async (req, res) => {
  try {
    const file = req.files.displayPicture;

    const userID = req.user.id;

    const Image = await imageUpload(file, process.env.FOLDER_NAME);
    console.log("Image is:", Image);

    const updatedProfile = await User.findByIdAndUpdate(
      userID,
      { image: Image.secure_url },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: updatedProfile,
      message: "profile picture update successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all enroled course that user are enroled
exports.getEnrolledCourse = async (req, res) => {
  // try {
  //     const userID=req.user.id;

  //     const userDetails=await User.findOne({_id:userID})
  //     .populate({
  //         path:"courses",
  //         populate:{
  //             path:"courseContent",
  //            populate:{
  //             path:"subSection"
  //            }
  //         }
  //     }).populate("courseProgress")
  //     .exec();

  //     if(!userDetails)
  //     {
  //         return res.status(400).json({
  //             success: false,
  //             message: `Could not find user with id: ${userDetails}`,
  //           })
  //     }

  //    //
  //     //   for(course of userDetails.courses)
  //     //   {
  //     //     course.courseProgress=99;
  //     //     console.log(course);

  //     //     console.log("KHATAM BJAISAB.............");
  //     //   }

  //     return res.status(200).json({
  //         success: true,
  //         data: userDetails.courses,
  //         courseProgress:userDetails?.courseProgress,
  //         message:"all enroled course get sucessfully"
  //       });

  // } catch (error) {
  //     return res.status(500).json({
  //         success: false,
  //         message: error.message,
  //       })
  // }

  try {
    const userId = req.user.id;
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        });
      }



    userDetails = userDetails.toObject();
    var SubsectionLength = 0;
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      SubsectionLength = 0;
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length;
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userID:userId,
      });
      courseProgressCount = courseProgressCount?.completedVideo.length;
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100;
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2);
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier;
      }
    }

    
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get details for instructor dashbord

exports.instructorDashbord = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentEnrolled = course.studentsEnrolled.length;
      const totalEarning = totalStudentEnrolled * course?.price;

      const courseDatawithStats = {
        _id: course._id,
        courseName: course?.courseName,
        courseDescription: course?.courseDescription,
        totalStudentEnrolled,
        totalEarning,
      };

      return courseDatawithStats;
    });

    return res.status(200).json({
      success: true,
      message: "Data get successfully",
      data: courseData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      fault: error.message,
    });
  }
};
