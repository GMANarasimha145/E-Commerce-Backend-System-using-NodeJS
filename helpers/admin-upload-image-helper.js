const cloudinary = require('../config/cloudinary');

// function receives file path and upload it to cloudinary
const uploadImageToCloudinary = async(filePath)=>{
    try {
        // uploading image to cloudinary by sending file path as paramter
        const imageUploaded = await cloudinary.uploader.upload(filePath);
        
        // retrieving imageURL and publicId from cloudinary after uploading
        return {
            imageURL : imageUploaded.secure_url,
            publicId : imageUploaded.public_id
        };

    } catch(error) {
        console.log("An error occured while uploading Product Image: ", error);
    }
};

// exporting it to use in admin controllers
module.exports = {
    uploadImageToCloudinary
};