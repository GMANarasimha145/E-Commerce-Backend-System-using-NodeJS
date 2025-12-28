const crypto = require('crypto');

// generating razorpay signature with Hmac, usally this signature should be passed by frontend
// But here i'm simulating below code like it is coming from frontend, actually it is sent from below method instead of frontend
const generateRazorpaySignature = (orderId, paymentId)=>{
    const body = orderId + "|" + paymentId;
    const generatedSignature =  crypto
    .createHmac('sha256', process.env.RAZORPAY_TEST_KEY_SECRET)
    .update(body)
    .digest('hex');
    return generatedSignature.toString();
};

module.exports = generateRazorpaySignature;