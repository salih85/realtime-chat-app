require('dotenv').config();

const express = require('express')
const app =express()

const connectDB =require('./config/db')


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("server started at port",port);
  connectDB();
});
