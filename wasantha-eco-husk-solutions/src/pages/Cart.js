import API_BASE_URL, { assetUrl } from "../config/api";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePreferences } from "../contexts/PreferencesContext";
import { useToast } from "../contexts/ToastContext";
import { Trash2 } from "lucide-react";
import "../Styles/Cart.css";
import productPlaceholder from "../assests/main.jpg";

export default function Cart() {
  const { t } = usePreferences();
  const showToast = useToast();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem("user") || "null");
  } catch (sessionError) {
    console.error("Invalid session user:", sessionError);
  }

  const fetchCart = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const res = await fetch(
        `${API_BASE_URL}/cart/getCart.php?user_id=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t("Could not load your cart."));
      }

      setCart(Array.isArray(data.items) ? data.items : []);
    } catch (fetchError) {
      console.error("Error fetching cart:", fetchError);
      setError(fetchError.message || t("Could not load your cart."));
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (!user?.id) {
      alert(t("Please log in to view your cart."));
      navigate("/login");
      return;
    }
    fetchCart();
  }, [navigate, user?.id, fetchCart, t]);

  const handleUpdateQty = async (cartId, newQty, productId) => {
    if (newQty < 1) return;

    try {
      const res = await fetch(`${API_BASE_URL}/cart/updateCart.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cartId,
          product_id: productId,
          quantity: newQty,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t("Could not update cart quantity."));
      }

      setCart((previous) =>
        previous.map((item) =>
          Number(item.id) === Number(cartId)
            ? { ...item, quantity: newQty }
            : item
        )
      );
      setError("");
    } catch (updateError) {
      console.error("Update cart quantity failed:", updateError);
      setError(updateError.message || t("Could not update cart quantity."));
    }
  };

  const handleRemove = async (cartId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/cart/removeFromCart.php?id=${encodeURIComponent(cartId)}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t("Could not remove the item."));
      }

      setCart((previous) =>
        previous.filter((item) => Number(item.id) !== Number(cartId))
      );
      setError("");
      showToast(t("Item removed from cart."));
    } catch (removeError) {
      console.error("Remove cart item failed:", removeError);
      const message = removeError.message || t("Could not remove the item.");
      setError(message);
      showToast(message, "error");
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  if (loading) {
    return <p className="cart-loading" role="status">{t("Loading your cart...")}</p>;
  }

  return (
    <main className="cart-page">
      <header className="cart-header">
        <p className="cart-eyebrow">{t("Your selections")}</p>
        <h2>{t("Your shopping cart")}</h2>
        <p className="cart-subtitle">
          {cart.length} {cart.length === 1 ? t("item") : t("items")} {t("in your cart")}
        </p>
      </header>

      {error && <p className="cart-error" role="alert">{error}</p>}

      {cart.length === 0 ? (
        <section className="empty-cart">
          <h3>{t("Your cart is empty")}</h3>
          <p>{t("Explore our products and add something you love.")}</p>
          <Link className="cart-empty-action" to="/products">
            {t("Browse products")}
          </Link>
        </section>
      ) : (
        <>
          <div className="cart-table-wrap">
            <table className="cart-table">
              <thead>
                <tr>
                  <th scope="col">{t("Product")}</th>
                  <th scope="col">{t("Quantity")}</th>
                  <th scope="col">{t("Price")}</th>
                  <th scope="col">{t("Subtotal")}</th>
                  <th scope="col"><span className="sr-only">{t("Actions")}</span></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td className="cart-product" data-label={t("Product")}>
                      <img
                        src={item.image_url ? assetUrl(item.image_url) : productPlaceholder}
                        alt={item.name}
                        className="cart-thumb"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = productPlaceholder;
                        }}
                      />
                      <span>{item.name}</span>
                    </td>
                    <td data-label={t("Quantity")}>
                      <div className="qty-wrapper">
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label={`${t("Decrease")} ${item.name} ${t("quantity")}`}
                          disabled={Number(item.quantity) <= 1}
                          onClick={() =>
                            handleUpdateQty(
                              item.id,
                              Number(item.quantity) - 1,
                              item.product_id
                            )
                          }
                        >
                          −
                        </button>
                        <input
                          type="text"
                          value={item.quantity}
                          readOnly
                          aria-label={`${item.name} ${t("quantity")}`}
                          className="qty-input"
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label={`${t("Increase")} ${item.name} ${t("quantity")}`}
                          onClick={() =>
                            handleUpdateQty(
                              item.id,
                              Number(item.quantity) + 1,
                              item.product_id
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td data-label={t("Price")}>
                      Rs. {Number(item.price).toFixed(2)}
                    </td>
                    <td className="cart-line-total" data-label={t("Subtotal")}>
                      Rs. {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </td>
                    <td className="cart-remove-cell" data-label={t("Remove item")}>
                      <button
                        type="button"
                        className="remove-btn"
                        aria-label={`${t("Remove")} ${item.name} ${t("from cart")}`}
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="cart-summary" aria-label={t("Order summary")}>
            <h3>{t("Cart total")} <span>Rs. {total.toFixed(2)}</span></h3>
            <div className="cart-actions">
              <button
                type="button"
                className="btn-continue"
                onClick={() => navigate("/products")}
              >
                {t("Continue shopping")}
              </button>
              <button
                type="button"
                className="btn-checkout"
                onClick={() => navigate("/checkout")}
              >
                {t("Proceed to checkout")}
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
