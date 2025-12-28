const EAllProduct = require("../models/EAllProduct");

const showProductsController = async(req, res)=>{  
    try {
        // retieving limit products per page, page number from request
        const limitCount = req.query.limitCount || await EAllProduct.countDocuments({});
        const pageNumber = req.query.pageNumber || 1;
        const productsToBeSkipped = (pageNumber-1) * limitCount;
        var priceOrderLowToHigh = (Number(req.query.priceOrderLowToHigh) === 1 ? 1 : -1);

        // retrieving products will are available
        const products = await EAllProduct.find({isDeleted : false}).sort({unitPrice : priceOrderLowToHigh}).skip(productsToBeSkipped).limit(limitCount).select("-_id -addedBy -isDeleted");

        
        if (products.length !== 0) {
            // return with Accepted status code and products details icluding count
            res.status(200).json({
                success : true,
                message : "Product Details Fetched Successfully",
                count : products.length,
                productsData : products
            });
        } else if (products.length === 0) {
            // if no products exists then return with Accepted Status codes
            res.status(200).json({
                success : true,
                message : "Products List is Empty"
            });
        }

    } catch(error){
        console.log("Some error occured while Fetching Products: ", error);
        res.status(500).json({
            success : false,
            message : "Some error occured while Fetching Products"
        });
    }

};

// exporting to use in user and admin routes
module.exports = {
    showProductsController
};