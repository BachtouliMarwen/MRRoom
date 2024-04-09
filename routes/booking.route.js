const express = require('express');
const router = express.Router();
const Room = require("../models/room");
const User = require("../models/user");

const authenticate = require ('../middleware/authenticate');
const verifyRole = require('../middleware/verifyrole');




const makeBooking = async (roomId, bookingData, user) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }
  
      if (bookingData.recurring.length === 0) {
        const newBooking = {
          user: user,
          startHour: dateAEST(bookingData.bookingStart).format('H.mm'),
          duration: durationHours(bookingData.bookingStart, bookingData.bookingEnd),
          ...bookingData
        };
  
        room.bookings.push(newBooking);
      } else {
        let recurringBookings = [];
        const firstBooking = {
          user: user,
          startHour: dateAEST(bookingData.bookingStart).format('H.mm'),
          duration: durationHours(bookingData.bookingStart, bookingData.bookingEnd),
          ...bookingData
        };
        recurringBookings.push(firstBooking);
  
        const bookingDateTracker = momentTimezone(firstBooking.bookingStart).tz('Africa/Tunis');
        const lastBookingDate = momentTimezone(firstBooking.recurring[0]).tz('Africa/Tunis');
        lastBookingDate.hour(bookingDateTracker.hour() + 1);
  
        const bookingsInRange = bookingData.recurring[1] === 'daily' ? 
                                Math.floor(lastBookingDate.diff(bookingDateTracker, 'days', true)) :
                                bookingData.recurring[1] === 'weekly' ?
                                Math.floor(lastBookingDate.diff(bookingDateTracker, 'weeks', true)) :
                                Math.floor(lastBookingDate.diff(bookingDateTracker, 'months', true));
  
        const units = bookingData.recurring[1] === 'daily' ? 'd' : 
                      bookingData.recurring[1] === 'weekly' ? 'w' : 'M';
        
        for (let i = 0; i < bookingsInRange; i++) {
          let proposedBookingDateStart = bookingDateTracker.add(1, units);
  
          if (proposedBookingDateStart.day() !== 0) {
            const newBooking = {
              ...firstBooking,
              bookingStart: proposedBookingDateStart.toDate(),
              bookingEnd: momentTimezone(firstBooking.bookingEnd).add(i + 1, units).toDate()
            };
            recurringBookings.push(newBooking);
          }
        }
  
        room.bookings.push(...recurringBookings);
      }
  
      await room.save();
      return room;
    } catch (error) {
      throw new Error(error.message);
    }
  };

module.exports = {makeBooking}