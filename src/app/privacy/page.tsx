import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <div className="w-full mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        <Card className="bg-black/70 border-green-600/50 rounded-lg shadow-xl overflow-hidden">
          <CardHeader className="border-b border-green-700/50">
            <CardTitle className="text-3xl sm:text-4xl font-bold text-green-400">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6 text-base sm:text-lg text-gray-200">
            <div>
              <span className="text-gray-400 font-semibold">Effective Date:</span> {new Date().toLocaleDateString()}
            </div>
            <div>
              Thank you for using our app! We value your privacy and are committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights as a user.
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">1. Information We Collect</h2>
              <ul className="list-disc pl-6">
                <li><span className="text-white font-semibold">Display Name:</span> Used to identify you within the app.</li>
                <li><span className="text-white font-semibold">Email Address:</span> Used for account management and communication.</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">2. How We Collect Information</h2>
              <div>
                We collect your display name and email address when you sign up or log in using Google. We do not collect any other personal information.
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6">
                <li>To provide and maintain our services.</li>
                <li>To communicate with you about your account or important updates.</li>
                <li>To ensure the security and integrity of our app.</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">4. Google Sign-In</h2>
              <div>
                We use Google as a sign-in provider. When you log in with Google, your display name and email address are shared with us. Google may also collect and process your information according to their own policies. For more details, please review the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue-400">Google Privacy Policy</a>.
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">5. Cookies and Analytics</h2>
              <div>
                We do <span className="font-semibold text-white">not</span> currently use cookies or analytics tools to track your activity. If we add analytics (such as PostHog) in the future, we will update this policy to explain what data is collected and how it is used.
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">6. Data Sharing</h2>
              <div>
                We do <span className="font-semibold text-white">not</span> share your personal information with third parties, except as necessary to provide authentication via Google.
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">7. Children’s Privacy</h2>
              <div>
                Our app is not directed at children under 18. We do not knowingly collect personal information from children under 18. If you believe a child has provided us with personal information, please contact us so we can remove it.
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">8. Your Rights</h2>
              <div>
                You may request to access, update, or delete your personal information at any time by contacting us at <a href="mailto:darrellmiers@fullcomboesports.com" className="underline text-blue-400">darrellmiers@fullcomboesports.com</a>.
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">9. Changes to This Policy</h2>
              <div>
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-300">10. Contact Us</h2>
              <div>
                If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:darrellmiers@fullcomboesports.com" className="underline text-blue-400">darrellmiers@fullcomboesports.com</a>.
              </div>
            </div>
            {/* <div className="mt-8 text-sm text-gray-500">
              <p>
                <span className="font-semibold text-green-300">Note for Developers:</span> This page is required for Google sign-in and is a best practice for user trust and legal compliance. If you add analytics or other data collection in the future, update this policy accordingly.
              </p>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 