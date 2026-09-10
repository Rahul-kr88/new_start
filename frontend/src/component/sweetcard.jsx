import { useState } from "react";

function SweetCard({ name, price, stock, image, addToCart }) {
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="card">
      <div className="sweet-image">
  {image ? (
    <img
      src={`http://localhost:5000${image}`}
      alt={name}
    />
  ) : (
    "🍬"
  )}
</div>

      <h3>{name}</h3>

      <p>₹{price} / kg</p>

      <div>
        <button onClick={decreaseQuantity}>−</button>

        <span> {quantity} kg </span>

        <button onClick={increaseQuantity}>+</button>
      </div>

      <button
        onClick={() => addToCart({ name, price, quantity, stock })}
        disabled={stock <= 0}
      >
        {stock <= 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}

export default SweetCard;