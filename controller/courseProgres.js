const Subsection=require("../models/subSection");
const CourseProgress=require("../models/courseProgress");

exports.updateCourseProgress=async(req,res)=>{

    try {
        const {courseID,subSectionID}=req.body;
        const userID=req.user.id;

        //check sub-section is valid
        const subSection= await Subsection.findById(subSectionID);

        if(!subSection)
        {
            return res.status(404).json({
                message:"Invalid Subsection"
            })
        }

        //check old entry
        let courseProgress=await CourseProgress.findOne({
            courseID:courseID,
            userID:userID
        });

        if(!courseProgress)
        {
            return res.status(404).json({
                success:false,
                message:"Course progress dose not esist"
            })
        }  

        //check already completed mark on lecture or
        else
        {
            if(courseProgress.completedVideo.includes(subSectionID))
            {
                return res.status(400).json({
                    message:"Lecture already maekrd completed",
                })
            }

            //push into completed video array[ ]
            courseProgress.completedVideo.push(subSectionID)
        }
        await courseProgress.save();

        return res.status(200).json({
            success:true,
            message:"Lecture complete mark successfully",
        })

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error in mark complete video on progress",
            fault:error.message,
        })
    }
}