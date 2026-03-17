const mongoose =require('mongoose');
 async function connectDB(){
    try {
        await mongoose.connect(process.env.DB_URL,)
        console.log('db connected');
    } catch(e) {
        console.log('error')
        console.log(e)
    }
 }

 module.exports=connectDB;