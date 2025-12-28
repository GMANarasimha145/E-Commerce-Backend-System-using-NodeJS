const mongoose = require('mongoose');

const EAllProdctSchema = new mongoose.Schema({
    productImageURL : {
        type : String,
        required : true,
        trim : true
    },
    productImagePublicId : {
        type : String,
        required : true,
        trim : true
    },
    name : {
        type : String,
        required : true,
        unique : true,
        trim : true
    },
    category : {
        type : String,
        required : true,
        trim : true
    },
    unitPrice : {
        type : Number,
        required : true
    },
    availableStock : {
        type : Number,
        required : true
    },
    reviews : {
        type : [String],
        default : []
    },
    rating : {
        type : Number,
        default : 0
    },
    addedBy : {
        // Refers EAllAdmin Collection with Object Id as Type
        type : mongoose.Schema.Types.ObjectId,
        ref : 'EAllAdmin',
        required : true
    }, 
    isDeleted : {
        type : Boolean,
        default : false,
    },
    deletedAt : {
        type : Date
    }

});

module.exports = mongoose.model('EAllProduct', EAllProdctSchema);