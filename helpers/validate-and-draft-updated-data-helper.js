const {uploadImageToCloudinary} = require('./admin-upload-image-helper');
const cloudinary = require('../config/cloudinary');

// Below function validates Product Updation details using validator and uploads the image to cloudinary
// because after inserting new image, we should delete old image of the product
// Corresponding validation result and message will be stored and returned
const validateAndDraftUpdatedData = async (requestBody, fileInRequest)=>{
    try {
        let validationResult = true;
        let validationMessage = "Data is Valid";

        // Storing the attributes in the object that are only supposed to update
        // this avoids unnecesary updation on some fields
        let updatedData = {};
        if (requestBody.name)
            updatedData.name = requestBody.name;
        if (requestBody.category)
            updatedData.category = requestBody.category;
        const testUnitPrice = Number(requestBody.unitPrice);
        if (requestBody.unitPrice !== undefined) {
            if (Number.isNaN(testUnitPrice)) {
                
                return {
                    updatedData,
                    validationResult : false,
                    validationMessage : "Unit Price value should be a Number"
                };
            }
            else {
                if (testUnitPrice<=0) {
                    return {
                        updatedData,
                        validationResult : false,
                        validationMessage : "Unit Price value should be greater than zero"
                    };
                } else {
                    updatedData.unitPrice = testUnitPrice;
                }
            }
        }
        const testAvailableStock = Number(requestBody.availableStock);
        if (requestBody.availableStock !== undefined) {
            if (Number.isNaN(testAvailableStock)) {
                return {
                    updatedData,
                    validationResult : false,
                    validationMessage : "Unit Price value should be a Number"
                };
            }
            else {
                if (testAvailableStock<=0) {
                    return {
                        updatedData,
                        validationResult : false,
                        validationMessage : "Unit Price value should be greater than zero"
                    };
                } else {
                    updatedData.availableStock = testAvailableStock;
                }
            }
        }

        // If new file is provided in request then only we will upload it to cloudinary, 
        // and store the uploaded image's imageURL and publicId in to the updatedData object
        let tempImageURL, tempPublicId;
        if (fileInRequest) {
            const {imageURL, publicId} = await uploadImageToCloudinary(fileInRequest.path);
            tempImageURL = imageURL;
            tempPublicId = publicId;
        }

        if (tempImageURL && tempPublicId) {
            updatedData.productImageURL = tempImageURL;
            updatedData.productImagePublicId = tempPublicId;
        }

        // Return the updatedData variable, which have few attributes which are only supposed to update with new data
        return {
            updatedData, 
            validationResult, 
            validationMessage
        };


    } catch(error){
        console.log("Some error Occured while validating and Drafting Updated Data: ", error);
        res.status(500).json({
            updatedData : {},
            validationResult : false,
            validationMessage : "Some error Occured while validating and Drafting Updated Data",
            error
        });
    }
};

module.exports = {
    validateAndDraftUpdatedData
};