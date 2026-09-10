import { useState, useEffect } from "react";
import "./App.css";
import SweetCard from "./component/sweetcard";
import Cart from "./component/cart";
import Checkout from "./component/checkout";
import Admin from "./component/admin";

function App() {
  const [cart, setCart] = useState([]);
  const [sweets, setSweets] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/sweets")
      .then((response) => response.json())
      .then((data) => {
  console.log("SWEETS FROM SERVER:", data);
  setSweets(data);
});
  }, []);

  const addToCart = (item) => {
  setCart((currentCart) => {
    const existingItem = currentCart.find(
      (cartItem) => cartItem.name === item.name
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + item.quantity;

      if (newQuantity > item.stock) {
        alert("You cannot add more than available stock.");
        return currentCart;
      }

      return currentCart.map((cartItem) =>
        cartItem.name === item.name
          ? {
              ...cartItem,
              quantity: newQuantity,
            }
          : cartItem
      );
    }

    return [...currentCart, item];
  });
};

  return (
    <div>
      <nav>
        <h2>Madhusudhan Sweets</h2>

        <div>
          <a href="#">Home</a>
          <a href="#">Sweets</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="/track-order">Track Order</a>
          <a href="#cart">
            🛒 Cart (
            {cart.reduce((total, item) => total + item.quantity, 0)}
            )
          </a>
        </div>
      </nav>

      <div className="container">
        <h1>Welcome to Madhusudhan Sweets</h1>

        <div className="sweets">
          {sweets.map((sweet) => (
            <SweetCard
  key={sweet.name}
  name={sweet.name}
  price={sweet.price}
  addToCart={addToCart}
  stock={sweet.stock}
  image={sweet.image}
/>
          ))}
        </div>

        <Cart
          cart={cart}
          setCart={setCart}
          setShowCheckout={setShowCheckout}
        />

        {showCheckout && (
  <Checkout cart={cart} setCart={setCart} />
)}
      </div>
    </div>
  );
}

export default App;