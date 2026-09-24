import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <div className="legal-introduction">
        <p>
          TapIt is a social fitness application designed to help users stay
          consistent with physical activity through check-ins, weekly goals,
          points, streaks, leaderboards, and social accountability.
        </p>
        <p>
          This Privacy Policy explains what information TapIt collects, why we
          use it, how it is shared, and the choices available to you.
        </p>
        <p>
          For privacy questions or requests, contact:{" "}
          <a href="mailto:quentin.canaguier@mail.mcgill.ca">
            quentin.canaguier@mail.mcgill.ca
          </a>
        </p>
      </div>

      <section>
        <h2>1. Information We Collect</h2>
        <h3>Account information</h3>
        <p>
          When you create a TapIt account, we collect information necessary to
          create and operate your account, including:
        </p>
        <ul>
          <li>your email address;</li>
          <li>your username;</li>
          <li>authentication credentials;</li>
          <li>a unique account identifier; and</li>
          <li>account and profile creation information.</li>
        </ul>
        <p>
          Passwords are handled through our authentication provider, Supabase.
          TapIt does not store your password in its public application database.
        </p>

        <h3>Fitness activity and check-in information</h3>
        <p>
          When you use TapIt, we may process and store information including:
        </p>
        <ul>
          <li>completed check-ins;</li>
          <li>the TapIt location associated with a check-in;</li>
          <li>the NFC tag associated with a check-in;</li>
          <li>check-in date and time;</li>
          <li>points earned;</li>
          <li>weekly fitness goals;</li>
          <li>weekly goal progress and completions;</li>
          <li>bonuses;</li>
          <li>current and previous streaks; and</li>
          <li>statistics derived from this activity.</li>
        </ul>
        <p>
          This information is used to operate TapIt&apos;s check-in, points, goal,
          streak, leaderboard, and recap features.
        </p>

        <h3>Social information</h3>
        <p>
          If you use TapIt&apos;s social features, we process information about:
        </p>
        <ul>
          <li>friend requests;</li>
          <li>accepted friendships; and</li>
          <li>fitness statistics shared with accepted friends.</li>
        </ul>

        <h3>Location information</h3>
        <p>
          Some TapIt locations may require device location verification to
          confirm that you are physically near the location when checking in.
        </p>
        <p>
          When location verification is required, TapIt may request your
          device&apos;s:
        </p>
        <ul>
          <li>latitude;</li>
          <li>longitude; and</li>
          <li>estimated location accuracy.</li>
        </ul>
        <p>
          This information is requested only when you intentionally attempt a
          check-in at a location requiring verification.
        </p>
        <p>
          Your device location is used temporarily to calculate whether you are
          close enough to the TapIt location. TapIt does not intentionally store
          your device latitude, longitude, accuracy, or calculated distance in
          its application database.
        </p>
        <p>
          The configured coordinates and verification radius of TapIt venues
          are stored separately as venue information.
        </p>
        <p>
          If you deny location permission, you may be unable to complete a
          check-in at locations requiring location verification.
        </p>

        <h3>Technical information</h3>
        <p>
          Our infrastructure providers may automatically process technical
          information necessary to provide and secure the service, which may
          include:
        </p>
        <ul>
          <li>IP address;</li>
          <li>browser and device information;</li>
          <li>request timestamps;</li>
          <li>requested URLs;</li>
          <li>authentication/session information; and</li>
          <li>diagnostic or security logs.</li>
        </ul>
        <p>
          The exact information and retention periods may depend on the
          infrastructure provider.
        </p>
      </section>

      <section>
        <h2>2. Information We Do Not Currently Collect</h2>
        <p>TapIt does not currently collect:</p>
        <ul>
          <li>your legal name;</li>
          <li>date of birth;</li>
          <li>phone number;</li>
          <li>postal address;</li>
          <li>payment or banking information;</li>
          <li>medical records or diagnoses;</li>
          <li>Apple Health, Google Fit, or wearable health data;</li>
          <li>contact-book data;</li>
          <li>photos or file uploads;</li>
          <li>private messages;</li>
          <li>biometric identifiers;</li>
          <li>advertising identifiers; or</li>
          <li>persistent device-location history.</li>
        </ul>
        <p>
          TapIt does process fitness-related activity, such as attendance,
          goals, and streaks. This information can reveal patterns about your
          fitness activity even though TapIt does not collect medical records.
        </p>
      </section>

      <section>
        <h2>3. How We Use Information</h2>
        <p>We use personal information to:</p>
        <ul>
          <li>create and authenticate accounts;</li>
          <li>maintain user profiles;</li>
          <li>operate TapIt check-ins;</li>
          <li>verify proximity to participating locations when required;</li>
          <li>prevent duplicate, fraudulent, or abusive check-ins;</li>
          <li>award points and bonuses;</li>
          <li>calculate weekly goals, progress, and streaks;</li>
          <li>provide friend functionality;</li>
          <li>operate leaderboards;</li>
          <li>generate weekly recaps;</li>
          <li>maintain security;</li>
          <li>investigate technical problems or abuse; and</li>
          <li>operate and improve the reliability of TapIt.</li>
        </ul>
        <p>We do not currently use personal information for targeted advertising.</p>
        <p>We do not sell personal information.</p>
      </section>

      <section>
        <h2>4. Social Features and Visibility</h2>
        <p>TapIt includes social and leaderboard functionality.</p>
        <p>
          Your username and total points may be visible to other authenticated
          TapIt users through features such as leaderboards and user search.
        </p>
        <p>
          Accepted friends may additionally see limited fitness-related
          information such as:
        </p>
        <ul>
          <li>weekly goal;</li>
          <li>weekly progress;</li>
          <li>whether a goal was completed;</li>
          <li>current streak;</li>
          <li>best streak; and</li>
          <li>weekly recap information.</li>
        </ul>
        <p>
          Your email address and raw check-in history are not displayed to other
          users through these features.
        </p>
        <p>
          TapIt&apos;s current &quot;McGill&quot; leaderboard does not independently verify
          whether a user is enrolled at or affiliated with McGill University.
        </p>
      </section>

      <section>
        <h2>5. Cookies and Authentication</h2>
        <p>
          TapIt uses essential authentication cookies provided through Supabase
          to keep you signed in and protect authenticated areas of the service.
        </p>
        <p>
          TapIt currently does not use advertising cookies, analytics cookies,
          tracking pixels, or device fingerprinting.
        </p>
        <p>Essential authentication cookies are necessary for the service to function.</p>
      </section>

      <section>
        <h2>6. Service Providers</h2>
        <h3>Supabase</h3>
        <p>
          Supabase provides authentication and database infrastructure.
          Information processed through Supabase may include account
          information, authentication data, profiles, points, check-ins, goals,
          friendships, and temporary location-verification inputs.
        </p>
        <h3>Hosting provider</h3>
        <p>
          TapIt&apos;s hosting provider, including Vercel where applicable, processes
          web requests required to provide the application. This may include
          authentication requests, cookies, IP addresses, request metadata, and
          information transmitted through server requests.
        </p>
        <h3>Device and browser location services</h3>
        <p>
          When you authorize location verification, your browser and operating
          system may use their own location services. Their processing of
          location information is also governed by the policies applicable to
          those services.
        </p>
        <p>
          We may change infrastructure providers as TapIt develops. We will
          update this Policy where appropriate if those changes materially
          affect how personal information is handled.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain account and activity information for as long as reasonably
          necessary to operate your account and provide TapIt&apos;s features, unless
          a longer retention period is required or permitted by law.
        </p>
        <p>
          Some historical information, such as check-ins and weekly goals, may
          be retained while your account exists because it is necessary to
          calculate points, progress, streaks, and historical statistics.
        </p>
        <p>
          When an account is deleted, TapIt will delete or cause the deletion of
          personal information associated with that account from its active
          application database, subject to information that must be retained for
          legitimate security, legal, fraud-prevention, or compliance purposes.
        </p>
        <p>
          Information may remain temporarily in backups, security logs, or
          infrastructure systems according to the retention practices of our
          service providers before being deleted or overwritten.
        </p>
        <p>
          We aim not to retain personal information longer than necessary for
          the purposes for which it was collected.
        </p>
      </section>

      <section>
        <h2>8. Account Deletion</h2>
        <p>
          You may delete your TapIt account through the account settings or
          contact us at quentin.canaguier@mail.mcgill.ca.
        </p>
        <p>
          Deleting your account is intended to permanently remove the TapIt
          profile and associated application data, including check-ins, weekly
          goals and completions, friendships, and friend requests from the active
          application database.
        </p>
        <p>
          Deletion may not immediately remove information contained in temporary
          backups, security records, or infrastructure logs.
        </p>
        <p>Account deletion is irreversible.</p>
      </section>

      <section>
        <h2>9. Access and Correction</h2>
        <p>
          You may request access to personal information TapIt holds about you or
          request correction of inaccurate information by contacting
          quentin.canaguier@mail.mcgill.ca.
        </p>
        <p>
          We may need to verify your identity before processing a privacy request.
        </p>
        <p>
          Applicable privacy laws may provide additional rights or exceptions
          depending on your circumstances.
        </p>
      </section>

      <section>
        <h2>10. Security</h2>
        <p>
          We use technical and organizational safeguards designed to protect
          personal information.
        </p>
        <p>
          Current measures include authenticated access controls, database Row
          Level Security, restricted database operations, secure server-side
          functions, authentication checks, and restrictions on direct
          modification of check-ins and points.
        </p>
        <p>However, no online service can guarantee absolute security.</p>
      </section>

      <section>
        <h2>11. Children and Age Requirement</h2>
        <p>TapIt is intended for users 16 years of age or older.</p>
        <p>You may not create or use a TapIt account if you are under 16.</p>
      </section>

      <section>
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy as TapIt develops, including when we
          add new features or change how information is processed.
        </p>
        <p>
          If changes materially affect how personal information is handled, we
          will take reasonable steps to inform users as appropriate.
        </p>
        <p>
          The effective date at the top of this Policy indicates when the current
          version took effect.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          For privacy questions, requests, complaints, account deletion requests,
          or concerns regarding this Policy, contact:
        </p>
        <address>
          TapIt
          <br />
          Email:{" "}
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
