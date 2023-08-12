
// set up razorpay
//1 install razorpay via npm packeg npm i razorpay
//2 import instance and required model

const mailsender=require("../utils/mailSender");
const CourseProgress=require("../models/courseProgress")
const User=require("../models/userSchema");
const Course=require("../models/course");
const {instance}=require("../config/razorpay");
const { default: mongoose } = require("mongoose");
var crypto = require('crypto');
const course = require("../models/course");
const {courseEnrollmentEmail}=require("../mail/templates/courseEnrollmentEmail")
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
require("dotenv").config();

//THIS CODE WRITE DOWN FOE ACCEPT PAYMENT FOR MULTIPLE COURSE LIKE BY ALL CART ITEM
exports.capturePayment=async(req,res)=>{

  
   try {
    const{courses}=req.body;
    const{userID}=req.user.id;
    const userId=req.user.id;

    // if no course selected
    if(courses.length === 0)
    {
        return res.status(404).json({
            success:false,
            message:"Courses not found"
        })
    }
   

    // let delete those course taht already purches ***extra part added ##TO_DOO
  


      
    let totalAmountToPay=0;

     //add total amount  // chage courses t0 -> updatedCourses
    for(const course_id of courses)
    {
        let course;

        try {

            course=await Course.findById(course_id);
             
            //if course not find
            if(!course)
            {
                return res.status(404).json(({
                    success:false,
                    message:"course not found"
                }))
            }

            const uid=new mongoose.Types.ObjectId(userID);
            //if user already buy and enrolled course
            if(course.studentsEnrolled.includes(uid))
            {
                  return res.status(200).json({
                    success:false,
                    message:"User already enroled the course",
                  })
            }
            totalAmountToPay +=course?.price;
            
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                success:false,
                message:"Internal server error"
            })
        }
    }
 
    const currency="INR";
    //options are optionals its depend on you
    const options={
       amount:totalAmountToPay*100,
       currency,
       receipt:Math.random(Date.now()).toString(),
       
    }

    //create payment order
    const paymentResponce=await instance.orders.create(options);


    if(paymentResponce)
    {
        return res.status(200).json({
            success:true,
            message:"Order created",
            data:paymentResponce
        
            
        })
    }

    
   } 
   catch (error) {
      console.log(error);
      return res.status(500).json({
        success:false,
        message:"Eroor in creating order api",
        fault:error.message,
      })
   }

}

//VERIFY PAYMENTE
exports.verifySignature=async(req,res)=>{

    try {
           const razorpay_order_id=req.body?.razorpay_order_id;
           const razorpay_payment_id=req.body?.razorpay_payment_id;
           const razorpay_signature=req.body?.razorpay_signature;
           const courses=req.body?.courses;
           const userID=req.user?.id || req.body?.userID;
           
    

           if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userID)
           {
            console.log("signature->",razorpay_signature);
             return res.status(404).json({
                success:false,
                message:"ALL field are required to verify signature",
                fault:razorpay_signature
             })
           }

           let body= razorpay_order_id+ "|" +razorpay_payment_id;
            const expectedSignature=crypto.createHmac("sha256",process.env.RAZORPAY_SECRET).update(body.toString()).digest("hex")

            if(razorpay_signature === expectedSignature)
            {
                //enrold student into course
                await enrolledStudentIntoCourse(courses,userID,res);

                const user=await User.findById(userID)

                return res.status(200).json({
                    success:true,
                    message:"Payment verified",
                    data:user,
                })
            }
           

            return res.status(400).json({success:false,message:"payment faild"})

    } catch (error) {
        
        console.log(error);
        return res.status(400).json(({
            success:false,
            message:"Error in enrolled user",
            Fault:error.message,
        }))
    }
}

const enrolledStudentIntoCourse=async(courses,userID,res)=>
{
   try {

    if(!courses || !userID)
    {
      return res.status(404).json({
          success:false,
          message:"Please provide courses & userID"
      })
    }

  for(const courseID of courses)
  {
       //find course and enrolled course
      const enrolledCourse=await Course.findByIdAndUpdate(
                                                          {_id:courseID},
                                                          {$push:{studentsEnrolled:userID}},
                                                           {new:true}
                                                          );
       //create course progress before student enroll

       const courseProgress=await CourseProgress.create({
        courseID:courseID,
        userID:userID,
        completedVideo:[]
       })
                                                              
     //find the student and add the student
    const   enrolledStudent=await User.findByIdAndUpdate(
                                                  {_id:userID},
                                                  {$push:{
                                                          courses:courseID,
                                                          courseProgress:courseProgress._id
                                                        }
                                                    },
                                                  {new:true}
                                                 );
      const emailResponce=await mailsender(
          enrolledStudent.email,
          `Successfuly enroled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(enrolledCourse.courseName , `${enrolledStudent.firstName}`)
      )                                           
  }  
   } catch (error) {
     return res.status(500).json(({
         success:false,
         message:"Error in student enrollment after payment"
     }))
   }
}

//after payment successful api
exports.sendPaymentSuccessEmail = async(req, res) => {
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({success:false, message:"Please provide all the fields"});
    }

    try{
        //student ko dhundo
        const enrolledStudent = await User.findById(userId);
        await mailsender(
            enrolledStudent.email,
            `Payment Recieved`,
             paymentSuccessEmail(`${enrolledStudent.firstName}`,
             amount/100,orderId, paymentId)
        )

    }
    catch(error) {
        console.log("error in sending mail", error)
        return res.status(500).json({success:false, message:"Could not send email"})
    }
}

















































// //**this code use for single paymet
// //create a payments capture Razorpay order
// exports.capturePayment=async(req,res)=>{

//     try {
        
//         //fetch the user and course id
//         const{courseID}=req.body;
//         const userID=req.user.id;

//         if(!courseID || !userID)
//         {
//             return res.status(404).json({
//                 success:false,
//                 message:"All data are required"
//             })
//         }

//         //validate course

//         let course=await Course.findById(userID);
//         if(!course){
           
//             return res.status(404).json({
//                 success:false,
//                 message:"Course not found"
//             })
//         }

//        // let check user already in course are not
//        let uID=new mongoose.Types.ObjectId(userID);

//        if(Course.studentsEnrolled.includes(uID)){
//         return res.status(200).json({
//             success:true, 
//             message:"User already enroled in this course"
//         })
//        }


//        //order create
//         const amount=course.price;
//         const currency="INR";

//         //options are optionals its depend on you
//         const options={
//            amount:amount*100,
//            currency,
//            recipt:Math.random(Date.now()).toString(),
//            notes:{
//             courseID:courseID,
//             userID:userID
//            }
//         }
         
//         //create payment order
//         const paymentResponce=await instance.orders.create(options);
//         console.log(paymentResponce);
//         if(paymentResponce)
//         {
//             return res.status(200).json({
//                 success:true,
//                 message:"Order created",
//                 courseName:course.courseName,
//                 courseDescription:course.courseDescription,
//                 thumbnail:course.thumbnail,
//                 orderID:paymentResponce.id,
//                 currency:paymentResponce.currency,
//                 amount:paymentResponce.amount
//             })
//         }
        

//     } catch (error) {
//         console.log("error in Payments",error);

//         return res/staus(401).json({
//             success:false,
//             message:`${error.message}`
//         })
//     }
// }

// //verify the payments signature
// exports.verifySignature=async(req,res)=>{

//     try {
//         //for server side
//         const webhookSignature="12345678";
      
//         //signature recive from razorpay after payments
//        const signature=req.headers("x-razorpay-signature");

//        //make it encrypt
//        const SHAsum=crypto.createHmac("sha256",webhookSignature);
       
//        SHAsum.update(JSON.stringify(req.body));

//        const digest=SHAsum.digest("hex");
        
//        //compare secret_key
//        if(signature===digest)
//          {
//         console.log("payment authorised");

//         const {courseID,userID}=req.body.payload.payment.entity.notes;
 
//             // update student in enroled course
//             const enrooledCourse=await Course.findOneAndUpdate(
//                                                               {_id:courseID},
//                                                           {
//                                                               $push:{
//                                                                 studentsEnrolled:userID
//                                                               }
//                                                           },
                    
//                                                          {new:true} );
            
        
//         if(!enrooledCourse)
//         {
//             return res.json(
//                 {
//                     success:false,
//                     message:"Course not found"
//                 }
//             )
//         }
        
//         //update the student in course list
//         const enrollStudent=await User.findOneAndUpdate( 
//                                                          {_id:userID},
//                                                          {
//                                                             $push:{
//                                                                 courses:courseID
//                                                             }
//                                                          },
//                                                          {
//                                                             new:true
//                                                          }
//                                                         );

//         //send email to student regueds he/she are in this course 
//         const sendMail=await mailsender(
//             enrollStudent.email,
//             "Congrats you are successfully enroled in codenation"
//         );

//     return res.status(200).json({
//         success:true,
//         message:"SIgnarure verified successfully"
//     })

//          }

//     return res.status(400).json({
//         success:false,
//         message:"Signature verification failed"
//     })
//     }
//    catch(error){
//     return res.status(200).json({
//         success:false,
//         message:`error in signature cerification ${error.message}`
//     })
// }

// }

