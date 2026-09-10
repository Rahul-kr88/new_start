import { useState } from "react";

function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
 const statusSteps = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

  const trackOrder = async () => {
    if (!orderId) {
      alert("Please enter your Order ID.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/orders/${orderId}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        setOrder(null);
        return;
      }

      setOrder(data);
    } catch (error) {
      console.log("Tracking error:", error);
      alert("Could not connect to the server.");
    }
  };

  return (
  <div className="order-tracking">
      <h1>Track Your Order</h1>

      <input
        type="text"
        placeholder="Enter Order ID"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
      />

      <button onClick={trackOrder}>
        Track Order
      </button>

      {order && (
        <div>
          <h2>Order Details</h2>

          <p>
            <strong>Order ID:</strong> {order._id}
          </p>

          <p>
            <strong>Payment Status:</strong>{" "}
            {order.paymentStatus}
          </p>

          <h3>Order Status</h3>

<div className="order-status">
  {statusSteps.map((status, index) => {
    const currentIndex = statusSteps.indexOf(
      order.orderStatus
    );

    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex;

    return (
      <p
        key={status}
        className={
          isCompleted || isCurrent ? "active" : ""
        }
      >
        {status === "Pending" && "📦 Order Placed"}
        {status === "Confirmed" && "✅ Confirmed"}
        {status === "Preparing" && "👨‍🍳 Preparing"}
        {status === "Out for Delivery" &&
          "🚚 Out for Delivery"}
        {status === "Delivered" && "🎉 Delivered"}
        {status === "Cancelled" && "❌ Order Cancelled"}
      </p>
    );
  })}
</div>
          <p>
            <strong>Total Amount:</strong> ₹
            {order.totalAmount}
          </p>

          <h3>Items</h3>

          {order.items.map((item, index) => (
            <p key={index}>
              {item.name} - {item.quantity} kg - ₹
              {item.price}/kg
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderTracking;