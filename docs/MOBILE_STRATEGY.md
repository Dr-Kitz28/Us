# Mobile Strategy & Implementation Guide

## Overview
Production-grade mobile strategy for India-first dating app targeting Gen-Z and Gen-Alpha.

## Technology Stack Decision

### Recommended: **Flutter**
**Rationale:**
- **India-first performance:** Stable on low/mid-range Android (dominant in India)
- **Consistency:** Single codebase, predictable UI across iOS/Android
- **Animation/motion:** Excellent support for delightful interactions
- **Hot reload:** Fast iteration cycles
- **Growing ecosystem:** Strong community + Google backing

### Alternative: **React Native (TypeScript)**
**When to choose:**
- Team is JavaScript-heavy
- Need to share business logic with web
- Prioritize web-app parity

**Trade-offs:**
- Performance tuning needed for complex lists
- Platform-specific bugs more common

---

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────┐
│     Presentation Layer (UI)         │
│  - Screens, Widgets, State Mgmt    │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│      Domain Layer (Use Cases)       │
│  - Business Logic, Entities          │
└─────────────────────────────────────┘
              ▼
┌─────────────────────────────────────┐
│       Data Layer (Repository)        │
│  - API Client, Local DB, Cache      │
└─────────────────────────────────────┘
```

### Directory Structure

```
lib/
├── core/
│   ├── constants/
│   ├── errors/
│   ├── network/
│   └── utils/
├── features/
│   ├── auth/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── discover/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── matches/
│   ├── messages/
│   └── profile/
└── main.dart
```

---

## Non-Functional Requirements (India-specific)

### Performance Budgets
- **Cold start:** < 2.5s on mid-range Android
- **Feed load (p95):** < 800ms on 4G
- **Memory footprint:** < 150MB steady-state
- **APK size:** < 50MB (before install)
- **Battery drain:** < 5% per hour of active use

### Network Resilience
- **Support 2G/3G:** Graceful degradation
- **Retry logic:** Exponential backoff with jitter
- **Offline mode:** Queue actions locally, replay on reconnect
- **Image optimization:**
  - Serve WebP/AVIF where supported
  - Progressive loading (low-res → high-res)
  - Client-side resize before upload

### Device Support
- **Android:** API 21+ (Lollipop, 2014+)
- **iOS:** 13+ (iPhone 6S and newer)
- **Test matrix:**
  - Low-end: Redmi 9A, Samsung Galaxy A10
  - Mid-range: Redmi Note 10, Realme 8
  - High-end: OnePlus 10T, iPhone 12

---

## Security (Mobile-Specific)

### Token Storage
```dart
// Use platform-secure storage
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Store
await storage.write(key: 'access_token', value: token);

// Retrieve
final token = await storage.read(key: 'access_token');
```

### Certificate Pinning (Optional, Careful)
```dart
import 'package:dio/dio.dart';

final dio = Dio()
  ..options.baseUrl = 'https://api.dating-app.com'
  ..interceptors.add(InterceptorsWrapper(
    onError: (error, handler) {
      // Handle pinning failures gracefully
    },
  ));

// Pin only if you have rapid rotation plan
```

### Root/Jailbreak Detection (Soft Signals)
```dart
import 'package:flutter_jailbreak_detection/flutter_jailbreak_detection.dart';

final isJailbroken = await FlutterJailbreakDetection.jailbroken;
final isDeveloper = await FlutterJailbreakDetection.developerMode;

// Don't block, just send risk signal to backend
```

---

## State Management

### Recommended: **Riverpod 2.x**
```dart
// Provider definition
final userProfileProvider = FutureProvider.autoDispose<UserProfile>((ref) async {
  final api = ref.watch(apiClientProvider);
  return await api.getUserProfile();
});

// UI consumption
Consumer(
  builder: (context, ref, child) {
    final profileAsync = ref.watch(userProfileProvider);
    
    return profileAsync.when(
      data: (profile) => ProfileView(profile),
      loading: () => CircularProgressIndicator(),
      error: (error, stack) => ErrorView(error),
    );
  },
);
```

### Alternatives
- **BLoC:** Good for complex flows, more boilerplate
- **GetX:** Fast but less type-safe
- **Provider:** Lightweight, good for small apps

---

## Networking

### API Client (Dio + Retry)
```dart
import 'package:dio/dio.dart';
import 'package:dio_smart_retry/dio_smart_retry.dart';

final dio = Dio(
  BaseOptions(
    baseUrl: 'https://api.dating-app.com',
    connectTimeout: Duration(seconds: 10),
    receiveTimeout: Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
    },
  ),
);

// Retry interceptor
dio.interceptors.add(
  RetryInterceptor(
    dio: dio,
    retries: 3,
    retryDelays: [
      Duration(seconds: 1),
      Duration(seconds: 2),
      Duration(seconds: 4),
    ],
  ),
);

// Auth interceptor
dio.interceptors.add(
  InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await getAccessToken();
      options.headers['Authorization'] = 'Bearer $token';
      return handler.next(options);
    },
    onError: (error, handler) async {
      if (error.response?.statusCode == 401) {
        // Refresh token
        final newToken = await refreshAccessToken();
        // Retry original request
        final opts = error.requestOptions;
        opts.headers['Authorization'] = 'Bearer $newToken';
        final response = await dio.fetch(opts);
        return handler.resolve(response);
      }
      return handler.next(error);
    },
  ),
);
```

---

## Local Storage

### Database: **Drift (SQLite)**
```dart
import 'package:drift/drift.dart';

// Table definition
class Profiles extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get userId => text()();
  TextColumn get name => text()();
  IntColumn get age => integer()();
  TextColumn get bio => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();
}

// Database class
@DriftDatabase(tables: [Profiles])
class AppDatabase extends _$AppDatabase {
  AppDatabase(QueryExecutor e) : super(e);
  
  @override
  int get schemaVersion => 1;
  
  Future<List<Profile>> getCachedProfiles() => select(profiles).get();
  
  Future<void> cacheProfile(ProfilesCompanion profile) {
    return into(profiles).insert(profile, mode: InsertMode.replace);
  }
}
```

---

## Image Handling

### Cached Network Images
```dart
import 'package:cached_network_image/cached_network_image.dart';

CachedNetworkImage(
  imageUrl: profile.photoUrl,
  placeholder: (context, url) => Shimmer.fromColors(
    baseColor: Colors.grey[300]!,
    highlightColor: Colors.grey[100]!,
    child: Container(color: Colors.white),
  ),
  errorWidget: (context, url, error) => Icon(Icons.error),
  fit: BoxFit.cover,
  memCacheWidth: 800, // Resize in memory
  maxHeightDiskCache: 1200, // Resize on disk
);
```

### Image Upload with Compression
```dart
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';

Future<File?> pickAndCompressImage() async {
  final picker = ImagePicker();
  final picked = await picker.pickImage(source: ImageSource.gallery);
  
  if (picked == null) return null;
  
  final compressed = await FlutterImageCompress.compressAndGetFile(
    picked.path,
    '${picked.path}_compressed.jpg',
    quality: 85,
    minWidth: 1080,
    minHeight: 1080,
  );
  
  return compressed;
}
```

---

## Analytics & Crash Reporting

### Firebase Crashlytics + Analytics
```dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_analytics/firebase_analytics.dart';

// Initialize
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Crashlytics
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterError;
  
  runApp(MyApp());
}

// Log event
FirebaseAnalytics.instance.logEvent(
  name: 'profile_viewed',
  parameters: {
    'profile_id': profileId,
    'source': 'discover_feed',
  },
);

// Log custom error
FirebaseCrashlytics.instance.recordError(
  error,
  stack,
  reason: 'Match creation failed',
);
```

---

## Push Notifications

### FCM Setup
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

// Get token
final fcmToken = await FirebaseMessaging.instance.getToken();
// Send to backend

// Handle foreground messages
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  // Show in-app notification
});

// Handle background messages
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Process notification
}
```

---

## Release Process

### 1. Version Management (semantic versioning)
```yaml
# pubspec.yaml
version: 1.2.3+45
# 1.2.3 = version name (user-facing)
# 45 = version code (build number, incremental)
```

### 2. Build Flavors (dev, staging, prod)
```
lib/
├── main_dev.dart
├── main_staging.dart
└── main_prod.dart
```

```bash
# Build Android
flutter build apk --flavor prod --release

# Build iOS
flutter build ipa --flavor prod --release
```

### 3. Code Signing
- **Android:** Generate upload keystore, configure `android/key.properties`
- **iOS:** Configure provisioning profiles in Xcode

### 4. App Store Submission
- **Google Play:** Upload AAB via Play Console
- **App Store:** Upload via Xcode or Transporter

---

## Testing Strategy

### Unit Tests
```dart
void main() {
  group('MatchingAlgorithm', () {
    test('calculates reciprocal score correctly', () {
      final algo = MatchingAlgorithm();
      final score = algo.calculateReciprocalScore(0.8, 0.7, 0.9);
      expect(score, closeTo(0.504, 0.001));
    });
  });
}
```

### Widget Tests
```dart
void main() {
  testWidgets('SwipeCard displays user name', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SwipeCard(profile: mockProfile),
      ),
    );
    
    expect(find.text('John, 25'), findsOneWidget);
  });
}
```

### Integration Tests
```dart
void main() {
  testWidgets('Complete swipe flow', (WidgetTester tester) async {
    await tester.pumpWidget(MyApp());
    
    // Login
    await tester.enterText(find.byKey(Key('phone_input')), '+919876543210');
    await tester.tap(find.byKey(Key('login_button')));
    await tester.pumpAndSettle();
    
    // Swipe
    await tester.drag(find.byType(SwipeCard), Offset(500, 0));
    await tester.pumpAndSettle();
    
    expect(find.text('It\'s a Match!'), findsOneWidget);
  });
}
```

---

## Performance Monitoring

### Firebase Performance
```dart
final trace = FirebasePerformance.instance.newTrace('feed_load');
await trace.start();

// Load feed
final feed = await api.getFeed();

trace.setMetric('profile_count', feed.length);
await trace.stop();
```

---

## Localization (India Languages)

### Setup
```yaml
# pubspec.yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.18.0
```

```dart
// main.dart
MaterialApp(
  localizationsDelegates: [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    AppLocalizations.delegate,
  ],
  supportedLocales: [
    Locale('en'),
    Locale('hi'), // Hindi
    Locale('ta'), // Tamil
    // Add more as needed
  ],
);
```

---

## Deployment Automation

### Fastlane (CI/CD)
```ruby
# android/fastlane/Fastfile
lane :deploy_to_play_store do
  gradle(task: 'bundle', build_type: 'Release')
  upload_to_play_store(
    track: 'internal',
    aab: '../build/app/outputs/bundle/release/app-release.aab'
  )
end
```

---

## Go-Live Checklist

- [ ] Store listings prepared (screenshots, descriptions)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Age verification (18+) implemented
- [ ] Push notifications configured
- [ ] Analytics tracking verified
- [ ] Crash reporting verified
- [ ] API rate limits configured
- [ ] Kill switches tested (disable features remotely)
- [ ] Support email/phone configured
- [ ] Moderation queue staffed
- [ ] Load testing completed (backend)
- [ ] Security audit completed
- [ ] GDPR/data privacy compliance verified
- [ ] Backup/restore tested

---

## Maintenance

### Over-the-Air Updates
Use **CodePush** (React Native) or **Shorebird** (Flutter) for hot fixes without app store approval.

### Monitoring Dashboards
- Crashlytics: Error rates, affected users
- Firebase Analytics: User flows, retention
- Backend APM: API latencies, error rates
- Business Metrics: DAU, matches/day, messages/day

---

## Summary

This mobile strategy prioritizes:
1. **India-first performance** (low/mid Android, network resilience)
2. **Security** (tokens, sensitive data, safety)
3. **Observability** (crashes, analytics, performance)
4. **Rapid iteration** (hot reload, testing, CI/CD)

Choose **Flutter** for consistency and performance, or **React Native** if your team is JS-native. Follow Clean Architecture for maintainability. Test on real low-end devices. Monitor everything.
