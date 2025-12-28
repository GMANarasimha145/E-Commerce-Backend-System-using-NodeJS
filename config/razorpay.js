const Razorpay = require('razorpay');

// configuring razor pay with key id and key secret to create order in razorpay
const razorpayInstance = new Razorpay({
    key_id : process.env.RAZORPAY_TEST_KEY_ID,
    key_secret : process.env.RAZORPAY_TEST_KEY_SECRET
});

// exporting to use in user order entry controller for handling payments
module.exports = razorpayInstance;