// Below function validates User details like Quantity and Shipment Address details given to make order with help of Regular Expression
const validateUserOrderDetails = (requestBody)=>{
    const {countryOrRegion, mobileNumber, pincode, flatBuildingHouseNum, areaStreet, landmark, townCity, cityState, quantity} = requestBody;

    if (!countryOrRegion || !mobileNumber || !pincode || !flatBuildingHouseNum || !areaStreet || !landmark || !townCity || !cityState || !quantity) {
        return {
            validationResult : false,
            validationMessage : "Please fill the Mandatory Address Details"
        };
    }

    if (!/^[6-9]\d{9}/.test(Number(mobileNumber))) {
        return {
            validationResult : false,
            validationMessage : "Mobile Number should be Number with 10 digits only"
        };
    }

    if (!/^[1-9]\d{5}/.test(Number(pincode))) {
        return {
            validationResult : false,
            validationMessage : "Pincode should be Number with 6 digits only"
        };
    }

    const quantityNumber = Number(quantity);
    if (Number.isNaN(quantityNumber) && quantityNumber>0) {
        return {
            validationResult : false,
            validationMessage : "Quantity should be Number and must be greater than 0"
        };
    }


    return {
        validationResult : true,
        validationMessage : "Data is Valid"
    };
};

module.exports = {
    validateUserOrderDetails
};