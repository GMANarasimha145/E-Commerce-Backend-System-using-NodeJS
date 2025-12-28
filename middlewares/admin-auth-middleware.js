const jsonwebtoken = require('jsonwebtoken');

// Middleware called before executing controller, to check admin is logged in or not to perform any operations
const adminAuthMiddleware = async (req, res, next)=>{
    try {
        // retrieve bearer token from request, it is created when admin login
        const bearerTokenText = req.headers['authorization'];
    
        // it returns in form of 'bearer tokenstring', so split with single space and retrieve element at first index
        const bearerToken = bearerTokenText && bearerTokenText.split(' ')[1];

        // if there is no bearer token means admin didn't logged in return with Unauthorized status ode
        if (!bearerToken) {
            return res.status(401).json({
                success : false,
                message : 'Admin Rights to Access the Page'
            });
        }

        // if token exists, decode to get the admin details like id, username, email, then use next() call the controller or next middleware
        const decodedBearerToken = jsonwebtoken.verify(bearerToken, process.env.JWT_SECRET_KEY);
        req.loggedInAdminDetails = decodedBearerToken;
        next();
    
    } catch(error) {
        console.log("Some error occured in auth-middleware: ", error);
        res.status(401).json({
            success : fase,
            message : "Some error occured in auth-middleware",
            error
        });
    }
};

module.exports = adminAuthMiddleware;