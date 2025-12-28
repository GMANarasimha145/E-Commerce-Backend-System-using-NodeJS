const mongoose = require('mongoose');

const EAllAdminSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        trim : true
    }, 
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    }, 
    password : {
        type : String,
        required : true,
        trim : true,
    },
    isActive : {
        type : Boolean,
        required : true
    },
    registrationDate : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('EAllAdmin', EAllAdminSchema);