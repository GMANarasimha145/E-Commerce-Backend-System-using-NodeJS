const mongoose  = require('mongoose');

const EAllOrderSchema = new mongoose.Schema({
    productId : {
        // Refers EAllProduct Collection with Object Id as Type
        type : mongoose.Schema.Types.ObjectId,
        ref : 'EAllProduct',
        trim : true
    },
    orderPlacedAt : {
        type : Date,
        required : true
    },
    orderedBy : {
        // Refers EAllUser Collection with Object Id as Type
        type : mongoose.Schema.Types.ObjectId,
        ref : 'EAllUser',
        required : true
    },
    shipTo : {
        type : String,
        required : true
    },
    quantity : {
        type : Number,
        required : true
    }, 
    total : {
        type : Number,
        required : true
    }, 
    paymentType : {
        // Used enum to ensure only two payment methods got stored
        type : String,
        required : true,
        enum : ["Cash On Delivery", "Pay through Credit/Debit/UPI"]
    }, 
    paymentStatus : {
        // Used enum to ensure only three payment status flags got stored
        type : String,
        required : true,
        enum : ["Paid via Card", "Pending with COD", "Pending"]
    }

});

module.exports = mongoose.model('EAllOrder', EAllOrderSchema);