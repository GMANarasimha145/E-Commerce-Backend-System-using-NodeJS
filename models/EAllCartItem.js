const mongoose = require('mongoose');

const EAllCartItemSchema = new mongoose.Schema({
    quantity : {
        type : Number
    },
    productId : {
        // Refers EAllProduct Collection with Object Id as Type
        type : mongoose.Schema.Types.ObjectId,
        ref : "EAllProduct"
    },
    addedBy : {
        // Refers EAllUser Collection with Object Id as Type
        type : mongoose.Schema.Types.ObjectId,
        ref : "EAllUser"
    }
});

module.exports = mongoose.model('EAllCartItem', EAllCartItemSchema);