const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  address: String,

  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],

  totalAmount: Number,
  paymentStatus: {
  type: String,
  default: "Pending",
},
paymentId: {
  type: String,
},
razorpayOrderId: {
  type: String,
},
orderStatus: {
  type: String,
  default: "Pending",
},

  orderDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);