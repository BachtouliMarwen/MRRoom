const mongoose = require("mongoose");
const Schema = mongoose.Schema; 

const bookingSchema = new mongoose.Schema ({  
  title: String,
  bookingStart: { type: Date, required: true},
  bookingEnd: { type: Date, required: true},
  duration: Number,
  reccuring:[],
  purpose: { type: String, required: true },
  user: { type: Schema.ObjectId, ref: 'User' },
  roomId: { type: Schema.ObjectId, ref: 'Room' }
})

bookingSchema.path('bookingStart').validate(function(value) {
  // Extract the Room Id from the query object
  let roomId = this.roomId
  
  // Convert booking Date objects into a number value
  let newBookingStart = value.getTime()
  let newBookingEnd = this.bookingEnd.getTime()
  
  // Function to check for booking clash
  let clashesWithExisting = (existingBookingStart, existingBookingEnd, newBookingStart, newBookingEnd) => {
      if (newBookingStart >= existingBookingStart && newBookingStart < existingBookingEnd || 
          existingBookingStart >= newBookingStart && existingBookingStart < newBookingEnd) {
              throw new Error(
                  `Booking could not be saved. There is a clash with an existing booking from ${moment(existingBookingStart).format('HH:mm')} to ${moment(existingBookingEnd).format('HH:mm on LL')}`
                  )
              }
              return false
          }
  
  // Locate the room document containing the bookings
  return Room.findById(roomId)
  .then(room => {
      // Loop through each existing booking and return false if there is a clash
      return room.bookings.every(booking => {
          // Convert existing booking Date objects into number values
          let existingBookingStart = new Date(booking.bookingStart).getTime()
          let existingBookingEnd = new Date(booking.bookingEnd).getTime()
          // Check whether there is a clash between the new booking and the existing booking
          return !clashesWithExisting(
              existingBookingStart, 
              existingBookingEnd, 
              newBookingStart, 
              newBookingEnd
              )
          })
      })
  }, `{REASON}`)

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  equipment: {
    type: [String],
    required: true,
  },
  availability: {
    type: Boolean,
    required: true,
    default: true,
  },
  bookings: [bookingSchema]
});

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room ;