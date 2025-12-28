const validator = require('validator');

// Below function validates Product details using validator
const validateProductDetails = (productDetails)=>{
    const {name, category, unitPrice, availableStock} = productDetails;

    if (validator.isEmpty(name) || validator.isEmpty(category)) {
        return {
            validationResult : false,
            validationMessage : "Product Name and Category Should not be Empty"
        };
    }

    if (Number.isNaN(unitPrice) || Number.isNaN(availableStock)) {
        return {
            validationResult: false,
            validationMessage: "Unit Price and Available Stock must be valid numbers"
        };
    }

    if (unitPrice<=0 || availableStock<=0) {
        return {
            validationResult : false,
            validationMessage : "Unit Price and Available Stock Should be greater than 0"
        };
    }

    return {
        validationResult : true,
        validationMessage : "Product Data is Valid"
    };
    
};

module.exports = {
    validateProductDetails
};