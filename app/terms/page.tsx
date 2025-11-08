import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using FieldShare ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
              <p>
                These terms constitute a legally binding agreement between you and FieldShare.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p>
                FieldShare provides a platform for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Farmers:</strong> Managing field boundaries, tracking crops, and sharing information with adjacent field owners</li>
                <li><strong>COOPs:</strong> Accessing authorized farmer field data to provide spraying and agricultural services</li>
                <li><strong>Private Applicators:</strong> Coordinating custom application services with farmer clients</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              
              <h3 className="text-xl font-semibold mb-2">3.1 Eligibility</h3>
              <p>
                You must be at least 18 years old and have the legal capacity to enter into contracts to use FieldShare.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Account Information</h3>
              <p>
                You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Account Types</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Farmer Accounts:</strong> For individuals or entities owning agricultural land</li>
                <li><strong>COOP Accounts:</strong> For agricultural cooperatives providing services to members</li>
                <li><strong>Private Applicator Accounts:</strong> For licensed applicators and custom spraying services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Field Data and Privacy</h2>
              
              <h3 className="text-xl font-semibold mb-2">4.1 Your Field Data</h3>
              <p>
                You retain ownership of all field data you upload or create on FieldShare. We do not claim ownership of your agricultural data.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Adjacent Field Sharing</h3>
              <p>
                <strong>Important:</strong> By using FieldShare, you understand that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Adjacent farmers may see limited information about your crops to make informed spraying decisions</li>
                <li>You can control what information is shared through privacy settings</li>
                <li>Sharing is voluntary and can be revoked at any time</li>
                <li>All sharing is logged for transparency</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Service Provider Access</h3>
              <p>
                When you authorize a COOP or private applicator to access your fields:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You explicitly grant them permission to view your field data</li>
                <li>They may access crop information, boundaries, and spray histories</li>
                <li>You can revoke access at any time from your settings</li>
                <li>Service providers must respect the confidentiality of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal purpose or in violation of agricultural regulations</li>
                <li>Share your account credentials with others</li>
                <li>Upload false or misleading field information</li>
                <li>Attempt to access other users' data without authorization</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated tools to scrape or harvest data</li>
                <li>Resell or redistribute the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p>
                The FieldShare platform, including all software, designs, text, graphics, and functionality, is owned by FieldShare and protected by US copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mt-2">
                You are granted a limited, non-exclusive, non-transferable license to use the Service for its intended purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Subscription and Payments</h2>
              
              <h3 className="text-xl font-semibold mb-2">7.1 Subscription Plans</h3>
              <p>
                Some features require a paid subscription. Subscription fees are billed monthly or annually as selected.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">7.2 Refunds</h3>
              <p>
                Subscription fees are non-refundable except as required by law or at our sole discretion.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">7.3 Cancellation</h3>
              <p>
                You may cancel your subscription at any time. Access continues until the end of the paid period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimer of Warranties</h2>
              <p className="uppercase font-semibold">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
              </p>
              <p className="mt-2">
                FieldShare does not guarantee:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Accuracy of adjacent field crop information</li>
                <li>Availability of weather data or external integrations</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Specific results from using the Service</li>
              </ul>
              <p className="mt-4 font-semibold">
                AGRICULTURAL DECISIONS ARE YOUR RESPONSIBILITY. Always verify information before making spraying decisions. FieldShare is a tool to assist, not replace, professional judgment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="uppercase font-semibold">
                IN NO EVENT SHALL FIELDSHARE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING CROP DAMAGE, LOSS OF PROFITS, OR DATA LOSS.
              </p>
              <p className="mt-4">
                Our total liability shall not exceed the amount you paid for the Service in the past 12 months, or $100, whichever is greater.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless FieldShare from any claims, damages, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your spraying decisions based on information from the platform</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account if you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate these Terms of Service</li>
                <li>Provide false information</li>
                <li>Engage in fraudulent activity</li>
                <li>Fail to pay subscription fees</li>
              </ul>
              <p className="mt-2">
                Upon termination, your right to access the Service ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the State of [Your State], United States, without regard to conflict of law provisions.
              </p>
              <p className="mt-2">
                Any disputes shall be resolved in the state or federal courts located in [Your County, State].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Material changes will be communicated via:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email notification</li>
                <li>Platform notice upon login</li>
                <li>30 days advance notice for significant changes</li>
              </ul>
              <p className="mt-2">
                Continued use after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
              <p>
                For questions about these Terms of Service:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> legal@fieldshare.app</li>
                <li><strong>Address:</strong> FieldShare Legal Department, [Your Business Address]</li>
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
