"use client";

export default function ContactSection() {
  return (
    <section id="contact" className="section contact-section">
      <h2 className="section-title">CONTACT</h2>
      <p className="section-body">
        Operations & partnerships:{" "}
        <a href="mailto:hello@strikemap.space">hello@strikemap.space</a>
      </p>
      <p className="section-body muted">
        Intel / security demo: <a href="/intel/">/intel</a>
      </p>
    </section>
  );
}
