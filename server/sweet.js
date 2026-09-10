const mongoose = require("mongoose");

const sweetSchema = new mongoose.Schema({
  name: String,
  price: Number,
  stock: Number,
  image: String
});

module.exports = mongoose.model("Sweet", sweetSchema);