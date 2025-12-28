const cloudinary = require('cloudinary').v2;

// configuring cloudinary with cloud name, api key and api secret to upload images
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET 
});

// exporting to use in admin controller for uploading product images
module.exports = cloudinary;