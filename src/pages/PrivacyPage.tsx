import SEO from "@/components/SEO";

export default function PrivacyPage() {
  return (
    <div className="page-container max-w-3xl">
      <SEO title="Privacy Policy — Lost Furry Friend Alerts" description="How Lost Furry Friend Alerts collects, uses, and protects your data." />
      <h1 className="page-title">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold font-heading">1. Information We Collect</h2>
          <ul className="list-disc pl-6">
            <li><strong>Account info:</strong> name, email, password (hashed), home address, phone (optional)</li>
            <li><strong>Pet reports:</strong> photos, descriptions, last-seen locations</li>
            <li><strong>Usage data:</strong> pages visited, alerts received</li>
            <li><strong>Payment data:</strong> handled by Stripe; we never store card numbers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6">
            <li>To send nearby lost/found pet alerts</li>
            <li>To allow other users to contact you about your pet</li>
            <li>To process subscriptions and donations</li>
            <li>To improve and secure the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">3. Sharing</h2>
          <p>We share contact info on lost/found listings only as you choose to make it public on a report. We do not sell personal data. We share data with service providers (Stripe, email infrastructure) strictly to operate the Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">4. Location Data</h2>
          <p>We use approximate addresses you provide to calculate alert proximity. We do not track real-time location.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">5. Data Retention</h2>
          <p>We retain account data while your account is active. You can request deletion at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">6. Your Rights</h2>
          <p>You may access, correct, export, or delete your data via your profile or by contacting us. EU/UK/CA residents have additional rights under GDPR/PIPEDA.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">7. Security</h2>
          <p>We use row-level security, encrypted connections, and password breach detection to protect your data. No system is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">8. Children</h2>
          <p>The Service is not directed to children under 13. We do not knowingly collect data from children.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">9. Cookies</h2>
          <p>We use essential cookies for authentication. We do not use third-party advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">10. Changes</h2>
          <p>We may update this policy. Material changes will be communicated via email or in-app notice.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">11. Contact</h2>
          <p>Questions about your privacy? Reach us through the Help page.</p>
        </section>
      </div>
    </div>
  );
}
