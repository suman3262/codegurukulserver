
const section = require("../models/section");
const Section=require("../models/section");
const Course=require("../models/course");

//create a new section
exports.createScetion=async(req,res)=>{

    try {
        const{sectionName,courseID}=req.body;
        
        //validate
        if(!sectionName || !courseID){
            return res.status(400).json({
                success:false,
                message:"All field are require"
            })
        }
        
        // how to populate updated couse ,to that coursecontent not conatin only id conatin entire object
        const newSection=await Section.create({sectionName});

        //push the section on course
        const updatedCourse=await Course.findByIdAndUpdate(courseID ,
                                                             {
                                                                $push:{
                                                                    courseContent:newSection._id
                                                                }
                                                             },
                                                             {
                                                                new:true
                                                             }
                                                         )
                                                         .populate({
                                                            path:"courseContent",
                                                            populate:{
                                                             path:"subSection"
                                                            }
                                                         })
                                                         .exec();
 
        return res.status(200).json({
            success:true,
            message:"New section created successfully ",
            data:updatedCourse,
        })

    } catch (error) {
        
        console.log(error);
        return res.status(500).json({
            success:true,
            message:error.message
            
        })
    }
}

//update the exsisting section
exports.updateSection=async(req,res)=>{
     try {
        
        const {sectionName, sectionID,courseID}=req.body;
            
        console.log(sectionID,sectionName,courseID);
        if(!sectionName || !sectionID ||!courseID){
            return res.status(400).json({
                success:false,
                message:"all filed are require"
            })
        }

        
    //experiment start
     //update section name
    const updatedSection=await Section.findByIdAndUpdate(sectionID,
        {sectionName},
         {new:true}
         );

         //Step 1: Update the Section document with the new sectionName
         const sectionIDToUpdate = updatedSection._id; // Get the updated Section's _id
         
       // Step 2: Update the courseContent array in Course documents that contain the sectionID
               await Course.updateMany(
                                        { courseContent: sectionID },
                                        {  $set: { 'courseContent.$': sectionIDToUpdate } },
                                        { new: true }
                                      );

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
            message:"Section updated successfully",
            data:updatedCourse,
        })                                                     

     } catch (error) {
        
        return res.status(500).json({
            success:false,
            message:`error in update section :${error.message}`
        });
     }
}

// delete section
exports.deleteSection=async(req,res)=>{

    try {
        
        // fetch section id by url parameter

        const {sectionID,courseID}=req.body;

        if(!sectionID){
            return res.status(400).json({
                success:false,
                message:"all filed are require"
            })
        }
       let result= await Course.findByIdAndUpdate({_id:courseID},
        {
            $pull:{
                courseContent:sectionID,
            },
           
        },
         {
            new:true
         } 
        ) .populate({
            path:"courseContent",
            populate:{
             path:"subSection"
            }
         })
         .exec();

        await Section.findByIdAndDelete({_id:sectionID});

        return res.status(200).json({
            success:true,
            message:"Section deleted successfully",
            data:result
        })

    } catch (error) {
        
        return res.status(500).json({
            success:false,
            message:`error in section deletion :${error.message}`
        });
    }
}