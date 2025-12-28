require('dotenv').config();
const express = require('express');
const connectDB = require('../database/db');
const adminRoutes = require('../routes/admin-routes');
const userRoutes = require('../routes/user-routes');
const commonRoutes = require('../routes/common-routes');

const app = express();

app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/common', commonRoutes);

connectDB();

app.listen(process.env.PORT, ()=>{
    console.log(`Server is now running at port ${process.env.PORT}`);
});