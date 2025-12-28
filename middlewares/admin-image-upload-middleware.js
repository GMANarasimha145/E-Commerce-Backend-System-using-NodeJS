const multer = require('multer');
const path = require('path');

// Below middleware is called before calling a controller that uploads image
// Defining local storage, location for images to be stored before uploading them to cloudinary
const storage = multer.diskStorage({
    destination : function(req, file, cb){
        cb(null, 'uploads/');
    },
    filename : function(req, file, cb){
        cb(null, file.fieldname+'-'+Date.now()+path.extname(file.originalname));
    }
});

// FileFileter checks whether uploaded file is image or not
const checkFileFilter = (req, file, cb)=>{
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    }
    else {
        cb(new Error("Uploaded File is not an Image, Please Upload Images only"));
    }
};

// Export by mentioning image size limit in bytes.
module.exports = multer({
    storage : storage,
    fileFilter : checkFileFilter,
    limits : {
        fileSize : 5*1024*1024
    }
});