import API_BASE_URL from "../../config/api";
import React, { useEffect, useState } from "react";
import { usePreferences } from "../../contexts/PreferencesContext";
import "../../Styles/AdminStyle/adminFeedbacks.css";

export default function AdminFeedbacks() {
  const { t } = usePreferences();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const adminName =
    (JSON.parse(sessionStorage.getItem("user") || "null") || {}).first_name ||
    t("Admin");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/feedback/getAllFeedbacks.php`
        );

        const text = await res.text();
        let data = null;
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            console.warn("getAllFeedbacks returned non-JSON:", text);
            data = null;
          }
        }

        if (res.ok && data && data.success) {
          setList(data.feedbacks || []);
        } else {
          console.error("Failed to load feedbacks", data);
        }
      } catch (err) {
        console.error("Network error while loading feedbacks", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sendReply = async (id) => {
    const text = (replyText[id] || "").trim();
    if (!text) return alert(t("Reply cannot be empty"));

    try {
      const res = await fetch(
        `${API_BASE_URL}/feedback/replyFeedback.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback_id: id,
            reply: text
          })
        }
      );

      const respText = await res.text();
      let data = null;
      if (respText) {
        try {
          data = JSON.parse(respText);
        } catch {
          console.warn("replyFeedback returned non-JSON:", respText);
          data = {
            success: false,
            message: t("Invalid JSON response from server"),
          };
        }
      } else {
        data = { success: false, message: t("Empty response from server") };
      }

      if (res.ok && data && data.success) {
        alert(t("Reply sent"));
        setList((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  reply: text,
                  is_replied: 1,
                  replied_by: adminName,
                  replied_at: new Date().toISOString(),
                }
              : item
          )
        );

        setReplyText((prev) => ({ ...prev, [id]: "" }));
      } else {
        alert(
          t("Failed: ") +
            (data && data.message ? data.message : `${t("Status")} ${res.status}`)
        );
      }
    } catch (err) {
      console.error("Network / fetch error:", err);
      alert(t("Could not connect to backend"));
    }
  };

  const awaitingReplyCount = list.filter((feedback) => !feedback.is_replied).length;

  return (
    <main className="admin-feedbacks">
      <header className="admin-feedbacks-heading">
        <div>
          <h2>{t("Feedback & Inquiries")}</h2>
          <p>{t("Review customer messages and send a reply.")}</p>
        </div>
        <div className="admin-feedbacks-summary" aria-label={t("Feedback summary")}>
          <div className="admin-feedbacks-stat">
            <span>{t("Total messages")}</span>
            <strong>{loading ? "—" : list.length}</strong>
          </div>
          <div className="admin-feedbacks-stat admin-feedbacks-stat--pending">
            <span>{t("Awaiting reply")}</span>
            <strong>{loading ? "—" : awaitingReplyCount}</strong>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="admin-feedbacks-state">{t("Loading...")}</p>
      ) : list.length === 0 ? (
        <p className="admin-feedbacks-state">{t("No feedbacks.")}</p>
      ) : (
        <section className="admin-feedbacks-list" aria-label={t("Feedback & Inquiries")}>
          {list.map((f) => (
            <article key={f.id} className="admin-feedback-card">
              <div className="admin-feedback-card-header">
                <div className="admin-feedback-customer">
                  <strong>{f.user_name}</strong>
                  <a href={`mailto:${f.user_email}`}>{f.user_email}</a>
                </div>
                <div className="admin-feedback-meta">
                  <time dateTime={f.created_at}>
                    {new Date(f.created_at).toLocaleString()}
                  </time>
                  <span
                    className={`admin-feedback-status ${
                      f.is_replied
                        ? "admin-feedback-status--replied"
                        : "admin-feedback-status--pending"
                    }`}
                  >
                    {t(f.is_replied ? "Replied" : "Awaiting reply")}
                  </span>
                </div>
              </div>

              <div className="admin-feedback-content">
                <h3>{f.subject}</h3>
                <p>{f.message}</p>
              </div>

              {f.is_replied ? (
                <div className="admin-feedback-reply">
                  <strong>
                    {t("Replied by")} {f.replied_by}:
                  </strong>
                  <p>{f.reply}</p>
                </div>
              ) : (
                <div className="admin-feedback-reply-form">
                  <label htmlFor={`feedback-reply-${f.id}`}>
                    {t("Write your reply")}
                  </label>
                  <textarea
                    id={`feedback-reply-${f.id}`}
                    rows="3"
                    value={replyText[f.id] || ""}
                    placeholder={t("Write your reply")}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [f.id]: e.target.value })
                    }
                  />
                  <button type="button" onClick={() => sendReply(f.id)}>
                    {t("Send Reply")}
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
