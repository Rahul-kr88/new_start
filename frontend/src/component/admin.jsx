import { useState, useEffect } from "react";

function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [sweets, setSweets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [sweetName, setSweetName] = useState("");
  const [sweetPrice, setSweetPrice] = useState("");
  const [sweetStock, setSweetStock] = useState("");
  const [sweetImage, setSweetImage] = useState(null);

  // Total sales excluding cancelled orders
  const totalSales = orders.reduce(
    (total, order) =>
      order.orderStatus === "Cancelled"
        ? total
        : total + Number(order.totalAmount || 0),
    0
  );

  // Total orders excluding cancelled orders
  const totalOrders = orders.filter(
    (order) => order.orderStatus !== "Cancelled"
  ).length;

  // Total quantity sold excluding cancelled orders
  const totalQuantitySold = orders.reduce(
    (total, order) =>
      order.orderStatus === "Cancelled"
        ? total
        : total +
          order.items.reduce(
            (itemTotal, item) =>
              itemTotal + Number(item.quantity || 0),
            0
          ),
    0
  );

  useEffect(() => {
    fetch("http://localhost:5000/sweets")
      .then((response) => response.json())
      .then((data) => {
        setSweets(data);
      });

    const token = localStorage.getItem("adminToken");

    if (token) {
      fetch("http://localhost:5000/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setOrders(data);
            setIsLoggedIn(true);
          }
        })
        .catch((error) => {
          console.log("Orders fetch error:", error);
        });
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/admin-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      localStorage.setItem("adminToken", data.token);

      setIsLoggedIn(true);

      const ordersResponse = await fetch(
        "http://localhost:5000/orders",
        {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );

      const ordersData = await ordersResponse.json();

      if (ordersResponse.ok) {
        setOrders(ordersData);
      }
    } catch (error) {
      console.log("Login error:", error);
      alert("Could not connect to the server.");
    }
  };

  const addSweet = () => {
    if (!sweetName || !sweetPrice || !sweetStock) {
      alert("Please fill all sweet details.");
      return;
    }

    const token = localStorage.getItem("adminToken");

    const formData = new FormData();

    formData.append("name", sweetName);
    formData.append("price", Number(sweetPrice));
    formData.append("stock", Number(sweetStock));

    if (sweetImage) {
      formData.append("image", sweetImage);
    }

    fetch("http://localhost:5000/sweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((newSweet) => {
        if (!newSweet._id) {
          alert(newSweet.message || "Failed to add sweet.");
          return;
        }

        alert("Sweet added successfully!");

        setSweets((currentSweets) => [
          ...currentSweets,
          newSweet,
        ]);

        setSweetName("");
        setSweetPrice("");
        setSweetStock("");
        setSweetImage(null);
      })
      .catch((error) => {
        console.log("Add sweet error:", error);
        alert("Failed to add sweet.");
      });
  };

  const deleteSweet = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this sweet?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("adminToken");

    fetch(`http://localhost:5000/sweets/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then(() => {
        alert("Sweet deleted successfully!");

        setSweets((currentSweets) =>
          currentSweets.filter((sweet) => sweet._id !== id)
        );
      })
      .catch((error) => {
        console.log("Delete error:", error);
        alert("Delete failed. Check the browser console.");
      });
  };

  const updateSweetImage = (id, imageFile) => {
    if (!imageFile) {
      return;
    }

    const token = localStorage.getItem("adminToken");

    const formData = new FormData();

    formData.append("image", imageFile);

    fetch(`http://localhost:5000/sweets/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((updatedSweet) => {
        if (!updatedSweet._id) {
          alert(
            updatedSweet.message ||
              "Failed to update sweet image."
          );
          return;
        }

        alert("Sweet photo updated successfully!");

        setSweets((currentSweets) =>
          currentSweets.map((sweet) =>
            sweet._id === id ? updatedSweet : sweet
          )
        );
      })
      .catch((error) => {
        console.log("Image update error:", error);
        alert("Failed to update sweet image.");
      });
  };

  const deleteSweetImage = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this photo?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("adminToken");

    const formData = new FormData();

    formData.append("deleteImage", "true");

    fetch(`http://localhost:5000/sweets/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((updatedSweet) => {
        if (!updatedSweet._id) {
          alert(
            updatedSweet.message ||
              "Failed to delete sweet photo."
          );
          return;
        }

        alert("Sweet photo deleted successfully!");

        setSweets((currentSweets) =>
          currentSweets.map((sweet) =>
            sweet._id === id ? updatedSweet : sweet
          )
        );
      })
      .catch((error) => {
        console.log("Image delete error:", error);
        alert("Failed to delete sweet photo.");
      });
  };

  const updateStock = (id) => {
    const newStock = prompt("Enter new stock (kg):");

    if (newStock === null || newStock === "") {
      return;
    }

    if (Number(newStock) < 0) {
      alert("Stock cannot be negative.");
      return;
    }

    const token = localStorage.getItem("adminToken");

    fetch(`http://localhost:5000/sweets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        stock: Number(newStock),
      }),
    })
      .then((response) => response.json())
      .then((updatedSweet) => {
        if (!updatedSweet._id) {
          alert(
            updatedSweet.message ||
              "Failed to update stock."
          );
          return;
        }

        alert("Stock updated successfully!");

        setSweets((currentSweets) =>
          currentSweets.map((sweet) =>
            sweet._id === id ? updatedSweet : sweet
          )
        );
      })
      .catch((error) => {
        console.log("Stock update error:", error);
        alert("Failed to update stock.");
      });
  };

  const updateOrderStatus = (id, newStatus) => {
    const token = localStorage.getItem("adminToken");

    fetch(`http://localhost:5000/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderStatus: newStatus,
      }),
    })
      .then((response) => response.json())
      .then((updatedOrder) => {
        if (!updatedOrder._id) {
          alert(
            updatedOrder.message ||
              "Failed to update order status."
          );
          return;
        }

        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === id ? updatedOrder : order
          )
        );

        if (selectedOrder?._id === id) {
          setSelectedOrder(updatedOrder);
        }
      })
      .catch((error) => {
        console.log("Status update error:", error);
        alert("Failed to update order status.");
      });
  };

  const editSweet = (id) => {
    const newName = prompt("Enter new sweet name:");
    const newPrice = prompt("Enter new price:");

    if (!newName || !newPrice) {
      return;
    }

    const token = localStorage.getItem("adminToken");

    fetch(`http://localhost:5000/sweets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: newName,
        price: Number(newPrice),
      }),
    })
      .then((response) => response.json())
      .then((updatedSweet) => {
        if (!updatedSweet._id) {
          alert(
            updatedSweet.message ||
              "Failed to update sweet."
          );
          return;
        }

        alert("Sweet updated successfully!");

        setSweets((currentSweets) =>
          currentSweets.map((sweet) =>
            sweet._id === id ? updatedSweet : sweet
          )
        );
      })
      .catch((error) => {
        console.log("Edit error:", error);
        alert("Failed to update sweet.");
      });
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);

    setTimeout(() => {
      document
        .getElementById("order-details")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <h1 className="admin-login-title">
          Admin Login
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-panel-title">
        Admin Panel
      </h1>

      <p>Welcome, Shop Owner!</p>

      <button
        className="logout-btn"
        onClick={handleLogout}
      >
        Logout
      </button>

      <h2 className="admin-section-title">
        Add New Sweet
      </h2>

      <input
        type="text"
        placeholder="Sweet name"
        value={sweetName}
        onChange={(e) => setSweetName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Price"
        value={sweetPrice}
        onChange={(e) => setSweetPrice(e.target.value)}
      />

      <input
        type="number"
        placeholder="Stock (kg)"
        value={sweetStock}
        onChange={(e) => setSweetStock(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setSweetImage(e.target.files[0])
        }
      />

      <button onClick={addSweet}>
        Add Sweet
      </button>

      <h2>Existing Sweets</h2>

      {sweets.map((sweet) => (
        <div
          className="sweet-admin-card"
          key={sweet._id}
        >
          <span>
            {sweet.name} - ₹{sweet.price} - Stock:{" "}
            {sweet.stock} kg
          </span>

          <br />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              updateSweetImage(
                sweet._id,
                e.target.files[0]
              );
            }}
          />

          {sweet.image && (
            <button
              onClick={() =>
                deleteSweetImage(sweet._id)
              }
            >
              Delete Photo
            </button>
          )}

          <button
            onClick={() =>
              deleteSweet(sweet._id)
            }
          >
            Delete
          </button>

          <button
            onClick={() =>
              editSweet(sweet._id)
            }
          >
            Edit
          </button>

          <button
            onClick={() =>
              updateStock(sweet._id)
            }
          >
            Update Stock
          </button>
        </div>
      ))}

      <h2>Sales Dashboard</h2>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Sales</h3>
          <p>₹{totalSales}</p>
        </div>

        <div className="dashboard-card">
          <h3>Total Orders</h3>
          <p>{totalOrders}</p>
        </div>

        <div className="dashboard-card">
          <h3>Quantity Sold</h3>
          <p>{totalQuantitySold} kg</p>
        </div>
      </div>

      <h2>Customer Orders</h2>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => {
              const status =
                order.orderStatus || "Pending";

              return (
                <tr key={order._id}>
                  <td>
                    {order._id.slice(-6)}
                  </td>

                  <td>{order.customerName}</td>

                  <td>
                    ₹{order.totalAmount}
                  </td>

                  <td>
                    {order.paymentStatus}
                  </td>

                  <td>
                    <select
                      value={status}
                      onChange={(e) =>
                        updateOrderStatus(
                          order._id,
                          e.target.value
                        )
                      }
                      style={{
                        backgroundColor:
                          status === "Pending"
                            ? "#fff3cd"
                            : status === "Confirmed"
                            ? "#dbeafe"
                            : status === "Preparing"
                            ? "#ffedd5"
                            : status ===
                              "Out for Delivery"
                            ? "#ede9fe"
                            : status ===
                              "Delivered"
                            ? "#dcfce7"
                            : status ===
                              "Cancelled"
                            ? "#fee2e2"
                            : "white",
                      }}
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Confirmed">
                        Confirmed
                      </option>

                      <option value="Preparing">
                        Preparing
                      </option>

                      <option value="Out for Delivery">
                        Out for Delivery
                      </option>

                      <option value="Delivered">
                        Delivered
                      </option>

                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </select>
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        handleViewOrder(order)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div
          className="order-details"
          id="order-details"
        >
          <h2>Order Details</h2>

          <p>
            <strong>Order ID:</strong>{" "}
            {selectedOrder._id}
          </p>

          <p>
            <strong>Customer:</strong>{" "}
            {selectedOrder.customerName}
          </p>

          <p>
            <strong>Phone:</strong>{" "}
            {selectedOrder.phone}
          </p>

          <p>
            <strong>Address:</strong>{" "}
            {selectedOrder.address}
          </p>

          <p>
            <strong>Total Amount:</strong> ₹
            {selectedOrder.totalAmount}
          </p>

          <p>
            <strong>Payment Status:</strong>{" "}
            {selectedOrder.paymentStatus}
          </p>

          <p>
            <strong>Payment ID:</strong>{" "}
            {selectedOrder.paymentId}
          </p>

          <p>
            <strong>Razorpay Order ID:</strong>{" "}
            {selectedOrder.razorpayOrderId}
          </p>

          <p>
            <strong>Order Status:</strong>{" "}
            {selectedOrder.orderStatus ||
              "Pending"}
          </p>

          <h3>Items</h3>

          {selectedOrder.items.map(
            (item, index) => (
              <p key={index}>
                {item.name} - {item.quantity} kg -
                ₹{item.price}/kg
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;