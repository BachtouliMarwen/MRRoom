const mongoose = require ('mongoose')

const BookingSchema = new mongoose.Schema ({  
    title: String,
    bookingStart: { type: Date, required: true},
    bookingEnd: { type: Date, required: true},
    duration: Number,
    purpose: { type: String, required: true },
    user: { type: Schema.ObjectId, ref: 'User' },
    roomId: { type: Schema.ObjectId, ref: 'Room' }
})

// Validation to ensure a room cannot be double-booked
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


const Booking= mongoose.model('Booking', BookingSchema);
module.exports= Booking ;