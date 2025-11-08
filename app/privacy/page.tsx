import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                FieldShare ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our agricultural field management platform.
              </p>
              <p>
                This policy complies with applicable US federal and state privacy laws, including the California Consumer Privacy Act (CCPA) and other state data protection regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
              <p>We collect the following personal information when you register:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contact Information:</strong> Name, email address, phone number, mailing address, ZIP code</li>
                <li><strong>Account Credentials:</strong> Email and encrypted password</li>
                <li><strong>Business Information:</strong> Business name, license numbers, business address (for COOPs and service providers)</li>
                <li><strong>Profile Information:</strong> Account type (farmer, COOP, private applicator)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Field and Agricultural Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Field Information:</strong> Field boundaries (GeoJSON), acreage, crop types, planting dates</li>
                <li><strong>Location Data:</strong> GPS coordinates, ZIP codes for map centering</li>
                <li><strong>Farming Activities:</strong> Spray applications, crop rotations, harvest data</li>
                <li><strong>Adjacent Field Data:</strong> Information about neighboring fields you've been granted access to</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Technical Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Log data, IP addresses, browser type, device information</li>
                <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
                <li><strong>API Integration Data:</strong> Tokens for John Deere, Climate FieldView, etc. (with your explicit consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Delivery:</strong> To provide field management, mapping, and collaboration features</li>
                <li><strong>Communication:</strong> To send notifications about adjacent field activities, system updates</li>
                <li><strong>Access Control:</strong> To manage permissions between farmers and service providers</li>
                <li><strong>Integration Services:</strong> To sync data with external platforms (with your authorization)</li>
                <li><strong>Analytics:</strong> To improve our services and understand usage patterns</li>
                <li><strong>Legal Compliance:</strong> To comply with agricultural regulations and legal requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold mb-2">4.1 Adjacent Field Sharing</h3>
              <p>
                <strong>Important:</strong> When you grant permission, farmers adjacent to your fields can see limited information about your crops. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Crop type and spray tolerance</li>
                <li>Field boundaries (approximate)</li>
                <li>Planting dates and growth stage</li>
              </ul>
              <p className="mt-2">
                <strong>They CANNOT see:</strong> Your personal notes, financial information, or exact field locations beyond what's necessary for spray planning.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Service Provider Access</h3>
              <p>
                COOPs and custom applicators you authorize can access your field information to provide spraying services. You control this access and can revoke it at any time.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Third-Party Integrations</h3>
              <p>
                If you connect external services (John Deere Operations Center, Climate FieldView), data may be shared with those platforms according to their privacy policies.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Legal Requirements</h3>
              <p>
                We may disclose information if required by law, court order, or government regulation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Your Privacy Rights (US Users)</h2>
              
              <p>Under applicable US laws, including CCPA, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Opt-Out:</strong> Opt out of data sharing with third parties</li>
                <li><strong>Data Portability:</strong> Export your field and agricultural data</li>
                <li><strong>Non-Discrimination:</strong> Exercise these rights without discrimination</li>
              </ul>

              <p className="mt-4">
                To exercise these rights, contact us at: <a href="mailto:privacy@fieldshare.app" className="text-primary hover:underline">privacy@fieldshare.app</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encrypted password storage using bcrypt</li>
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure MongoDB Atlas database with encryption at rest</li>
                <li>HTTP-only cookies to prevent XSS attacks</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Delete your personal information within 30 days</li>
                <li>Anonymize field data used in aggregate analytics</li>
                <li>Retain billing records as required by law (7 years)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p>
                FieldShare is not intended for users under 18 years of age. We do not knowingly collect information from children. If we discover we have collected information from a child, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking</h2>
              <p>
                We use essential cookies for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication:</strong> Session management and login persistence</li>
                <li><strong>Preferences:</strong> User settings and map preferences</li>
                <li><strong>Security:</strong> CSRF protection and secure sessions</li>
              </ul>
              <p className="mt-2">
                We do NOT use third-party advertising or tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email notification to your registered address</li>
                <li>Prominent notice on the platform</li>
                <li>Updating the "Last updated" date above</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or your data, contact us at:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> privacy@fieldshare.app</li>
                <li><strong>Address:</strong> FieldShare Privacy Team, [Your Business Address]</li>
              </ul>
            </section>

            <div className="mt-8 pt-6 border-t">
              <Link href="/signup" className="text-primary hover:underline">
                ← Back to Sign Up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
