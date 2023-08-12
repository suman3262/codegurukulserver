
const ratingReview=require("../models/ratingAndReview");
const Course=require("../models/course");
const ratingAndReview = require("../models/ratingAndReview");
const { default: mongoose } = require("mongoose");

//create
exports.createReview=async(req,res)=>{

     //step 
     //get user id
     //fetch data from request bosy
     //check user enroled or not
     //create rating and review
     //update course with rating and review
     //return responce

     try {
        //step 1
        const userID=req.user.id
        const{rating ,review,courseID}=req.body;

        //step 2
        if(!rating || !review || !courseID)
        {
            return res.status(404).json({
                success:false,
                message:"All field are require"
            })
        }
    
        //step 3
        const enroled=await Course.findById({_id:courseID,
                                              //search atudent a enrolledfiled  
                                              studentsEnrolled: {$elemMatch:{$qu:userID}}        
                                             },
                                                                      
                                            );
       if(!enroled){
         return res.status(404).json({
            success:false,
            message:"User not enroled in this course"
         })
       }   
       
       const alreadyRiviewed=await ratingAndReview.findOne({
                                               user:userID,
                                               course:courseID
       });

       if(alreadyRiviewed)
       {
        return res.status(300).json({
            success:false,
            message:"User already write are revied"
        })
       }

       //create review
       const Rating_Review=await ratingAndReview.create({
        user:userID,
        rating:rating,
        review:review,
        course:courseID
       });

       // upadte on course
       const updatedOnCourse=await Course.findByIdAndUpdate(courseID,
                                                    {
                                                     $push:{
                                                        ratingAndReviews:Rating_Review._id
                                                       }
                                                    }    
                                                        );

     
      return res.status(200).json({
        success:true,
        message:`successfully created rating and reviewd`,
        data:[updatedOnCourse,Rating_Review]
      })
        
     } catch (error) {
        return res.status(500).json({
            success:false,
            message:`Error in creating rating and review ${error.message}`
        })
     }

}

//get avarage rating

exports.getAvgReview=async(req,res)=>{

    try {
        
        //get courseID
        const{courseID}=req.body;

        //calculate avg rating
        // know more about mongoDB aggregation visite: "https://studio3t.com/knowledge-base/articles/       mongodb-aggregation-framework/"
        const result= await ratingAndReview.aggregate([

            // finding the rating and review perticuler course
            {
                //$match stage – filters those documents we need to work with, those that fit our needs
                $match:{
                    course:new mongoose.Schema.Types.ObjectId(courseID),
                }
            },

            //make group of those finding result
           // $group stage – does the aggregation job
            {
               $group:{
                  _id:null,
                  avarageRating:{$avg :"$rating"}
               }
            }
        ]);

        if(result.length>0)
        {
            return res.status(200).json({
                success:true,
                message:"getting the rating successfully",
                avgRating:result[0].avarageRating
            })
        }
      else{
        return res.status(300).json({
            success:true,
            message:"0 rating get",
            
        })
      }
    } catch (error) {
        
        console.log(error);

        return res.status(500).json({
            success:false,
            message:`Error in geting avg review :${error.message}`
        })
    }
}

//get all rating and review 
exports.getAllRating=async(req,res)=>{

    try {
        
        //get rating and user details
        //desending cause  5 start review at first
        const allRating=await ratingAndReview.find({})
                             .sort({rating:"desc"})
                             .populate({path:"user",   select:"firstName lastName email image"})
                             .populate({path:"course",select:"courseName"})
                             .exec();

       return res.status(200).json({
        success:true,
        data:allRating
       })                      
    } catch (error) {
        return res.status(200).json({
            success:false,
            message:`Error in geting all review ${error.message}`
           }) 
    }
}