//additonal
const Course=require("../models/course");

const Section =require("../models/section");
const SubSection=require("../models/subSection");
const {imageUpload}=require("../utils/imageUpload");
require("dotenv").config();

//create sub section
exports.createSubSuction=async(req,res)=>{
    try {

        const video=req.files.video;
        const {sectionId ,description,title,courseID}=req.body;

        if(!sectionId || !title  ||!description ||!video)
        {
            return res.status(404).json({
                success:false,
                message:"all field are require for sub section",
        
            })
        }

        // upload file to cloudenery
        const videoUpload=await imageUpload(video,process.env.FOLDER_NAME);

        // create section 
        const subsectionDetails= await SubSection.create({
            title,
            timeDuration:`${videoUpload.duration}`,
            description:description,
            videoUrl:videoUpload.secure_url
        });

        // now update on section 
        const updatedSection=await Section.findByIdAndUpdate( {_id:sectionId} ,
                                                              {$push:{subSection:subsectionDetails._id}},
                                                              {new:true}
                                                            )
                                                            .populate("subSection").exec();
        
    //additonal start
     const updatedSectionID=updatedSection._id;
   
      await Course.updateMany(
                              { courseContent: sectionId },
                              {  $set: { 'courseContent.$': updatedSectionID } },
                              { new: true }
                              )
     
    const updatedCourse = await Course.findById(courseID)
                              .populate({
                             path: "courseContent",
                             populate: {
                             path: "subSection",
                                 },
                            })
                            .exec();  

     //end

 
       return  res.status(200).json({
            success:true,
            message:"Sub-section added successfully",
            data:updatedCourse
       })
    } catch (error) {
        
        return res.status(400).json({
            success:false,
            message:`error in create sub-section :${error.message}`
        })
    }
}

//update sub-section
exports.updateSubSection=async (req,res)=>{

    try {
      //  const video=req.files.video;
        const {sectionID ,title,description,subsectionID,courseID}=req.body;
       const subsection =await SubSection.findById(subsectionID)
       
        if(!subsection)
        {
            return res.status(404).json(({
                success:false,
                message:"Sub-section was not found",

            }))
        }

        if( title !==undefined)
        {
            subsection.title=title;
        }
        if(description !==undefined)
        {
            subsection.description=description;
        }

        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await imageUpload(
              video,
              process.env.FOLDER_NAME
            )
            subsection.videoUrl = uploadDetails.secure_url
            subsection.timeDuration = `${uploadDetails.duration}`
          }

        await subsection.save();

       const updatedSection=await Section.findById(sectionID).populate('subSection');

           await Course.updateMany(
                                   { courseContent: sectionID },
                                   {  $set: { 'courseContent.$': updatedSection._id } },
                                   { new: true }
                                  )

     const updatedCourse = await Course.findById(courseID)
                                  .populate({
                                 path: "courseContent",
                                 populate: {
                                 path: "subSection",
                                     },
                                })
                                .exec();                          

        return res.status(200).json({
            success:true,
            message:"ok",
            data:updatedCourse
        })

        
    }
     
     catch (error) {
        return res.status(500).json({
            success:false,
            message:"errour ocour in subsection-update",
            cause:error.message
        })
    }
}

//delete sub-section
exports.deleteSubSection=async(req,res)=>{

    try {
        
        const{subsectionID, sectionID,courseID}=req.body;

        const subsection =await SubSection.findByIdAndDelete(subsectionID);
        if(!subsection){
            return res
            .status(404)
            .json({ success: false, message: "SubSection not found" })  
        }


        const updatedSection=await Section.findByIdAndUpdate(
            {_id:sectionID},
            {
                $pull:{
                    subSuction:subsectionID
                }
            },
            {new:true}
        ).populate('subSection');

        
        
       //update in course content array
        await Course.updateMany(
            { courseContent: sectionID },
            {  $set: { 'courseContent.$': updatedSection._id } },
            { new: true }
           )
      const updatedCourse = await Course.findById(courseID)
                                  .populate({
                                 path: "courseContent",
                                 populate: {
                                 path: "subSection",
                                     },
                                })
                                .exec();  


     
        return res.json({
            success: true,
            message: "SubSection deleted successfully",
            data:updatedCourse
          })

    } catch (error) {
        console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
}