const express = require('express');
const router = express.Router();
const Room = require("../models/room");
const authenticate = require ('../middleware/authenticate');
const verifyRole = require('../middleware/verifyrole');

router.use(verifyRole)

router.post('/add', authenticate,verifyRole,async (req, res) => {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try {
            const { name, capacity, equipment, availability } = req.body;

            // Validate if name is null
            if (!name, !capacity, !equipment, !availability) {
                return res.status(400).json({ error: 'champs is required' });
            }
            // Create a new room
            const newRoom = new Room({
                name,
                capacity,
                equipment,
                availability
            });
            // Save the room to the database
            await newRoom.save();
            res.status(201).json({ message: 'Room registered successfully' });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

//-creer un api pour lister tous les salles
router.get('/list', authenticate, async (req, res) => {
    try {
        // Fetch all rooms from the database
        const rooms = await Room.find();

        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//-creer un api pour lister une salle a traveres le parametre passer et un message not found s'il existe pas dans le tableau 
router.get('/get/:id', authenticate, async (req, res) => {
    try {
        const roomId = req.params.id;

        // Fetch the room from the database by ID
        const room = await Room.findById(roomId);

        if (!room) {
            // If room is not found return this msg
            return res.status(404).json({ message: 'room not found' });
        }

        res.status(200).json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//-creer un api pour modifier une salle avec un id specifique avec une verification (existe ou non )
router.put('/update/:id', authenticate,async (req, res) => {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try {
            const roomId = req.params.id;
            // Fetch the room from the database by ID
            const existingRoom = await Room.findById(roomId);
            
            if (!existingRoom) {
                return res.status(404).json({ message: 'Room not found' });
            }

            // Update the existing room 
            existingRoom.name = req.body.name;
            existingRoom.capacity = req.body.capacity;
            existingRoom.equipment = req.body.equipment; 
            existingRoom.availability = req.body.availability;
        
            // Save the updated room to the database
            const updatedRoom = await existingRoom.save();
            res.status(200).json({ message: 'Room updated successfully', updatedRoom });
        } 
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
}});

//-creer un api pour supprimer une voiture avec un id specifiue avec une verification avant le supprimer 
router.delete('/delete/:id', authenticate, verifyRole, async (req, res) => {
    if (req.userRole !== "ADMIN") {
        return res.status(403).json({ error: 'Unauthorized: Invalid role' });
    }
    else{
        try {
            const RoomId = req.params.id;
            // Fetch the room from the database by ID
            const existingRoom = await Room.findById(RoomId);
            if (!existingRoom) {
                return res.status(404).json({ message: 'Room not found' });
            }
            // Delete the existing room
            await existingRoom.deleteOne({_id: RoomId});
            res.status(200).json({ message: 'Room deleted successfully' });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

module.exports = router;