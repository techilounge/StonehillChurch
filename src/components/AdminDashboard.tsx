import {
  canCreateContent,
  canManageMedia,
  canManageSettings,
  canManageUsers,
  canPublishContent,
} from "../../lib/permissions";
import { useAdminAuth } from "../auth/AdminAuthContext";

export function AdminDashboard() {
  const { profile } = useAdminAuth();

  if (!profile) {
    return null;
  }

  const cards = [
    {
      title: "Content",
      value: canCreateContent(profile) ? "Create and edit" : "Read only",
    },
    {
      title: "Publishing",
      value: canPublishContent(profile) ? "Allowed" : "Not allowed",
    },
    {
      title: "Media",
      value: canManageMedia(profile) ? "Manage library" : "Read only",
    },
    {
      title: "Users",
      value: canManageUsers(profile) ? "Manage users" : "No access",
    },
    {
      title: "Settings",
      value: canManageSettings(profile) ? "Manage settings" : "No access",
    },
  ];

  return (
    <div className="stack">
      <div>
        <h1>Admin Console</h1>
        <p className="muted">
          Role-based controls are loaded from Firestore users/{profile.uid}.
        </p>
      </div>

      <section className="grid" aria-label="Permission summary">
        {cards.map((card) => (
          <article className="card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
