const express= require('express');
const bodyParser=require("body-parser")
const RoomRoute= require("./routes/room.js")
const AuthRoute= require("./routes/auth.js")

const dotenv=require('dotenv');
const mongoose=require('mongoose');

const app=express()

//configuration lel file env
//thel config bch yaaref mnin bch yjib config mteeou
dotenv.config()
const MONGODB_URI= process.env.MONGODB_URI
const PORT = process.env.PORT || 5000

//pour forcer la partie body ml req c'est middleware pour focer body bch yodher
app.use(bodyParser.json());

app.use("/room", RoomRoute);
app.use("/auth", AuthRoute)

mongoose.connect(MONGODB_URI).then(()=>{
    console.log('connected to the database');
    app.listen(PORT,()=>{console.log(`Server is running on port ${PORT}`);})
}).catch(err=>{console.log(err);})