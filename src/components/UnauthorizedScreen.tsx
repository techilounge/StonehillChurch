type UnauthorizedScreenProps = {
  message?: string | null;
  onLogout?: () => void;
};

export function UnauthorizedScreen({ message, onLogout }: UnauthorizedScreenProps) {
  return (
    <main className="center-screen">
      <section className="panel panel-wide stack" aria-labelledby="unauthorized-heading">
        <div>
          <h1 id="unauthorized-heading">Access denied</h1>
          <p className="muted">
            Your Firebase account is signed in, but it is not approved for the
            Stonehill Admin Console.
          </p>
        </div>

        {message && <div className="error">{message}</div>}

        <p>
          Ask a super admin to create or update your document in the Firestore
          `users` collection with an approved Admin Console role.
        </p>

        {onLogout && (
          <button className="button danger" onClick={onLogout} type="button">
            Sign Out
          </button>
        )}
      </section>
    </main>
  );
}
