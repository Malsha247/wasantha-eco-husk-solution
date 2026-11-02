import API_BASE_URL from "../config/api";
import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { usePreferences } from "../contexts/PreferencesContext";
import { useToast } from "../contexts/ToastContext";
import "../Styles/MyOrders.css";

export default function MyOrders() {
  const { t } = usePreferences();
  const showToast = useToast();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const location = useLocation();

  const API_BASE =
    process.env.REACT_APP_API_BASE ||
    `${API_BASE_URL}`;

  const fetchOrders = useCallback(() => {
    if (!user || !user.id) {
      setOrders([]);
      return;
    }
    const url = `${API_BASE}/orders/getOrdersByUser.php?user_id=${user.id}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.orders || []);
        else setOrders([]);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setOrders([]);
      });
  }, [API_BASE, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (location) {
      if (location.state && location.state.orderPlaced) {
        const id = location.state.orderId;
        setMessage(`${t("Order #")}${id} ${t("placed successfully.")}`);
      } else {
        const params = new URLSearchParams(location.search);
        const qid = params.get("order_id");
        if (qid) setMessage(`${t("Order #")}${qid} ${t("placed successfully.")}`);
      }
      fetchOrders();
      const timerId = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timerId);
    }
  }, [location, fetchOrders, t]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm(t("Cancel this order?")))
      return;
    try {
      const res = await fetch(`${API_BASE}/orders/cancelOrder.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          actor: user.first_name || user.id || "Customer",
        }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!data.success) {
        showToast(t("Failed to cancel: ") + (data.message || "unknown"), "error");
      } else {
        // remove from state so it disappears immediately
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        showToast(t("Order canceled"));
      }
    } catch (err) {
      console.error("cancelOrder network error:", err);
      showToast(t("Network error while canceling order"), "error");
    }
  };

  return (
    <div className="orders-page">
      <h2>{t("My Orders")}</h2>

      {message && <div className="order-message">{message}</div>}
      <button onClick={fetchOrders} style={{ marginBottom: 12 }}>
        {t("Refresh")}
      </button>

      {orders.length === 0 ? (
        <p className="no-orders">{t("No orders found.")}</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>{t("Order Number")}</th>
              <th>{t("Total")}</th>
              <th>{t("Payment")}</th>
              <th>{t("Status")}</th>
              <th>{t("Created")}</th>
              <th>{t("Cancel")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>Rs. {o.total_price}</td>
                <td>{o.payment_method}</td>
                <td className={o.status ? o.status.toLowerCase() : ""}>
                  {o.status}
                </td>
                <td>
                  {o.created_at ? new Date(o.created_at).toLocaleString() : "-"}
                </td>
                <td>
                  {o.status === "Pending" || o.status === "Processing" ? (
                    <button onClick={() => cancelOrder(o.id)}>{t("Cancel")}</button>
                  ) : (
                    <span style={{ color: "#888" }}>{t("Not available")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
