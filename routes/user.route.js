const express = require('express');
const router = express.Router();
const User = require("../models/user");
const authenticate = require('../middleware/authenticate');
const verifyRole = require('../middleware/verifyrole');

router.post('/add', authenticate, verifyRole,async (req,res)=> {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try{
            if (!username, !password, !email, !phoneNumber) {
            return res.status(400).json({ error: 'champs is required' });
            }
            const newUser = new User ({
                username,
                password,
                email,
                phoneNumber
            })
            await newUser.save();

            res.status(201).json({ message: 'User registered successfully' });
        }
        catch(error){
            console.error(error);
            res.status(500).json({error:'Internal Server Error'})
        }   
    }})

router.get('/list', authenticate, verifyRole,async (req,res)=> {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try {
            const users = await User.find();
    
            res.status(200).json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }

    }
})

router.get('/get/:id', authenticate, verifyRole,async (req,res)=> {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try {
            const userId = req.params.id;
    
            
            const user = await User.findById(userId);
    
            if (!user) {
                
                return res.status(404).json({ message: 'user not found' });
            }
    
            res.status(200).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

})

router.put('/update/:id', authenticate, verifyRole,async (req, res) => {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try {
            const userId = req.params.id;
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            } 
            
            existingUser.username = req.body.username;
            existingUser.password = req.body.password;
            existingUser.email = req.body.email; 
            existingUser.phoneNumber = req.body.phoneNumber;
        
        // Save the updated room to the database
            const updatedUser = await existingUser.save();
            res.status(200).json({ message: 'User updated successfully', updatedUser });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
})

router.delete('/delete/:id', authenticate, verifyRole, async (req, res) => {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try {
            const userId = req.params.id;
    
            
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            await existingUser.deleteOne({_id: userId});
    
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
})

module.exports = router;
