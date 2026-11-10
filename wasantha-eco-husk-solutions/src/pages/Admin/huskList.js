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

  if (loading) {
    return (
      <div className="admin-husks">
        <p className="admin-husks-message">{t("Loading...")}</p>
      </div>
    );
  }

  return (
    <div className="admin-husks">
      <h2>{t("All Husk Submissions")}</h2>

      <div className="admin-husks-table-wrap">
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
            {items.length === 0 ? (
              <tr>
                <td className="admin-husks-empty" colSpan="8">
                  {t("No entries.")}
                </td>
              </tr>
            ) : (
              items.map((h) => (
                <tr key={h.id}>
                  <td className="admin-husks-owner">{h.name}</td>
                  <td className="admin-husks-phone">{h.phone}</td>
                  <td className="admin-husks-address">{h.address}</td>

                  <td>
                    <div className="admin-husks-images">
                      {h.image_1 && (
                        <img src={assetUrl(h.image_1)} alt={h.name || ""} />
                      )}
                      {h.image_2 && (
                        <img src={assetUrl(h.image_2)} alt={h.name || ""} />
                      )}
                    </div>
                  </td>

                  <td className="admin-husks-description">{h.description}</td>

                  <td>{h.admin_response || t("No response")}</td>

                  <td>
                    {h.map_link ? (
                      <a
                        className="admin-husks-map-link"
                        href={h.map_link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("View Map")}
                      </a>
                    ) : (
                      t("Not set")
                    )}
                  </td>

                  <td>
                    <div className="admin-husks-actions">
                      <button
                        className="admin-husks-respond"
                        onClick={() => handleResponse(h.id)}
                      >
                        {t("Send Response")}
                      </button>
                      {h.admin_response && (
                        <button
                          className="admin-husks-delete"
                          onClick={() => handleDeleteHusk(h.id)}
                        >
                          {t("Delete")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
