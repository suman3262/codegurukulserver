const express=require("express");
const app=express();

const userRoutes=require("./routes/User");
const profileRouts=require("./routes/Profile");
const paymentRouts=require("./routes/Payments");
const courseRouts=require("./routes/Course");

const {dbConnect}=require("./config/database");
const cookieParser=require("cookie-parser");
const cors=require("cors");
const {cloudinaryConnect}=require("./config/cloudinary");
const fileUpload=require("express-fileupload");
require("dotenv").config();

//setup middleware

//connect database
dbConnect();

app.use(express.json());
app.use(cookieParser());

//to entatain front-end
app.use(
    cors({
        origin:"*",
        credentials:true,
    })
);
//file upload middleware
app.use(
    fileUpload({
         useTempFiles:true,
         tempFileDir:"/tmp"
    })
)
//connect file dpload cloudinary
cloudinaryConnect();

//mounts routs
app.use("/api/v1/auth",userRoutes);
app.use("/api/v1/profile",profileRouts);
app.use("/api/v1/course",courseRouts);
app.use("/api/v1/payments",paymentRouts);

app.get('/', (req, res) => {
    return res.send('<h1>Welcome to codegurukul</h1>');
})
app.listen(process.env.PORT,()=>{
    console.log(`your server is running on on port :${process.env.PORT}`);
    return `<h1>Hellowworld </h1>`
});