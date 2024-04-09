const express = require('express');
const moment = require('moment')
const momentTimezone = require('moment-timezone')
const router = express.Router();
const Room = require("../models/room");
const authenticate = require ('../middleware/authenticate');
const verifyRole = require('../middleware/verifyrole');

router.use(verifyRole)

const dateAEST = date => {
    return momentTimezone(date).tz('Africa/Tunis')
}
// Function to calculate the duration of the hours between the start and end of the booking
const durationHours = (bookingStart, bookingEnd) => {
    // convert the UTC Date objects to Moment.js objeccts
    let startDateLocal = dateAEST(bookingStart)
    let endDateLocal = dateAEST(bookingEnd)
    // calculate the duration of the difference between the two times
    let difference = moment.duration(endDateLocal.diff(startDateLocal))
    // return the difference in decimal format
    return difference.hours() + difference.minutes() / 60
}

// Make a booking
router.put('/booking/:id', authenticate, (req, res) => {
    const { id } = req.params
  
    // If the recurring array is empty, the booking is not recurring
    if (req.body.recurring.length === 0) {
      Room.findByIdAndUpdate(
        id,
        {
          $addToSet: {
            bookings: {
              user: req.user,
              // The hour on which the booking starts, calculated from 12:00AM as time = 0
              startHour: dateAEST(req.body.bookingStart).format('H.mm'),
              // The duration of the booking in decimal format
              duration: durationHours(req.body.bookingStart, req.body.bookingEnd),
              // Spread operator for remaining attributes
              ...req.body
            }
          }
        },
        { new: true, runValidators: true, context: 'query' }
      )
        .then(room => {
          res.status(201).json(room)
        })
        .catch(error => {
          res.status(400).json({ error })
        })
  
    // If the booking is a recurring booking
    } else {
      
      // The first booking in the recurring booking range
      let firstBooking = req.body
      firstBooking.user = req.user    
      firstBooking.startHour = dateAEST(req.body.bookingStart).format('H.mm')
      firstBooking.duration = durationHours(req.body.bookingStart, req.body.bookingEnd)
      
      // An array containing the first booking, to which all additional bookings in the recurring range will be added
      let recurringBookings = [ firstBooking ]
      
      // A Moment.js object to track each date in the recurring range, initialised with the first date
      let bookingDateTracker = momentTimezone(firstBooking.bookingStart).tz('Africa/Tunis')
      
      // A Moment.js date object for the final booking date in the recurring booking range - set to one hour ahead of the first booking - to calculate the number of days/weeks/months between the first and last bookings when rounded down
      let lastBookingDate = momentTimezone(firstBooking.recurring[0]).tz('Africa/Tunis')
      lastBookingDate.hour(bookingDateTracker.hour() + 1)
      
      // The number of subsequent bookings in the recurring booking date range 
      let bookingsInRange = req.body.recurring[1] === 'daily' ? 
                            Math.floor(lastBookingDate.diff(bookingDateTracker, 'days', true)) :
                            req.body.recurring[1] === 'weekly' ?
                            Math.floor(lastBookingDate.diff(bookingDateTracker, 'weeks', true)) :
                            Math.floor(lastBookingDate.diff(bookingDateTracker, 'months', true))
  
      // Set the units which will be added to the bookingDateTracker - days, weeks or months
      let units = req.body.recurring[1] === 'daily' ? 'd' : 
                  req.body.recurring[1] === 'weekly' ? 'w' : 'M'
      
      // Each loop will represent a potential booking in this range 
      for (let i = 0; i < bookingsInRange; i++) {
        
        // Add one unit to the booking tracker to get the date of the potential booking
        let proposedBookingDateStart = bookingDateTracker.add(1, units)
      
        // Check whether this day is a Sunday (no bookings on Sundays)
        if (proposedBookingDateStart.day() !== 0) {
          
          // Create a new booking object based on the first booking 
          let newBooking = Object.assign({}, firstBooking)
          
          // Calculate the end date/time of the new booking by adding the number of units to the first booking's end date/time
          let firstBookingEndDate = momentTimezone(firstBooking.bookingEnd).tz('Africa/Tunis')
          let proposedBookingDateEnd = firstBookingEndDate.add(i + 1, units)
          
          // Update the new booking object's start and end dates
          newBooking.bookingStart = proposedBookingDateStart.toDate()
          newBooking.bookingEnd = proposedBookingDateEnd.toDate()
          
          // Add the new booking to the recurring booking array
          recurringBookings.push(newBooking)
        }
      }
      
  
      // Find the relevant room and save the bookings
      Room.findByIdAndUpdate(
        id,
        {
          $push: {
            bookings: {
              $each:
              recurringBookings
            }
          }
        },
        { new: true, runValidators: true, context: 'query' }
      )
        .then(room => {
          res.status(201).json(room)
        })
        .catch(error => {
          res.status(400).json({ error })
        })
    }
  })

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

router.put('/rooms/:id', authenticate, async (req, res) => {
    const { id } = req.params;
  
    try {
      const room = await makeBooking(id, req.body, req.user);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

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