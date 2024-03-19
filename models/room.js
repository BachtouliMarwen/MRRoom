const mongoose = require("mongoose");

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
});

const Room = mongoose.model("Room", RoomSchema);

module.exports = Room ;