import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface TermsAndConditionsProps {
  accepted: boolean
  onAcceptChange: (accepted: boolean) => void
}

export function TermsAndConditions({ accepted, onAcceptChange }: TermsAndConditionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">Terms and Conditions</h3>

      <ScrollArea className="h-60 rounded-md border p-4">
        <div className="space-y-4">
          <h4 className="font-medium text-lg">1. Account Security and Credential Sharing</h4>
          <p>
            You agree not to share your account credentials (username, password, access tokens) with any other person.
            Your account is for your personal use only, and sharing access credentials is strictly prohibited and may
            result in immediate termination of your subscription without refund.
          </p>

          <h4 className="font-medium text-lg">2. No Sharing of Links</h4>
          <p>
            All access links, session links, and private URLs provided to you through our platform are strictly for your
            personal use. Sharing these links with others, posting them publicly, or distributing them in any way is
            prohibited and constitutes a violation of these terms.
          </p>

          <h4 className="font-medium text-lg">3. Confidentiality of Inside Information</h4>
          <p>
            Any inside information, proprietary techniques, or exclusive content shared during sessions or through our
            platform is confidential. You agree not to share, distribute, or publish this information through any medium
            including social media, blogs, or other platforms.
          </p>

          <h4 className="font-medium text-lg">4. Payment and Refund Policy</h4>
          <p>
            <strong>All payments made for subscriptions are non-refundable</strong> unless specifically stated as part
            of a special offer. If a special offer includes a refund option, the specific terms of that refund will be
            clearly stated with the offer. By proceeding with payment, you acknowledge and agree to this refund policy.
          </p>

          <h4 className="font-medium text-lg">5. Prohibited Use of Content</h4>
          <p>
            You agree not to misuse, copy, record, download, redistribute, or modify any data, videos, or content
            provided through our platform. All content is protected by copyright and other intellectual property laws.
            Any unauthorized use, reproduction, or distribution is strictly prohibited.
          </p>

          <h4 className="font-medium text-lg">6. Subscription Terms</h4>
          <p>
            Your subscription is valid for the period specified at the time of purchase. Access to premium content will
            automatically expire at the end of your subscription period unless renewed.
          </p>

          <h4 className="font-medium text-lg">7. Code of Conduct</h4>
          <p>
            You agree to behave respectfully during live sessions and in any community interactions. Harassment,
            inappropriate behavior, or disruptive actions may result in termination of your subscription without refund.
          </p>

          <h4 className="font-medium text-lg">8. Technical Requirements</h4>
          <p>
            It is your responsibility to ensure you have the necessary technical requirements (internet connection,
            device compatibility, etc.) to access our content. Technical issues on your end do not qualify for refunds.
          </p>

          <h4 className="font-medium text-lg">9. Changes to Terms</h4>
          <p>
            We reserve the right to modify these terms at any time. Continued use of our services after such changes
            constitutes acceptance of the new terms.
          </p>

          <h4 className="font-medium text-lg">10. Privacy Policy</h4>
          <p>
            Your personal information will be handled in accordance with our Privacy Policy. By accepting these terms,
            you also acknowledge and agree to our Privacy Policy.
          </p>

          <h4 className="font-medium text-lg">11. Limitation of Liability</h4>
          <p>
            We strive to provide high-quality content and services, but we make no guarantees about the results you may
            achieve. We are not liable for any direct, indirect, incidental, or consequential damages arising from your
            use of our platform or services.
          </p>

          <h4 className="font-medium text-lg">12. Governing Law</h4>
          <p>
            These terms and conditions are governed by the laws of India. Any disputes arising from these terms will be
            subject to the exclusive jurisdiction of the courts in India.
          </p>
        </div>
      </ScrollArea>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => onAcceptChange(checked as boolean)} />
        <Label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I have read and agree to the terms and conditions
        </Label>
      </div>
    </div>
  )
}
