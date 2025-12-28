const mongoose = require('mongoose');

const connectDB = ()=>{
    try {
        // connecting to mongoDB localhost server with mongo URI exists in .env file 
        mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Successfully');
    } catch(error) {
        console.log("An Error Occured while Connecting to MongoDB: ", error);
        process.exit(1);
    }
};

// exporting it and call it from server.js
module.exports = connectDB;