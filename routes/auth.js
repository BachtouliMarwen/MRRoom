const express=require('express');
const User = require('../models/user')
const bcrypt =require('bcrypt')
const jwt= require("jsonwebtoken")
//hajetna ken module router
const router=express.Router();

router.post("/login", async (req, res)=>{
    try{
        const {username, password} = req.body;

        const user = await User.findOne({ username });

        if(!user){
            return res.status(401).send("User not found");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid){
            return res.status(401).send("Invalid password");
        }

        //siganture , id le premier donnee c'est quoi le data qu'on va crypter
    const token = jwt.sign({_id : user._id},process.env.JWT_SECRET)
      // send a success message
    res.status(200).send({token:token});
    }
    catch(error){
        console.error('Error during login:', error);
        res.status(500).send(error.message);
    }
});

router.post("/register", async (req,res) => {
    try {
        const {username, password, email, phoneNumber} = req.body;

        const newUser = new User({
            username,
            password,
            email,
            phoneNumber,
        });
        console.log("data", newUser);

        await newUser.save();
        res.status(201).send('User registered successfully');
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error.message );
    }
})

module.exports=router;