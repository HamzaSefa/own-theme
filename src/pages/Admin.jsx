import { useState } from "react";
import { Link } from "react-router-dom";
import Overview from "./admin/Overview";
import Students from "./admin/Students";
import Content from "./admin/Content";

const tabs = [
  { id: "overview", label: "📊 Overview" },
  { id: "students", label: "👥 Students" },
  { id: "content", label: "🎬 Content" },
];

export default function Admin() {
  const [tab, setTab] = useState("overview");

  return (
    <>
      <div className="admin-top">
        <Link to="/">← Back to site</Link>
        <span className="admin-badge">ADMIN</span>
      </div>

      <div className="admin-layout">
        <nav className="admin-side">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? "side-btn active" : "side-btn"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="admin-main">
          {tab === "overview" && <Overview />}
          {tab === "students" && <Students />}
          {tab === "content" && <Content />}
        </main>
      </div>
    </>
  );
}