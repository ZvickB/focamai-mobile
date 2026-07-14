import { Alert, Linking, Pressable, Text, useWindowDimensions, View } from "react-native";
import { ScreenContainer, ScreenIntro } from "../components/MobileUI";

function PolicySection({ children, title }) {
  return (
    <View className="gap-3">
      <Text className="text-xl font-semibold leading-7 text-ink">{title}</Text>
      {children}
    </View>
  );
}

function PolicyText({ children }) {
  return <Text className="text-base leading-7 text-stone-600">{children}</Text>;
}

function PolicyBullet({ children }) {
  return (
    <View className="flex-row gap-3">
      <Text className="text-base leading-7 text-stone-400">•</Text>
      <Text className="flex-1 text-base leading-7 text-stone-600">{children}</Text>
    </View>
  );
}

function openExternalUrl(url) {
  Linking.openURL(url).catch(() =>
    Alert.alert("Could not open link", "No compatible app was found on this device."),
  );
}

export default function PrivacyScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;

  return (
    <ScreenContainer
      contentContainerStyle={{
        paddingHorizontal: isCompact ? 16 : 24,
        paddingVertical: isCompact ? 24 : 32,
      }}
    >
      <ScreenIntro
        eyebrow="Privacy Policy"
        title="How Focamai handles your information."
        description="This policy applies to the Focamai website and mobile app and reflects the features implemented as of July 13, 2026."
      />

      <View className="mt-8 gap-7">
        <PolicySection title="Information Focamai handles">
          <PolicyBullet>
            Search queries, refinement notes, retry feedback, selected Amazon marketplace, search
            results, generated recommendations, and result interactions.
          </PolicyBullet>
          <PolicyBullet>
            Account email, Supabase user ID, and authentication/session information. Mobile supports
            email and password accounts plus optional Google sign-in when account UI is enabled.
          </PolicyBullet>
          <PolicyBullet>
            Signed-out search history stored on the device, or account-backed saved searches when
            signed in. Price watches store product, marketplace, price, and alert settings and use
            the account email for alerts when enabled.
          </PolicyBullet>
          <PolicyBullet>
            Optional feedback, support details, and search diagnostics such as random session/search
            IDs, app version, platform, timestamps, errors, and performance information.
          </PolicyBullet>
          <PolicyBullet>
            Production mobile crash reports and serious app errors, plus sampled app-start and
            screen-performance measurements such as timing and frame health, when Sentry reporting
            is configured.
          </PolicyBullet>
          <PolicyBullet>
            Ordinary request data received by hosting providers, such as IP address and user-agent
            data. The backend also derives a one-way hashed IP key for rate limiting. Mobile does not
            request precise location or GPS permission; you select the Amazon marketplace directly.
          </PolicyBullet>
        </PolicySection>

        <PolicySection title="Voice search and microphone access">
          <PolicyText>
            Voice search is optional. After you grant microphone permission and choose the mic,
            Focamai records audio and sends it to the Focamai backend, which forwards it to OpenAI
            for transcription. The transcript becomes search text. The backend processes audio in
            memory and does not save it to Focamai's database. The app creates a temporary recording
            file managed by the device operating system. You can type instead or deny microphone
            permission.
          </PolicyText>
        </PolicySection>

        <PolicySection title="How information is used">
          <PolicyText>
            Focamai uses this information to run product discovery, AI refinement, recommendations,
            Deep Dive, saved searches, accounts, and price-watch alerts; to measure search and result
            interactions; and to diagnose failures, prevent abuse, respond to requests, and improve
            reliability.
          </PolicyText>
        </PolicySection>

        <PolicySection title="Services that process information">
          <PolicyText>
            Current services are Supabase for authentication and stored app data; OpenAI and
            Anthropic for AI processing; Rainforest API for Amazon product data and price checks;
            SerpApi when an eligible signed-in user explicitly runs Deep Dive; Render for backend
            hosting; Vercel for website hosting and web performance analytics; Sentry for backend
            errors plus configured mobile crash and sampled performance reporting; Resend for
            enabled price-watch emails; Google for optional sign-in and website web fonts; and
            Amazon and product-image hosts for product images, product pages, and affiliate
            attribution. Focamai's current code does not sell personal information or use it for
            targeted ads.
          </PolicyText>
        </PolicySection>

        <PolicySection title="Device storage, cookies, and analytics">
          <PolicyText>
            Mobile stores up to 50 signed-out search-history entries and Amazon marketplace
            preferences in device storage, and stores the Supabase session in secure device storage.
            The mobile app does not include an advertising analytics SDK. Search requests can still
            create backend operational, analytics, and diagnostic records. The website separately
            uses browser local storage plus Vercel Analytics and Speed Insights.
          </PolicyText>
          <PolicyText>
            Mobile Sentry reporting includes crashes, serious errors, and a 10% sample of app-start
            and screen-performance transactions. Performance events are scrubbed of user, request,
            extra, and breadcrumb data; default personally identifying information is disabled.
            Profiling, Session Replay, automatic session tracking, breadcrumbs, app-hang tracking,
            screen recording, and user-input recording are disabled.
          </PolicyText>
          <PolicyText>
            Focamai does not currently add advertising cookies. After you open an Amazon link,
            Amazon may use cookies or similar technologies on its service under its own privacy
            notice.
          </PolicyText>
        </PolicySection>

        <PolicySection title="Affiliate links">
          <PolicyText>
            Product links for stores where Focamai has an Amazon Associates tag may earn a
            commission from a qualifying purchase at no extra cost to you. Other supported local
            Amazon stores use ordinary, untagged links. Affiliate relationships do not change the
            current recommendation logic, which uses your search and refinement input rather than
            commission amount.
          </PolicyText>
        </PolicySection>

        <PolicySection title="Retention and deletion">
          <PolicyText>
            Search caches normally expire after 24 hours, although underlying database or hosting
            records may remain until cleanup. The code does not currently define one automatic
            deletion period for account records, internal search logs, analytics, diagnostics,
            crash reports, or feedback. Third-party providers may retain data under their own
            policies.
          </PolicyText>
          <PolicyText>
            Signed-in users can permanently delete their Focamai account under Settings → Account
            or at focamai.com/delete-account. This deletes the Supabase authentication user and the
            account-owned saved searches, price watches, and Deep Dive usage record linked to that
            user ID. The app also clears local saved-search history after successful deletion.
            Anonymous operational search logs, analytics, diagnostics, caches, rate-limit records,
            hosting logs, feedback, and third-party provider records are not deleted by this control
            when they cannot be reliably linked to the account.
          </PolicyText>
        </PolicySection>

        <PolicySection title="Security">
          <PolicyText>
            Production traffic uses encrypted HTTPS connections. Mobile authentication sessions are
            kept in secure device storage, and account-owned saved searches and price watches use
            Supabase row-level access controls. Server credentials remain on the backend, and known
            secret and authorization fields are removed from configured error context. Mobile crash
            reporting also removes user, request, extra, and breadcrumb fields before sending a
            JavaScript error event. No system can guarantee absolute security.
          </PolicyText>
        </PolicySection>

        <PolicySection title="Your choices, rights, and contact">
          <PolicyText>
            You can search without an account, type instead of using voice, manage user-facing
            history and price watches, and control local app data through device settings. Depending
            on your location, you may have rights to access, correct, or delete personal information.
            Identity may need to be verified before a request is completed.
          </PolicyText>
          <Pressable
            accessibilityRole="link"
            onPress={() => openExternalUrl("mailto:contact@focamai.com")}
          >
            <Text className="text-base font-semibold leading-7 text-accent underline underline-offset-4">
              Email contact@focamai.com for privacy or account-deletion requests
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => openExternalUrl("https://focamai.com/privacy")}
          >
            <Text className="text-base font-semibold leading-7 text-accent underline underline-offset-4">
              Read the current policy on focamai.com
            </Text>
          </Pressable>
        </PolicySection>
      </View>
    </ScreenContainer>
  );
}
