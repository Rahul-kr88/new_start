const express = require("express");
const path = require("path");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Sweet = require("./Sweet");
const Order = require("./order");
const Admin = require("./admin");

const app = express();
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Admin login required.",
    });
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error);
  });
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Sweet Shop Backend is running!");
});
app.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    console.log("Admin login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});
app.get("/sweets", async (req, res) => {
  const sweets = await Sweet.find();
  res.json(sweets);
});
app.post("/create-payment-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "sweetshop_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json(order);
  } catch (error) {
    console.log("Payment order error:", error);
    res.status(500).json({
      message: "Could not create payment order",
    });
  }
});
app.post("/verify-payment", (req, res) => {
  console.log("VERIFY PAYMENT ROUTE CALLED");
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body =
    razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
console.log("Order ID:", razorpay_order_id);
console.log("Payment ID:", razorpay_payment_id);
console.log("Signature received:", razorpay_signature);
console.log("Expected signature:", expectedSignature);

  if (expectedSignature === razorpay_signature) {
    res.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});
app.get("/orders", authenticateAdmin, async (req, res) => {
  const orders = await Order.find().sort({ orderDate: -1 });
  res.json(orders);
});
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.json(order);
  } catch (error) {
    console.log("Order tracking error:", error);

    res.status(400).json({
      message: "Invalid Order ID.",
    });
  }
});
app.post(
  "/sweets",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const sweet = new Sweet({
        name: req.body.name,
        price: Number(req.body.price),
        stock: Number(req.body.stock),
        image: req.file
          ? `/uploads/${req.file.filename}`
          : "",
      });

      await sweet.save();

      res.json(sweet);
    } catch (error) {
      console.log("Add sweet error:", error);

      res.status(500).json({
        message: "Failed to add sweet.",
      });
    }
  }
);
app.post("/orders", async (req, res) => {
  for (const item of req.body.items) {
    const sweet = await Sweet.findOne({ name: item.name });

    if (sweet) {
  if (sweet.stock < item.quantity) {
    return res.status(400).json({
      message: `${sweet.name} does not have enough stock.`,
    });
  }

  sweet.stock = sweet.stock - item.quantity;
  await sweet.save();
}
  }

  const order = new Order(req.body);
  await order.save();

  res.json(order);
});
app.put("/orders/:id", authenticateAdmin, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus: req.body.orderStatus },
    { new: true }
  );

  res.json(order);
});
app.delete("/sweets/:id", authenticateAdmin, async (req, res) => {
  await Sweet.findByIdAndDelete(req.params.id);
  res.json({ message: "Sweet deleted successfully!" });
});
app.put(
  "/sweets/:id",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const sweet = await Sweet.findById(req.params.id);

      if (!sweet) {
        return res.status(404).json({
          message: "Sweet not found.",
        });
      }

      if (req.body.name !== undefined) {
        sweet.name = req.body.name;
      }

      if (req.body.price !== undefined) {
        sweet.price = Number(req.body.price);
      }

      if (req.body.stock !== undefined) {
        sweet.stock = Number(req.body.stock);
      }

      if (req.body.deleteImage === "true") {
        sweet.image = "";
      }

      if (req.file) {
        sweet.image = `/uploads/${req.file.filename}`;
      }

      await sweet.save();

      res.json(sweet);
    } catch (error) {
      console.log("Update sweet error:", error);

      res.status(500).json({
        message: "Failed to update sweet.",
      });
    }
  }
);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});