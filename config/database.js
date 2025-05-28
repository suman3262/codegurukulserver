
const mongoose=require("mongoose");
require("dotenv").config();

exports.dbConnect=()=>{
    try {
        mongoose.connect(process.env.MONGODB_URL,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        }).then(()=>{
            console.log("Data dbase connection successfully establish");
        });
    } catch (error) {
        console.error("Db connting to faild");
        console.log(error);
    }
}

