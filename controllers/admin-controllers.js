const bcryptjs = require('bcryptjs');
const validator = require('validator');
const jsonwebtoken = require('jsonwebtoken');
const EAllAdmin = require('../models/EAllAdmin');
const EAllProduct = require('../models/EAllProduct');
const { validateAdminDetails } = require('../helpers/validate-admin-details-helper');
const { validateProductDetails } = require('../helpers/validate-product-details-helper');
const { uploadImageToCloudinary } = require('../helpers/admin-upload-image-helper');
const { validateAndDraftUpdatedData } = require('../helpers/validate-and-draft-updated-data-helper');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');


// Controller to register admin
const registerAdminController = async(req, res)=>{
    try {
        // validating admin details before storing
        const { validationResult, validationMessage } = validateAdminDetails(req.body);

        // if data is invalid, then returning with bad request status code
        if (!validationResult) {
            return res.status(400).json({
                success : false,
                message : validationMessage
            });
        }

        // unwrapping username, email, password from request body
        const {username, email, password} = req.body;
        const checkExistingDetails = await EAllAdmin.findOne({$or:[{username}, {email}]});

        // If admin already exists with same details, return with Conflict status code
        if (checkExistingDetails) {
            return res.status(409).json({
                success : false,
                message : "Admin with same username or email already exists"
            });
        }

        // hash the  password to encrypt and store in mongoDB
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = bcryptjs.hash(password, salt);

        req.body.password = (await hashedPassword).toString();

        // Registering admin by writing details to admin
        const newAdmin = new EAllAdmin(req.body);
        await newAdmin.save();

        // returning with accepted status code when admin registered successfully
        if (newAdmin) {
            return res.status(201).json({
                success : true,
                message : 'Admin Registered Successfully',
                password,
                newAdmin
            });
        }

        res.status(500).json({
            success : false,
            message : 'Unable to Register Admin, Please try again later'
        });
        

    } catch(error) {
        console.log('An Error Occured in Catch block while registering New Admin: ', error);
        res.status(500).json({
            success : false,
            message : 'An Error Occured in Catch block while registering New Admin',
            error : error
        });
    }

};

// Controller to login admin and create JWT Token to use for authorization
const loginAdminController = async(req, res)=>{
    try {
        // unwrapping admin credentials from request body
        const { username, password } = req.body;

        // validating the credentials
        if (validator.isEmpty(username) || validator.isEmpty(password)) {
            return res.status(406).json({
                success : false,
                message : "Username and Password fields should not be empty"
            });
        }

        // Checking whether user with mentioned username already exists or not
        const adminDetails = await EAllAdmin.findOne({username});
        if (!adminDetails) {
            return res.status(404).json({
                success : false,
                message : "Admin with entered username does not exists!"
            });
        }

        // if username exists, then we check password is matched with stored encrypted password by comparing entered password with stored password (encrypted)
        const passwordMatched = await bcryptjs.compare(password, adminDetails.password);
        if (!passwordMatched) {
            return res.status(401).json({
                success : false,
                message : "Incorrect Password!"
            });
        }

        // After successful login, creating a token for admin user which is valid for 30 minutes, it is used for authorization while performing operatios like uploading, deleting, updating product
        const adminLoginToken = jsonwebtoken.sign({
           adminId : adminDetails._id,
           adminUsername : adminDetails.username,
           adminEmail : adminDetails.email, 
           adminIsActive : adminDetails.isActive
        },process.env.JWT_SECRET_KEY, {
            expiresIn:'30m'
        });

        // Returning with Accepted status code when admin succesfully login
        res.status(200).json({
            success : true,
            message : "Admin Logged in Successfully",
            adminLoginToken,
            adminDetails

        });

    } catch(error) {
        console.log('An Error Occured in Catch block while Logging in as Admin: ', error);
        res.status(500).json({
            success : false,
            message : 'An Error Occured in Catch block while Logging in as Admin',
            error : error
        });
    }
};

// Controller to Upload Product details
const adminProductUploadController = async(req, res)=>{
    try {
        // storing product details in an object
        const productDetails = {
            name : req.body.name,
            category : req.body.category,
            unitPrice : Number(req.body.unitPrice),
            availableStock : Number(req.body.availableStock)
        }
        
        // validating product details, if not valid, returning with Bad Request status code
        const {validationResult, validationMessage} = validateProductDetails(productDetails);
        if (!validationResult) {
            return res.status(400).json({
                success : false,
                message : validationMessage
            });
        }

        // Checking whether Image File is attached along with other details, if not, returning with Bad Request Status Code
        if (!req.file) {
            return res.status(400).json({
                success : false,
                message : "File Path of Product Image is Required!"
            });
        }

        // Check whether product already exists or not with product name, which is unique
        const productAlreadyExists = await EAllProduct.findOne({
            name : productDetails.name
        });

        // If product Already exists return with Conflict status code
        if (productAlreadyExists){
            return res.status(409).json({
                success : false,
                message : "Product Already Exists"
            });
        }

        // uploading to cloudinary cloud, and getting imageURL used to display, publicId(Unique identifier for image in cloudinary cloud) which identifies the image in cloud
        // imageURL, publicId is stored with product details
        const {imageURL, publicId} = await uploadImageToCloudinary(req.file.path);

        // Writing details to mongoDB
        const newproductEntry = new EAllProduct({
            productImageURL : imageURL,
            productImagePublicId : publicId,
            name: productDetails.name,
            category : productDetails.category,
            unitPrice : productDetails.unitPrice,
            availableStock : productDetails.availableStock,
            addedBy : req.loggedInAdminDetails.adminId
        });

        await newproductEntry.save();

        console.log("Path at end of adminProductUploadController: ", req.file.path);
        // Before uploading to cloudinary cloud, the image is stored in local storage in /uploads folder, after successful upload it is deleted form local storage
        fs.unlinkSync(req.file.path);

        // After product entry was successful, retrning with Accepted status code
        res.status(200).json({
            success : true,
            message : "Product Entry Successful",
            newproductEntry
        });


    } catch(error){
        console.log("Some error occured while uploading Product Image: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while uploading Product Image",
            error
        });
    }
};

// Controller to delete image from Cloudinary
const adminProductDeleteController = async(req, res)=>{
    try {
        // retrieving product Id from Request
        const productId = req.params.id;

        // Check whether products exists in the database
        const productExists = await EAllProduct.findById(productId);

        // If not exists, returning with Not Found status code
        if (!productExists) {
            return res.status(404).json({
                success : false,
                message : "Product Not Found!"
            });
        }

        // checking whether the image to be deleted is uploaded by current logged in admin
        if (req.loggedInAdminDetails.adminId !== (productExists.addedBy).toString()) {
            return res.status(403).json({
                success : false,
                message : "Product is Uploaded by Other admin, You're not Authorised to delete this Product"
            });
        } 
        
        // checking whether product is soft deleted already
        if (productExists.isDeleted) {
            return res.status(410).json({
                success : false,
                message : "Product is already Deleted"
            });
        }

        // making the product soft delete, because may the product is ordered previously
        await EAllProduct.findByIdAndUpdate(productId , {
            isDeleted : true,
            deletedAt : Date.now()
        });

        // after soft delete returning with Accepted status code
        res.status(200).json({
            success : true,
            message : "Product Deleted Successfully"
        });

    } catch(error){
        console.log("Some error occured while deleting product: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while deleting product",
            error
        });
    }
};

// Controller to update existing product details
const adminProductUpdateController = async(req, res)=>{
    try {
        // retireving product Id from Request
        const productId = req.params.id;

        // checking whether product already exists or not
        const productExists = await EAllProduct.findById(productId);
        if (!productExists) {
            return res.status(404).json({
                success : false,
                message : "Product Not Found!"
            });
        }

        // check whether image to be updated is uploaded by current logged in user
        if (req.loggedInAdminDetails.adminId !== (productExists.addedBy).toString()) {
            return res.status(403).json({
                success : false,
                message : "Product is Uploaded by Other admin, You're not Authorised to update this Product"
            });
        } 
        
        // checking whether the product is soft deleted or not
        if (productExists.isDeleted) {
            return res.status(410).json({
                success : false,
                message : "Product is already Deleted, Unable to Update this product"
            });
        }
        
        // validating details to be udpated, as data should be consistent even while updating, drafting updated data which contains details that should be updated
        const {updatedData, validationResult, validationMessage} = await validateAndDraftUpdatedData(req.body, req.file);
        if (!validationResult) {
            return res.status(400).json({
                success : false,
                message : "Message is: "+validationMessage
            });
        }

        // Updating the details
        const updationResult = await EAllProduct.findByIdAndUpdate(productId , updatedData, {
            new : true
        });
        
        // If updation failed returning with Internal Server Error Status Code
        if (!updationResult) {
            return res.status(500).json({
                success : false,
                message : "Unable to update, Please try again later"
            });
        }

        // If updation was successful then return with Accepted status code
        res.status(200).json({
            success : true,
            message : "Product details Updated Successfully"
        });

        // After successful updation we need to remove the previous image of product, as new image is already uploaded and imageURL, publicId are also updated
        if (updationResult) {
            await cloudinary.uploader.destroy(productExists.productImagePublicId);
            if (req.file)
                console.log("Path at end of adminProductUpdateController: ", req.file.path);
                fs.unlinkSync(req.file.path);
        }

    } catch(error){
        console.log("Some error occured while updating product details: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while updating product details",
            error
        });
    }
};

// Exporting above controllers to use them in routes
module.exports = {
    registerAdminController,
    loginAdminController,
    adminProductUploadController,
    adminProductDeleteController,
    adminProductUpdateController
};