import API_BASE_URL, { assetUrl } from "../../config/api";
import React, { useEffect, useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useToast } from "../../contexts/ToastContext";
import "../../Styles/AdminStyle/adminHusks.css";

export default function AdminHusks() {
  const { t } = usePreferences();
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `${API_BASE_URL}/Seller/getAllHusks.php`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.husks || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // -------------------------------
  // SEND RESPONSE (existing)
  // -------------------------------
  const handleResponse = async (sellerId) => {
    const res = await fetch(
      `${API_BASE_URL}/Seller/sendResponse.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: sellerId }),
      }
    );
    const data = await res.json();
    alert(data.message);

    if (data.success) window.location.reload();
  };

 
  const handleDeleteHusk = async (sellerId) => {
    if (!window.confirm(t("Delete this husk submission permanently?"))) return;

    try {
      const res = await fetch(`${API_BASE_URL}/Seller/deleteHusk.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: sellerId }),
      });
      const data = await res.json();

      if (data.success) {
        setItems((prev) => prev.filter((h) => h.id !== sellerId));
        showToast(t("Husk submission deleted successfully"));
      } else {
        showToast(data.message || t("Delete failed"), "error");
      }
    } catch (err) {
      console.error("Delete husk submission failed:", err);
      showToast(t("Delete error"), "error");
    }
  };

  if (loading) return <p>{t("Loading...")}</p>;

  return (
    <div className="admin-husks-page">
      <h2>{t("All Husk Submissions")}</h2>

      {items.length === 0 ? (
        <p>{t("No entries.")}</p>
      ) : (
        <table className="admin-husks-table">
          <thead>
            <tr>
              <th>{t("Owner")}</th>
              <th>{t("Phone")}</th>
              <th>{t("Address")}</th>
              <th>{t("Images")}</th>
              <th>{t("Description")}</th>
              <th>{t("Admin Response")}</th>
              <th>{t("Location")}</th>
              <th>{t("Action")}</th>
            </tr>
          </thead>

          <tbody>
            {items.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td>{h.phone}</td>
                <td>{h.address}</td>

                <td>
                  {h.image_1 && (
                    <img
                      src={assetUrl(h.image_1)}
                      alt=""
                      width="70"
                    />
                  )}
                  {h.image_2 && (
                    <img
                      src={assetUrl(h.image_2)}
                      alt=""
                      width="70"
                      style={{ marginLeft: 5 }}
                    />
                  )}
                </td>

                <td>{h.description}</td>

                <td>{h.admin_response || t("No response")}</td>

                <td>
                  {h.map_link ? (
                    <a href={h.map_link} target="_blank" rel="noreferrer">
                      {t("View Map")}
                    </a>
                  ) : (
                    t("Not set")
                  )}
                </td>

                <td>
                  <button onClick={() => handleResponse(h.id)}>
                    {t("Send Response")}
                  </button>

                  
                  {h.admin_response && (
                    <button
                      onClick={() => handleDeleteHusk(h.id)}
                      style={{
                        marginLeft: 6,
                        background: "#d9534f",
                        color: "#fff",
                      }}
                    >
                      {t("Delete")}
                    </button>
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
