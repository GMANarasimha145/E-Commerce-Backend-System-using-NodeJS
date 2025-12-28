const bcryptjs = require('bcryptjs');
const validator = require('validator');
const jsonwebtoken = require('jsonwebtoken');
const EAllUser = require('../models/EAllUser');
const EAllAdmin = require('../models/EAllAdmin');
const { validateUserDetails } = require('../helpers/validate-user-details-helper');
const EAllProduct = require('../models/EAllProduct');
const {validateUserOrderDetails} = require('../helpers/validate-user-order-details');
const EAllOrder = require('../models/EAllOrder');
const {sendMail} = require('../helpers/send-mail');
const {orderConfirmationTemplate} = require('../helpers/draft-mail-template-helper');
const {outOfStockTemplate} = require('../helpers/draft-out-of-stock-mail-template');
const {adminOrderMailTemplate} = require('../helpers/draft-order-details-to-admin-template');
const generateRazorpaySignature = require('../helpers/generate-razorpay-signature');
const razorpayInstance = require('../config/razorpay');
const readline = require("readline");
const crypto = require('crypto');
const EAllCartItem = require('../models/EAllCartItem');

// funcion which reads input from console and returning with resolve with entered input as data
const askQuestion = (rl, question) => {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer);
        });
    });
};

// Controller to Register User with Valid Details
const registerUserController = async(req, res)=>{
    try {
        // validate user details and receiving status
        const { validationResult, validationMessage } = validateUserDetails(req.body);

        // returning with bad request status code when data is invalid
        if (!validationResult) {
            return res.status(400).json({
                success : false,
                message : validationMessage
            });
        }

        // Checking whether user already exists with same username or email
        const {username, email, password} = req.body;
        const checkExistingDetails = await EAllUser.findOne({$or:[{username}, {email}]});

        // If User exists we are returning with conflict status code
        if (checkExistingDetails) {
            return res.status(409).json({
                success : false,
                message : "User with same username or email already exists"
            });
        }

        // hash the entered user password with bcryptjs
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = bcryptjs.hash(password, salt);

        // adding hashed password to request body
        req.body.password = (await hashedPassword).toString();

        // passing user details json to EAllUser model and saving
        const newUser = new EAllUser(req.body);
        await newUser.save();

        // if details stored in mongoDB, returning with Created status code
        if (newUser) {
            return res.status(201).json({
                success : true,
                message : 'User Registered Successfully',
                password,
                newUser
            });
        }

        res.status(500).json({
            success : false,
            message : 'Unable to Register User, Please try again later'
        });
        

    } catch(error) {
        console.log('An Error Occured in Catch block while registering New User: ', error);
        res.status(500).json({
            success : false,
            message : 'An Error Occured in Catch block while registering New User',
            error : error
        });
    }

};

// Controllers to login user and create jwt token for authorization
const loginUserController = async(req, res)=>{
    try {
        // unwrapping user credentials from request body
        const { username, password } = req.body;

        // validating credentials 
        if (validator.isEmpty(username) || validator.isEmpty(password)) {
            return res.status(400).json({
                success : false,
                message : "Username and Password fields should not be empty"
            });
        }

        // checking whether user with provided username already exists or not
        const userDetails = await EAllUser.findOne({username});
        if (!userDetails) {
            return res.status(404).json({
                success : false,
                message : "User with entered username does not exists!"
            });
        }

        // after ensuring username existence, checking whether entered password in credentials is matched with encrypted password stored in mongoDB
        const passwordMatched = await bcryptjs.compare(password, userDetails.password);
        if (!passwordMatched) {
            return res.status(401).json({
                success : false,
                message : "Incorrect Password!"
            });
        }

        // after password matched, creating a jwt token to authorize user while performing various indirect DB Operations like ordering a product
        // token will expire in 30 minutes
        const userLoginToken = jsonwebtoken.sign({
           userId : userDetails._id,
           userUsername : userDetails.username,
           userEmail : userDetails.email, 
           userIsActive : userDetails.isActive
        },process.env.JWT_SECRET_KEY, {
            expiresIn:'30m'
        });

        // after successful login, accepted status code is passed with jwt token and user details
        res.status(200).json({
            success : true,
            message : "User Logged in Successfully",
            userLoginToken,
            userDetails

        });

    } catch(error) {
        console.log('An Error Occured in Catch block while Logging in as User: ', error);
        res.status(500).json({
            success : false,
            message : 'An Error Occured in Catch block while Logging in as User',
            error : error
        });
    }
};

// controller for user order creation
const userOrderEntry = async(req, res)=>{
    try {
        // retrieve product id of product which user wants to order
        const requestedProductId = req.params.id;

        // checking whether product exists in the database
        const checkProductExists = await EAllProduct.findById(requestedProductId);

        // return with Not Found status code if product is not there
        if (!checkProductExists){
            return res.status(404).json({
                success : false,
                message : "Product Not Exists"
            });
        }

        // check product is disabled or not, if yes, return with Gone status code
        if (checkProductExists.isDeleted) {
            return res.status(410).json({
                success : false,
                message : "Sorry, Requested Product is Currently Not Available"
            });
        }

        // validating the address and quantity details provided by user to make order
        const {validationResult, validationMessage} = validateUserOrderDetails(req.body);

        // if invalid, returning with Bad Request status code
        if (!validationResult) {
            return res.status(400).json({
                success : false,
                message : validationMessage
            });
        }

        // Checking required quanity exists or not in the database, if not returning with Conflict status code
        const quantityNumber = Number(req.body.quantity);
        if (checkProductExists.availableStock<quantityNumber) {
            return res.status(409).json({
                success : false,
                message : "Sorry Requierd Quantity is Currently Not Available"
            });
        }

        // Validating payment type selection, in this backend application only two options are provided to as of now
        if (req.body.paymentType !== "Cash On Delivery" && req.body.paymentType !== "Pay through Credit/Debit/UPI"){
            return res.status(400).json({
                success : false,
                message : "Invalid Paymnet Type, it should be either 1. Cash On Delivery or 2. Pay through Credit/Debit/UPI"
            });
        }

        // storing remaining quantity, which is used to decided whether to send Out of Stock mail to Admin or not
        const remainingQuantity = checkProductExists.availableStock - quantityNumber;

        // Storing order details in to variables whose variables gonna match with mongoDB Collection's attributes
        const productId = requestedProductId;
        const orderPlacedAt = Date.now();
        const orderedBy = req.loggedInUserDetails.userId;
        const shipTo = `${req.loggedInUserDetails.userUsername}\n${req.body.mobileNumber}\n${req.body.flatBuildingHouseNum}\n${req.body.areaStreet}, ${req.body.landmark}\n${req.body.townCity}, ${req.body.cityState}, ${req.body.pincode}\n${req.body.countryOrRegion}`;
        const quantity = quantityNumber;
        const total = quantityNumber * checkProductExists.unitPrice;
        const paymentType = req.body.paymentType;
        var paymentStatus = (paymentType==="Cash On Delivery")?"Pending with COD":"Pending";

        // User not willing for COD, Gonna handle Payment with Razorpay Working Mechanism
        // I'm not directly using Razorpay, because Razorpay frontend checkout page is mandatory to get order_id, payment_id, signature in to my Backend Code
        // So, I generated Order Id by creating order in Razorpay, used sample payment_id, and using signature which manually created through razorpay mechanism through Hmac
        // Usually this payment works like below steps:
        // 1. After Clicking pay button, Then backend code will create order in Razorpay, then razorpay returns order_id, This order_id is passed to frontend
        // 2. Then Frontend displays the Razorpay Checkout Page (having amount to be paid, currency, merchant details) with help of order_id, Then User performs Payment, if Payment was Successful, then order_id, payment_id and signature will be generated by razorpay checkout page
        // 3. These Two ID and Signature passed from Razorpay checkout to Frontend, and from Frontedn to Backend these Two ID and Signature are passed
        // 4. If Payment was Unsuccess then these Two ID and Signature was not generated
        // 5. In the backend, if the Two ID and Signature are undefined that represents payment was unsuccess
        // 6. In case of payment success, then payment will be validated by generating a signature with Hmac function along with razorpay api secret, and payment_id
        // 7. Then one signature passed from frontend and another signature generated in previous step using payment_id we got from frontend
        // 8. If those two signatures are matched, we change Payment Status from Pending to Paid
        if (paymentStatus === "Pending") {
            const options = {
                amount : Math.round(total*100),
                currency : "INR",
                receipt : `receipt_${Date.now()}`
            };

            // create order in razorpay and getting order_id from that created order
            const order = await razorpayInstance.orders.create(options);
            const orderId = (order.id).toString();

            // generating signature manually
            const razorpaySignature = generateRazorpaySignature(orderId, process.env.RAZORPAY_TEST_PAYMENT_ID);
            
            // creating readline interface to read input from console
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            // Logging Signature and IDs to console, just to think like received from frontend
            console.log("Razorpay Order: ", order);
            console.log("====================================");
            console.log("Razorpay Order Id: ", order.id);
            console.log("Razorpay Payment Id: ", process.env.RAZORPAY_TEST_PAYMENT_ID);
            console.log("Razorpay Signature: ", razorpaySignature);
            console.log("====================================");

            // Simulating reading those IDs from frontend, but got from console input
            console.log("🚀 Razorpay Test Simulation Started");
            const inputOrderId = await askQuestion(rl, "Enter Razorpay Order ID: ");
            const inputPaymentId = await askQuestion(rl, "Enter Razorpay Payment ID: ");
            /*
            rl.question("Enter Razorpay Order ID: ", (oId) => {
            inputOrderId = oId;

                rl.question("Enter Razorpay Payment ID: ", (pId) => {
                    inputPaymentId = pId;
                    
                    rl.close();
                });
            });
            */

            // Generated Signture with received payment Id and order id
            const body = inputOrderId + "|" + inputPaymentId;
            var expectedRazorpaySignature = crypto
                    .createHmac('sha256', process.env.RAZORPAY_TEST_KEY_SECRET)
                    .update(body)
                    .digest('hex');

            expectedRazorpaySignature = expectedRazorpaySignature.toString(); 

            // comparing signatures and defining payment status
            if (razorpaySignature !== expectedRazorpaySignature ) {
                return res.status(402).json({
                    success : false,
                    message : "Payment failed at the signature verification"
                });
            } else {
                paymentStatus = "Paid via Card";
            }
                      
        }
        
        // saving order details to mongoDB
        const orderPlaced = new EAllOrder({
            productId,
            orderPlacedAt,
            orderedBy,
            shipTo,
            quantity,
            total,
            paymentType,
            paymentStatus
        });

        await orderPlaced.save();

        // If order not stored in mongoDB, returning with Internal Server Error status code
        if (!orderPlaced) {
            return res.status(500).json({
                success : false,
                message : "Unable to Place the Order, Please try later"
            });
        }

        // After creating order, updating the available stock count in collection
        await EAllProduct.findByIdAndUpdate(productId, {
            availableStock : remainingQuantity
        });

        // Collecting details to send mail to Admin regarding Out of Stock
        const productAddedAdminId = checkProductExists.addedBy;
        const productAddedAdminDetails = await EAllAdmin.findById(productAddedAdminId);

        // Collecting details to create a Mail Template, which can be sent to User about Order Confirmation
        var userOrderConfirmMailTemplateData = {};
        userOrderConfirmMailTemplateData.username = req.loggedInUserDetails.userUsername;
        userOrderConfirmMailTemplateData.orderId = orderPlaced._id;
        userOrderConfirmMailTemplateData.productName = checkProductExists.name;
        userOrderConfirmMailTemplateData.quantity = orderPlaced.quantity;
        userOrderConfirmMailTemplateData.total = orderPlaced.total;

        var userOrderConfirmFromTo = {};
        userOrderConfirmFromTo.to = req.loggedInUserDetails.userEmail;
        userOrderConfirmFromTo.subject = "Order Confirmatioin - ECommerce";
        userOrderConfirmFromTo.html = orderConfirmationTemplate(userOrderConfirmMailTemplateData);
        sendMail(userOrderConfirmFromTo);
        
        // Collecting details to create a Mail Template, which can be sent to Admin about Shipment and Order Details
        var adminOrderMailTemplateData = {};
        adminOrderMailTemplateData.productId = productId;
        adminOrderMailTemplateData.orderPlacedAt = orderPlacedAt;
        adminOrderMailTemplateData.orderedBy = req.loggedInUserDetails.userUsername;
        adminOrderMailTemplateData.shipTo = shipTo;
        adminOrderMailTemplateData.quantity = quantity;

        var adminOrderDetailsFromTo = {};
        adminOrderDetailsFromTo.to = productAddedAdminDetails.email;
        adminOrderDetailsFromTo.subject = "Order and Shipment Details - Ecommerce";
        adminOrderDetailsFromTo.html = adminOrderMailTemplate(adminOrderMailTemplateData);
        sendMail(adminOrderDetailsFromTo);

        // returning with Created status code after order created in mongoDB
        res.status(201).json({
            success : true,
            message : "Order Placed Successfully",
            orderDetails : orderPlaced
        });

        // Collecting details to create a Mail Template, which can be sent to Admin regarding Out of Stock
        if (remainingQuantity === 0) {
            const productName = checkProductExists.name;
            const productId = checkProductExists._id;
            const productImageURL = checkProductExists.productImageURL;
            
            var outOfStockData = {};
            outOfStockData.productName = productName;
            outOfStockData.productId = productId;
            outOfStockData.productImageURL = productImageURL;

            var outOfStockFromTo = {};
            outOfStockFromTo.to = productAddedAdminDetails.email;
            outOfStockFromTo.subject = "Product Out of Stock - ECommerce";
            outOfStockFromTo.html = outOfStockTemplate(outOfStockData);
            sendMail(outOfStockFromTo);

        }


    } catch (error) {
        console.log("Some error occured while adding User Order: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while adding User Order",
            error
        });
    }
};

// Controller to add user review to the product ordered 
const userReviewRateProduct = async(req, res)=>{
    try {
        // retrieving productId from request, to which review and rating would be given
        const productId = req.params.id;

        // validating rating, whether it is number or character
        const ratingNumber = Number(req.body.rating);
        if (Number.isNaN(ratingNumber) || (ratingNumber<0 ||ratingNumber>5)) {
            return res.status(400).json({
                success : false,
                message : "Rating should not be character, Only Number between 0 to 5 including both are allowed"
            });
        }

        // returning with bad request status code when review is empty
        if (!req.body.review) {
            return res.status(400).json({
                success : false,
                message : "Review should not be empty"
            });
        }

        // returning with 404 not found when product is not the one ordered
        var productforReviewRating = await EAllProduct.findById(productId);
        if (!productforReviewRating) {
            return res.status(404).json({
                success : false,
                message : "Product Does not Exists!"
            });
        }

        // checking whether the product is ordered by current logged in user, then only review and rating will be taken
        var userOrderedCheck = await EAllOrder.find({orderedBy : req.loggedInUserDetails.userId}).select('orderedBy');
        if (!userOrderedCheck) {
            return res.status(403).json({
                success : false,
                message : "User who purchased the product only provide review and rating!"
            });
        }

        // checking whether the product is disabled or not
        if (productforReviewRating.isDeleted === true) {
            return res.status(410).json({
                success : false,
                message : "Product is Not Available Currently!"
            });
        }

        // calculating average rating and also formatting review with username
        const reviewsCount = productforReviewRating.reviews.length + 1;
        productforReviewRating.reviews.push(req.body.review +` - @${req.loggedInUserDetails.userUsername}`);
        productforReviewRating.rating = ratingNumber/reviewsCount;
        await productforReviewRating.save();

        // returning with Accepted status code when review rating is submitted successfully
        res.status(200).json({
            success : true,
            message : "Review and Rating Submitted Succcessfully"
        });

    } catch(error) {
        console.log("Some error occured while submitting review and rating: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while submitting review and rating"
        });
    }
};

// Controller to retrieve user orders
const fetchUserOrders = async(req, res)=>{
    try {
        // fetch details with help of Object Id(_id) of user
        const userOrderDetails = await EAllOrder.find({orderedBy : req.loggedInUserDetails.userId});
        if (userOrderDetails === 0) {
            return res.status(404).json({
                success : false,
                message : "No Orders Placed"
            });
        }

        // returning with Accepted status code when orders fetched successfully
        res.status(200).json({
            success : true,
            message : "Orders Fetched Successfully",
            count : userOrderDetails.length,
            ordersDetails : userOrderDetails
        });

    } catch(error){
        console.log("Some error occured while fetching User Orders: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while fetching User Orders",
            error
        });
    }
};

// Controller to add Items to Cart
const addToCartController = async(req, res)=>{
    try {
        // retrieving product Id from request
        const productId = req.params.id;

        // check whether product exists or not
        const checkProductExists = await EAllProduct.findById(productId);
        if (!checkProductExists || checkProductExists.isDeleted) {
            return res.status(404).json({
                success : false,
                message : "Product Not Found"
            });
        }

        // retrieve quantity to be added to the cart if provided only 1 will be added
        var quantityNumber = Number(req.body.quantity) || 1;
        if (Number.isNaN(quantityNumber)) {
            return res.status(400).json({
                success : false,
                message : "Quantity should be numbers only"
            });
        }
        quantityNumber = parseInt(quantityNumber);

        // ensuring quantity is only positive integer
        if (quantityNumber<=0) {
            return res.status(400).json({
                success : false,
                message : "Quantity should not be negative numbers"
            });
        }

        // Checking whether cart item is already added to the cart, if already exists increase the quantity or add the item to cart
        const checkCartItemExists = await EAllCartItem.findOne({productId:productId, addedBy:(req.loggedInUserDetails.userId).toString()});
        if (checkCartItemExists) {
            checkCartItemExists.quantity = checkCartItemExists.quantity+quantityNumber;
            await checkCartItemExists.save();
            return res.status(200).json({
                success : true,
                message : "Quantity increased for existing Cart Item"
            });
        }

        // add the item to the cart with quantity 1, when it is not in the cart
        const addedToCart = new EAllCartItem({
            quantity : quantityNumber,
            productId : productId,
            addedBy : req.loggedInUserDetails.userId
        });

        await addedToCart.save();

        if (addedToCart) {
            res.status(201).json({
                success : true,
                message : "Product Added to the Cart Successfully",
                productAddedToCart : addedToCart
            });
        }

    } catch(error) {
        console.log("Some error occured while adding to cart: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while adding to cart"
        });
    }
};

// Controller to reduce quantity of items in cart
const reduceOneQuantity = async(req, res)=>{
    try {
        // retrieving product id from request
        const productId = req.params.id;

        // check whether product exists or not
        const checkProductExists = await EAllProduct.findById(productId);
        if (!checkProductExists || checkProductExists.isDeleted) {
            res.status(404).json({
                success : false,
                message : "Product Not Found"
            });
        }

        // check whether the item already exists in the cart or not
        const checkCartItemExists = await EAllCartItem.findOne({productId:productId, addedBy:(req.loggedInUserDetails.userId).toString()});
        if (!checkCartItemExists) {
            return res.status(404).json({
                success : false,
                message : "There are no Items in Cart"
            });
        }

        // read exisitng quantity from existing cart item matched with product id
        var existingQuantity = checkCartItemExists.quantity;

        // if quantity is reduced from 1, it will be 0 right, the item will be removed from the cart
        if (existingQuantity===1) {
            const cartItemDelted = await EAllCartItem.findByIdAndDelete(checkCartItemExists._id);
            if (cartItemDelted) {
                return res.status(200).json({
                    success : true,
                    message : "Cart Item Reduced and Deleted"
                });
            }
        } else {
            // if existing quantity is greater than 1 then quantity should be decremented with -1
            checkCartItemExists.quantity = checkCartItemExists.quantity - 1;
            await checkCartItemExists.save();
        }
        res.status(200).json({
            success : true,
            message : "Cart Item Reduced"
        });


    } catch(error) {
        console.log("Some error occured while removing one quantity from Cart: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while removing one quantity from Cart"
        });
    }
};

// Controller to delete item from the cart
const deleteFromCart = async(req, res)=>{
    try {
        // retrieving product id from request
        const productId = req.params.id;

        // checking whether product is exists or not
        const checkProductExists = await EAllProduct.findById(productId);
        if (!checkProductExists || checkProductExists.isDeleted) {
            res.status(404).json({
                success : false,
                message : "Product Not Found"
            });
        }

        // checking whether item exists in the cart or not
        const checkCartItemExists = await EAllCartItem.findOne({productId:productId, addedBy:(req.loggedInUserDetails.userId).toString()});
        if (!checkCartItemExists) {
            return res.status(404).json({
                success : false,
                message : "There are no Items in Cart"
            });
        }

        // deleting item from the cart with help of Object Id (_id)
        const deletedItem = await EAllCartItem.findByIdAndDelete(checkCartItemExists._id);
        if (!deletedItem) {
            res.status(500).json({
                success : false,
                message : "Unable to remove from cart, Please try again later"
            });
        }

        res.status(200).json({
            success : true,
            message : "Item deleted from the Cart Successfully"
        });

    } catch (error) {
        console.log("Some error occured while deleting item from cart: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while deleting item from cart",
            error
        });
    }
};

// Exporting above controllers to use in routes
module.exports = {
    registerUserController,
    loginUserController,
    userOrderEntry,
    userReviewRateProduct,
    fetchUserOrders,
    addToCartController,
    reduceOneQuantity,
    deleteFromCart
};