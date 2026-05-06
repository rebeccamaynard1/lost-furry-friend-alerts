import SEO from "@/components/SEO";

export default function TermsPage() {
  return (
    <div className="page-container max-w-3xl">
      <SEO title="Terms of Service — Lost Furry Friend Alerts" description="Terms governing your use of Lost Furry Friend Alerts." />
      <h1 className="page-title">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-semibold font-heading">1. Acceptance of Terms</h2>
          <p>By creating an account or using Lost Furry Friend Alerts ("the Service"), you agree to these Terms of Service. If you do not agree, please do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">2. Description of Service</h2>
          <p>Lost Furry Friend Alerts is a community platform that helps reunite lost pets with their owners through alerts, sightings, shelter directories, and volunteer networks. We do not guarantee the recovery of any pet.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">3. User Accounts</h2>
          <p>You are responsible for safeguarding your password and for all activity under your account. You must provide accurate information and notify us immediately of any unauthorized use.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">4. User Content</h2>
          <p>You retain ownership of content you post (photos, descriptions, sightings). By posting, you grant us a worldwide, royalty-free license to display, distribute, and use that content to operate the Service. Do not post unlawful, harassing, or false content.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">5. Premium Subscriptions & Payments</h2>
          <p>Premium membership is billed monthly at the price displayed. Subscriptions auto-renew until canceled. Payments are processed by Stripe. Donations and one-time alert boosts are non-refundable except where required by law. You may cancel anytime through your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">6. Prohibited Conduct</h2>
          <ul className="list-disc pl-6">
            <li>Posting false lost/found reports</li>
            <li>Harassing other users</li>
            <li>Scraping or abusing the platform</li>
            <li>Attempting to claim a pet that is not yours</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">7. Disclaimer of Warranties</h2>
          <p>The Service is provided "as is" without warranties of any kind. We do not guarantee accuracy of user submissions or the recovery of any pet.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">8. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Lost Furry Friend Alerts shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">9. Termination</h2>
          <p>We may suspend or terminate accounts that violate these Terms. You may delete your account at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">10. Changes to Terms</h2>
          <p>We may update these Terms. Continued use after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold font-heading">11. Contact</h2>
          <p>Questions? Contact us through the Help page.</p>
        </section>
      </div>
    </div>
  );
}
