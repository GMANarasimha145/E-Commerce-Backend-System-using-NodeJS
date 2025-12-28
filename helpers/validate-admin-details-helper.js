const validator = require('validator');

// Below function validates admin details using validator and regular expressions
// Corresponding validation result and message will be stored and returned
const validateAdminDetails = (details)=>{
    const {username, email, password, isActive } = details;
    
    if (validator.isEmpty(username) || validator.isEmpty(email) || validator.isEmpty(password) || typeof isActive !== 'boolean') {
        return {
            validationResult : false,
            validationMessage : 'Please fill the Required fields'
        };
    }

    if (!/^[a-zA-Z0-9_]{6,20}/.test(username)) {
        return {
            validationResult : false,
            validationMessage : 'Invalid Username'
        };
    }

    if (!validator.isEmail(email)) {
        return {
            validationResult : false,
            validationMessage : 'Invalid Email'
        };
    }

    if (!validator.isStrongPassword(password, { 
        minLength: 8, 
        minLowercase: 1, 
        minUppercase: 1, 
        minNumbers: 1, 
        minSymbols: 1 })) {
        return {
            validationResult : false,
            validationMessage : 'Invalid Password, Password length should be atleast 8, with minimum 1 lowercase, uppercase, special symbols'
        };
    }

    return {
        validationResult : true,
        validationMessage : 'Data is Valid'
    };
};

module.exports = {
    validateAdminDetails
};