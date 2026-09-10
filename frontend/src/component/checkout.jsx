import { useState } from "react";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

function Checkout({ cart, setCart }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
const [savedOrder, setSavedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOrder = async () => {
    setLoading(true);

    if (cart.length === 0) {
      alert("Your cart is empty.");
      setLoading(false);
      return;
    }

    if (!name || !phone || !address) {
      alert("Please fill all the details.");
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    const totalAmount = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    try {
      // Create Razorpay order
      const response = await fetch(
        "http://localhost:5000/create-payment-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: totalAmount,
          }),
        }
      );

      const paymentOrder = await response.json();

      if (!response.ok) {
        alert("Could not create payment order.");
        setLoading(false);
        return;
      }

      // Load Razorpay
      const razorpayLoaded = await loadRazorpay();

      if (!razorpayLoaded) {
        alert("Razorpay failed to load.");
        setLoading(false);
        return;
      }

      console.log("Razorpay order:", paymentOrder);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Madhusudhan Sweets",
        description: "Sweet Shop Order",
        order_id: paymentOrder.id,

        handler: async function (paymentResponse) {
          console.log("RAZORPAY RESPONSE:", paymentResponse);

          try {
            // Verify payment
            const verifyResponse = await fetch(
              "http://localhost:5000/verify-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verification = await verifyResponse.json();

            if (!verifyResponse.ok || !verification.success) {
              alert("Payment verification failed.");
              setLoading(false);
              return;
            }

            console.log("Payment verified successfully.");

            // Save order
            const orderResponse = await fetch(
              "http://localhost:5000/orders",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  customerName: name,
                  phone: phone,
                  address: address,
                  items: cart,
                  totalAmount: totalAmount,
                  paymentStatus: "Paid",
                  paymentId:
                    paymentResponse.razorpay_payment_id,
                  razorpayOrderId:
                    paymentResponse.razorpay_order_id,
                }),
              }
            );

            const data = await orderResponse.json();

            if (!orderResponse.ok) {
              alert(data.message);
              setLoading(false);
              return;
            }

            console.log("Order saved:", data);

setSavedOrder(data);
setOrderPlaced(true);
            setCart([]);
            setLoading(false);
          } catch (error) {
            console.log("Verification error:", error);
            alert("Payment verification failed.");
            setLoading(false);
          }
        },

        prefill: {
          name: name,
          contact: phone,
        },

        theme: {
          color: "#3399cc",
        },
      };

      const payment = new window.Razorpay(options);

      payment.open();
    } catch (error) {
      console.log("Payment error:", error);
      alert("Something went wrong while starting payment.");
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout" id="checkout">
  <h1>✅ Order Placed!</h1>

  <p>Thank you, {name}!</p>

  <p>Your payment was successful.</p>

  <p>Your order has been received successfully.</p>

  {savedOrder && (
  <>
    <p>
      <strong>Order ID:</strong> {savedOrder._id}
    </p>

    <p>
      <strong>Amount Paid:</strong> ₹{savedOrder.totalAmount}
    </p>
    <p>
  <strong>Payment Status:</strong>{" "}
  {savedOrder.paymentStatus}
</p>
<p>
  <strong>Order Status:</strong>{" "}
  {savedOrder.orderStatus}
</p>
<h3>Items Ordered</h3>

{savedOrder.items.map((item, index) => (
  <p key={index}>
    {item.name} - {item.quantity} kg - ₹{item.price}/kg
  </p>
))}
  </>
)}
</div>
    );
  }

  return (
    <div className="checkout" id="checkout">
      <h1 className="checkout-title">Checkout</h1>

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength="50"
      />

      <input
        type="tel"
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        maxLength="10"
      />

      <textarea
        placeholder="Delivery Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        minLength="10"
        maxLength="200"
      />

      <button onClick={handleOrder} disabled={loading}>
        {loading ? "Processing..." : "Place Order"}
      </button>
    </div>
  );
}

export default Checkout;