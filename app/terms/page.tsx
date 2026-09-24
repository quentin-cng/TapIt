import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <div className="legal-introduction">
        <p>Welcome to TapIt.</p>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of TapIt and its
          websites, applications, check-in systems, and related services
          (collectively, the &quot;Service&quot;).
        </p>
        <p>
          By creating an account or using TapIt, you agree to these Terms. If you
          do not agree to these Terms, do not use TapIt.
        </p>
        <p>
          For questions, contact:{" "}
          <a href="mailto:quentin.canaguier@mail.mcgill.ca">
            quentin.canaguier@mail.mcgill.ca
          </a>
        </p>
      </div>

      <section>
        <h2>1. Eligibility</h2>
        <p>You must be at least 16 years old to use TapIt.</p>
        <p>
          By creating an account, you represent that you meet this requirement
          and that the information you provide is accurate.
        </p>
      </section>

      <section>
        <h2>2. What TapIt Does</h2>
        <p>TapIt is a social fitness consistency and accountability service.</p>
        <p>TapIt allows users to participate in features that may include:</p>
        <ul>
          <li>physical-location check-ins initiated using NFC tags;</li>
          <li>points;</li>
          <li>weekly activity goals;</li>
          <li>streaks;</li>
          <li>leaderboards;</li>
          <li>friends;</li>
          <li>weekly recaps; and</li>
          <li>other motivational fitness features.</li>
        </ul>
        <p>Some check-ins may require device-location verification.</p>
        <p>
          TapIt may change, add, remove, or modify features as the Service develops.
        </p>
      </section>

      <section>
        <h2>3. Accounts</h2>
        <p>
          You are responsible for maintaining the security of your account and
          authentication credentials.
        </p>
        <p>You may not:</p>
        <ul>
          <li>share your account for the purpose of manipulating TapIt activity;</li>
          <li>impersonate another person;</li>
          <li>access another user&apos;s account without authorization; or</li>
          <li>create accounts for fraudulent or abusive purposes.</li>
        </ul>
        <p>
          You are responsible for activity performed through your account to the
          extent permitted by applicable law.
        </p>
      </section>

      <section>
        <h2>4. Check-ins</h2>
        <p>
          TapIt check-ins are intended to represent genuine attendance at
          participating physical locations.
        </p>
        <p>
          A valid check-in may award points and contribute toward goals, streaks,
          leaderboards, and other TapIt statistics.
        </p>
        <p>
          TapIt may impose limitations on check-ins, including cooldown periods
          and location-verification requirements.
        </p>
        <p>Currently, rewarded check-ins are subject to a global four-hour cooldown.</p>
      </section>

      <section>
        <h2>5. Location Verification</h2>
        <p>Some participating locations may require location verification.</p>
        <p>
          If required, TapIt may ask your browser or device for permission to
          obtain your current location to determine whether you are sufficiently
          close to the participating location.
        </p>
        <p>
          If you deny permission or if your device cannot provide sufficiently
          accurate location information, you may be unable to complete that check-in.
        </p>
        <p>
          The handling of this information is described in the TapIt{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>6. Points, Goals and Streaks</h2>
        <p>
          TapIt points, goals, streaks, rankings, and similar statistics are
          motivational features.
        </p>
        <p>Currently:</p>
        <ul>
          <li>a valid rewarded check-in awards 10 points;</li>
          <li>check-ins are subject to applicable cooldown rules; and</li>
          <li>
            completing a weekly goal may award a one-time bonus based on that goal.
          </li>
        </ul>
        <p>TapIt may modify scoring and game mechanics as the Service develops.</p>
        <p>TapIt points have no monetary or cash value.</p>
        <p>
          They cannot currently be purchased, sold, transferred, redeemed for
          money, or exchanged for property.
        </p>
        <p>
          TapIt may correct points, streaks, check-ins, or rankings when necessary
          to address bugs, abuse, fraud, or incorrect calculations.
        </p>
      </section>

      <section>
        <h2>7. Fair Use and Anti-Cheating</h2>
        <p>
          You may not attempt to manipulate TapIt&apos;s check-in, points, streak,
          goal, friendship, or leaderboard systems.
        </p>
        <p>Prohibited conduct includes:</p>
        <ul>
          <li>falsifying your physical location;</li>
          <li>using GPS spoofing to obtain a check-in;</li>
          <li>
            sharing, publishing, copying, modifying, or misusing TapIt NFC
            check-in URLs or tokens for fraudulent check-ins;
          </li>
          <li>tampering with physical TapIt NFC tags;</li>
          <li>replaying or automating check-in requests;</li>
          <li>circumventing cooldown restrictions;</li>
          <li>exploiting bugs to obtain points or bonuses;</li>
          <li>
            attempting unauthorized access to TapIt&apos;s databases, APIs,
            accounts, or infrastructure; or
          </li>
          <li>helping another person circumvent these rules.</li>
        </ul>
        <p>
          We may invalidate fraudulent activity, remove improperly obtained
          points, restrict access, suspend an account, or terminate an account
          where reasonably necessary to protect the Service or other users.
        </p>
      </section>

      <section>
        <h2>8. Social Features and Conduct</h2>
        <p>TapIt includes social functionality.</p>
        <p>You agree not to use TapIt to:</p>
        <ul>
          <li>harass other users;</li>
          <li>repeatedly send unwanted friend requests;</li>
          <li>impersonate another person;</li>
          <li>
            use abusive, threatening, discriminatory, or unlawful usernames or
            conduct;
          </li>
          <li>interfere with another person&apos;s use of TapIt; or</li>
          <li>use the Service for unlawful purposes.</li>
        </ul>
        <p>
          We may remove content, usernames, activity, or accounts that violate
          these Terms or create security or safety risks.
        </p>
      </section>

      <section>
        <h2>9. Physical Activity and Safety</h2>
        <p>TapIt is a motivational technology product.</p>
        <p>
          TapIt does not provide medical, health, fitness, training, or
          professional advice.
        </p>
        <p>
          Points, goals, streaks, leaderboards, and other features should not be
          interpreted as recommendations regarding how often or how intensely
          you should exercise.
        </p>
        <p>
          You are responsible for deciding what physical activity is appropriate
          for you.
        </p>
        <p>
          You must follow the rules and safety requirements of any gym,
          university, club, facility, or other physical location you visit.
        </p>
      </section>

      <section>
        <h2>10. Participating Locations and Third Parties</h2>
        <p>
          TapIt may operate at or reference gyms, universities, clubs, or other
          third-party locations.
        </p>
        <p>
          Unless expressly stated otherwise, the presence of a TapIt NFC tag or
          location in the Service does not imply sponsorship, endorsement,
          partnership, or responsibility by that organization.
        </p>
        <p>
          TapIt is responsible for the TapIt Service, not for the operation,
          safety, availability, equipment, or policies of third-party facilities.
        </p>
      </section>

      <section>
        <h2>11. McGill References</h2>
        <p>
          TapIt may currently use &quot;McGill&quot; to identify certain locations or
          communities.
        </p>
        <p>
          Unless expressly stated otherwise, TapIt is not an official service of,
          endorsed by, or affiliated with McGill University.
        </p>
        <p>
          TapIt does not currently independently verify the university
          affiliation of users appearing in the General leaderboard.
        </p>
      </section>

      <section>
        <h2>12. Service Availability</h2>
        <p>
          TapIt is an early-stage service and may experience bugs, interruptions,
          inaccurate statistics, or unavailable features.
        </p>
        <p>We do not guarantee that:</p>
        <ul>
          <li>TapIt will always be available;</li>
          <li>every NFC check-in will succeed;</li>
          <li>location verification will always be accurate;</li>
          <li>points or streak calculations will always be error-free;</li>
          <li>leaderboard positions will always be current; or</li>
          <li>the Service will remain unchanged.</li>
        </ul>
        <p>
          Where reasonable, we may correct errors affecting check-ins, points,
          streaks, or other statistics.
        </p>
      </section>

      <section>
        <h2>13. Privacy</h2>
        <p>
          Your use of TapIt is also governed by our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          The Privacy Policy explains how TapIt collects, uses, processes,
          shares, retains, and protects personal information.
        </p>
      </section>

      <section>
        <h2>14. Suspension and Termination</h2>
        <p>You may stop using TapIt at any time.</p>
        <p>
          You may also delete your account using the account-deletion
          functionality provided by TapIt or contact us for assistance.
        </p>
        <p>
          We may restrict, suspend, or terminate access where reasonably
          necessary because of:
        </p>
        <ul>
          <li>violations of these Terms;</li>
          <li>fraudulent check-ins;</li>
          <li>abuse of other users;</li>
          <li>security threats;</li>
          <li>attempts to manipulate TapIt systems; or</li>
          <li>legal requirements.</li>
        </ul>
      </section>

      <section>
        <h2>15. Intellectual Property</h2>
        <p>
          TapIt and its original software, branding, designs, graphics, and other
          original materials are owned by their respective TapIt creators or
          licensors and are protected by applicable intellectual-property laws.
        </p>
        <p>
          These Terms do not transfer ownership of TapIt intellectual property to users.
        </p>
        <p>
          You may use the Service only for its intended personal use unless TapIt
          gives you permission otherwise.
        </p>
      </section>

      <section>
        <h2>16. Disclaimer</h2>
        <p>
          To the extent permitted by applicable law, TapIt is provided on an
          &quot;as available&quot; basis.
        </p>
        <p>
          TapIt does not guarantee specific fitness, health, motivational,
          academic, social, or other results from using the Service.
        </p>
        <p>
          Nothing in these Terms excludes rights or protections that cannot
          legally be excluded under applicable law.
        </p>
      </section>

      <section>
        <h2>17. Limitation of Liability</h2>
        <p>
          To the extent permitted by applicable law, TapIt and its operators will
          not be responsible for indirect, incidental, special, or consequential
          losses resulting from use of or inability to use the Service.
        </p>
        <p>
          Nothing in these Terms limits liability where such limitation is
          prohibited by applicable law.
        </p>
      </section>

      <section>
        <h2>18. Changes to the Service or Terms</h2>
        <p>TapIt may modify these Terms as the Service develops.</p>
        <p>
          If a change materially affects users&apos; rights or obligations, we will
          take reasonable steps to provide notice as appropriate.
        </p>
        <p>The effective date above identifies the current version.</p>
      </section>

      <section>
        <h2>19. Governing Law</h2>
        <p>
          These Terms are governed by the laws applicable in Quebec, Canada,
          subject to any mandatory consumer or other legal protections that apply
          to you.
        </p>
      </section>

      <section>
        <h2>20. Contact</h2>
        <p>Questions regarding these Terms may be sent to:</p>
        <address>
          TapIt
          <br />
          <a href="mailto:quentin.canaguier@mail.mcgill.ca">
            quentin.canaguier@mail.mcgill.ca
          </a>
          <br />
          Quebec, Canada
        </address>
      </section>
    </LegalPage>
  );
}
