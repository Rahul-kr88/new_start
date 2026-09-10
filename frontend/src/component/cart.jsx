function Cart({ cart, setCart, setShowCheckout })  {
  const increaseQuantity = (name) => {
  setCart((currentCart) =>
    currentCart.map((item) => {
      if (item.name === name) {
        if (item.quantity >= item.stock) {
          alert("You cannot add more than available stock.");
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }

      return item;
    })
  );
};
  const decreaseQuantity = (name) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.name === name
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalPrice = cart.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );
  const removeFromCart = (name) => {
  setCart((currentCart) =>
    currentCart.filter((item) => item.name !== name)
  );
};
const handleCheckout = () => {
  alert("Thank you for your order! 🍬");
};

  return (
    <div className="cart" id="cart">
      <h1>Your Cart</h1>

      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {cart.map((item) => (
            <div className="cart-item" key={item.name}>
              <h3>{item.name}</h3>

              <p>₹{item.price} / kg</p>
              <p>Available stock: {item.stock} kg</p>
              <p>
  Subtotal: ₹{Number(item.price) * item.quantity}
</p>

              <button onClick={() => decreaseQuantity(item.name)}>
                −
              </button>

              <span> {item.quantity} kg </span>
<button
  onClick={() => increaseQuantity(item.name)}
  disabled={item.quantity >= item.stock}
>
  +
</button>
                <button onClick={() => removeFromCart(item.name)}>
                  Remove
                </button>
            </div>
          ))}

         <div className="cart-summary">
  <h2>Order Summary</h2>
  <p>Total Items: {cart.reduce((total, item) => total + item.quantity, 0)} kg</p>
  <h2 className="cart-total">Total: ₹{totalPrice}</h2>
</div>
          
          <button onClick={() => setCart([])}>
  Clear Cart
</button>
<button
  className="checkout-btn"
  onClick={() => {
    setShowCheckout(true);

    setTimeout(() => {
      document
        .getElementById("checkout")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }}
>
  Proceed to Checkout
</button>
        </>
      )}
    </div>
  );
}

export default Cart;