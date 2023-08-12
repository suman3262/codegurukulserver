const express=require("express");
const router=express.Router();

const {capturePayment,verifySignature ,sendPaymentSuccessEmail}=require("../controller/Payment");

const {auth,isStudent,isInstructor,isAdmin}=require("../middleware/authentication");

// verify user is a student , and a athentic user and create apayment capture
router.post("/capture-payment",auth,isStudent,capturePayment);

// verify the payments
router.post("/verify-signature",auth,isStudent,verifySignature);
router.post("/send/payment/success-mail",auth,isStudent,sendPaymentSuccessEmail);

module.exports=router;