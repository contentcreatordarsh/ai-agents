"use client";

export default function LeaderboardSection() {
  return (
    <section id="leaderboard" className="section leaderboard-section">
      <h2 className="section-title">LEADERBOARD</h2>
      <p className="section-body muted">Global rankings arrive in a future milestone. Deploy a battle to earn sector score today.</p>
      <table className="lb-table">
        <thead>
          <tr><th>OPERATOR</th><th>WINS</th><th>SECTORS</th></tr>
        </thead>
        <tbody>
          <tr><td>DEMO_ALPHA</td><td>12</td><td>48</td></tr>
          <tr><td>DEMO_BRAVO</td><td>9</td><td>36</td></tr>
          <tr><td>DEMO_CHARLIE</td><td>7</td><td>29</td></tr>
        </tbody>
      </table>
      <p className="demo-note">Demonstration data</p>
    </section>
  );
}
