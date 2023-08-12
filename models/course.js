const moment = require('moment-timezone');
const mongoose=require("mongoose");

const courseSchema= new mongoose.Schema({

    courseName:{
        type:String
    },
    courseDescription:{
        type:String,
    },
    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    whatYouWillLearn:{
        type:String,
    },
    courseContent:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Section"
        },
       
    ],
    ratingAndReviews:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"RatingAndReview"
        }
    ],

    price:{
        type:Number
    },
    thumbnail:{
        type:String
    },
    tag:{
        type:[String],
        required: true,
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },
    studentsEnrolled:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
    ],
    instructions: {
		type: [String],
	},
	status: {
		type: String,
		enum: ["Draft", "Published"],
	},
    createdAT:{
        type: Date,
      default: Date.now,
    }

});

// Pre-save middleware to update createdAt with the local time
courseSchema.pre('save', function (next) {
    this.createdAt = moment().tz('Your_Local_Timezone').toDate();
    next();
  });
  
  // Create the Course model using the schema
  const Course = mongoose.model('Course', courseSchema);
  
  // Export the model
  module.exports = Course;