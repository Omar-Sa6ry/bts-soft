# @bts-soft/notifications — دليل شرح النظام المعماري وآلية العمل

هذا الملف عبارة عن مرجع تفصيلي يشرح كيفية عمل الباكدج، تدفق البيانات (Flow)، والمفاهيم المعمارية المستخدمة فيه لتسهيل الفهم والمتابعة.

---

## 1. كيف تعمل الباكدج؟ (Architecture & Flow)

الباكدج عبارة عن **نظام إرسال إشعارات متعدد القنوات (Multi-Channel Notification System)** مبني على أسس كتاب **System Design Interview**. ينقسم العمل فيه إلى جزأين رئيسيين:

### أ. مرحلة استقبال الطلب وفحصه (Pre-flight Pipeline)
تبدأ العملية عند استدعاء `NotificationService.send()` أو `sendBulk()`:
1. **التحقق من الصلاحية (Expiry Check)**: يتم التأكد من أن الإشعار لم يتجاوز تاريخ انتهاء صلاحيته (`expiresAt`).
2. **منع التكرار (Deduplication)**: إذا تم تزويد الطلب بمفتاح `idempotencyKey`، يتم فحص مخزن Redis للتأكد من أن هذا الإشعار لم يُرسل من قبل.
3. **تفضيلات المستخدم (User Preferences)**: يتم التحقق مما إذا كان المستخدم قد ألغى اشتراكه (`opted_out`) من هذه القناة.
4. **تحديد معدل الإرسال (Rate Limiting)**: فحص ما إذا كان المستخدم قد تجاوز الحد الأقصى المسموح به من الإشعارات خلال النافذة الزمنية المحددة.
5. **الإدراج في الطابور (Enqueue)**: إذا اجتاز الطلب كل الفحوصات بنجاح، يتم حفظ حالة الإشعار كـ `PENDING` في قاعدة البيانات (عبر الـ Log Repository) ثم يُدرج الطلب في طابور **BullMQ** (المدعوم بـ Redis) مع تحديد الأولويات وإعدادات إعادة المحاولة (Retry Policy).

---

### ب. مرحلة المعالجة والإرسال (Worker Execution Pipeline)
يقوم الـ `NotificationProcessor` (الذي يعمل كـ BullMQ Worker) بالتقاط المهام من الطابور ومعالجتها عبر **3 مراحل متتالية**:

```
[BullMQ Queue] ──> [Processor]
                      │
                      ├── Phase 1: Pre-process (التحقق من الصلاحية، ترجمة النصوص i18n، معالجة قوالب Handlebars)
                      │
                      ├── Phase 2: Send (استدعاء القناة المناسبة وإرسال الإشعار للـ Provider الخارجي)
                      │
                      └── Phase 3: Post-process (تحديث حالة الـ Log وإطلاق الـ Observers)
```

1. **Phase 1: Pre-process**:
   - التحقق مجدداً من تاريخ انتهاء الصلاحية (لتجنب إرسال إشعارات متراكمة ومتأخرة في حال وجود ضغط على الطابور).
   - تطبيق الترجمة اللغوية (I18n) إذا كان حقل `lang` متوفراً.
   - دمج البيانات المتغيرة داخل نص الإشعار باستخدام محرك القوالب **Handlebars**.
2. **Phase 2: Send**:
   - استخدام الـ `NotificationChannelFactory` لجلب القناة المطلوبة (مثل Email, SMS, Push, Telegram, إلخ).
   - استدعاء دالة `send()` الخاصة بتلك القناة لإرسال الطلب إلى المزود الخارجي (مثل Twilio أو Nodemailer).
3. **Phase 3: Post-process**:
   - إذا تم الإرسال بنجاح: تُحدث حالة الـ Log إلى `SENT`.
   - إذا فشل الإرسال: تُحدد طبيعة الخطأ:
     - إذا كان الخطأ من طرف العميل (`NotificationClientError`): يفشل الإشعار نهائياً وتصبح حالته `FAILED` بدون إعادة محاولة.
     - إذا كان الخطأ من مزود الخدمة (`NotificationProviderError`): يُعاد المحاولة تلقائياً بناءً على إعدادات الـ Retry الخاصة بالقناة.

---

## 2. مفاهيم ومصطلحات برمجية في الباكدج

### ما هو الـ `opted_out`؟ وأين يقع في الكود؟
- **المفهوم**: يعني أن المستخدم قام بإلغاء تفعيل تلقي الإشعارات على قناة معينة (مثال: عدم رغبة المستخدم في استلام رسائل SMS الإعلانية).
- **مكانه في الكود**:
  - مُعرّف كحالة إلغاء في الـ Enum الخاص بأسباب التخطي: `NotificationSkipReason.OPTED_OUT` في الملف `src/core/enums/NotificationSkipReason.enum.ts`.
  - يتم التحقق منه في الـ Pipeline التمهيدي داخل الملف [notification.service.ts](file:///d:/projects/BTS%20Software/packages/notifications/src/notification.service.ts#L107-L117):
    ```typescript
    if (this.preferenceRepository) {
      if (await this.preferenceRepository.isOptedOut(message.recipientId, channel)) {
        this.skip({ channel, recipientId: message.recipientId, reason: NotificationSkipReason.OPTED_OUT, message });
        return true;
      }
    }
    ```

---

### ملف `src/core/constants/injection-tokens.const.ts`
يحتوي هذا الملف على رموز فريدة (**Symbols**) تُستخدم كـ Keys داخل حاوية NestJS IoC (Dependency Injection). 
بما أن الـ Interfaces في TypeScript تُمسح تماماً بعد تحويل الكود إلى JavaScript (Type Erasure)، فإننا لا نستطيع استخدامها مباشرة كرموز للحقن البرمجي. لذلك نستخدم هذه الـ Symbols للربط بين الواجهة (Interface) والتطبيق الفعلي لها (Implementation).

---

### ما هو الـ `recipientId` والـ `jobId`؟
- **`recipientId`**: المعرّف الخاص بمستقبل الرسالة. يختلف شكله حسب القناة:
  - في البريد الإلكتروني: يكون الإيميل (مثل `user@example.com`).
  - في الـ SMS والـ WhatsApp: يكون رقم الهاتف (مثل `+201234567890`).
  - في الـ Push Notifications: يكون الـ FCM Token الخاص بالجهاز.
  - في الـ Telegram: يكون الـ Chat ID الخاص بالمستخدم.
- **`jobId`**: معرف فريد يتم إنشاؤه تلقائياً بواسطة **BullMQ** عند إضافة المهمة إلى الطابور. يُستخدم لربط الإشعار بسجل العمليات (Logs) وتتبع حالته ومحاولات إعادة الإرسال.

---

### ماذا نستخدم من الـ `RedisService`؟ ولماذا؟
نستخدم الـ `RedisService` المستوردة من باكدج `@bts-soft/cache` للقيام بالعمليات التالية:
1. **الـ Rate Limiting (تحديد معدل الإرسال)**:
   - العمليات: `zRemRangeByScore`, `zCard`, `zAdd`, `expire`.
   - السبب: لتخزين أوقات الطلبات كـ Sorted Set. نقوم بمسح التواريخ القديمة خارج النافذة الزمنية، ثم نعد العناصر المتبقية للتأكد من عدم تجاوز الحد.
2. **الـ Deduplication (منع التكرار)**:
   - العمليات: `exists`, `set`.
   - السبب: لفحص وجود مفتاح الـ Idempotency وتخزينه مع وقت صلاحية (TTL) لمنع إرسال نفس الرسالة مرتين خلال 24 ساعة.
3. **تفضيلات المستخدم (Preferences)**:
   - العمليات: `exists`, `setForever`, `del`.
   - السبب: لحفظ خيارات الـ opt-out بشكل دائم في قاعدة بيانات الكاش.

---

### مجلد `src/core/preferences`
يحتوي على:
- `IUserPreferenceRepository.interface.ts`: الواجهة البرمجية (Contract) التي تحدد العمليات المتاحة لإدارة تفضيلات المستخدم.
- `RedisUserPreferenceRepository.ts`: التطبيق الفعلي الذي يقوم بقراءة وكتابة خيارات إلغاء الاشتراك (`opted_out`) مباشرة في Redis.

---

### ماذا يعني تصدير `export { NOTIFICATION_DEDUP_STORE }` وأشباهها؟
تصدير هذه الـ Symbols يتيح للتطبيقات الخارجية التي تستخدم هذه الباكدج إمكانية تخصيص وتعديل عمل النظام. على سبيل المثال، إذا أراد المطور استبدال الـ Deduplication Store الافتراضي بآخر يتصل بقاعدة بيانات PostgreSQL بدلاً من Redis، فكل ما عليه فعله هو تعريف المورد الخاص به وربطه بـ `NOTIFICATION_DEDUP_STORE` في الـ Providers الخاصة بتطبيقه.

---

### ما هو الـ `idempotencyKey` والـ `channelOptions`؟
- **`idempotencyKey`**: مفتاح فريد لضمان معالجة الطلب مرة واحدة فقط (إرسال فريد). يمنع وصول رسائل مكررة للمستخدم في حال تكرار استدعاء الـ API نتيجة لـ Network Timeout أو ضغط زر الشراء مرتين مثلاً.
- **`channelOptions`**: حقل مرن لتمرير خيارات مخصصة لقنوات الإرسال تتجاوز الإعدادات الافتراضية (مثال: إرسال بريد إلكتروني باستخدام SMTP Server مختلف، أو تحديد Sender ID مخصص للـ SMS).

---

## 3. شرح آلية الـ Dependency Injection في Module

```typescript
RedisRateLimiter,
{ provide: NOTIFICATION_RATE_LIMITER, useExisting: RedisRateLimiter }
```

### شرح الـ Provider والـ `useExisting`:
- السطر الأول `RedisRateLimiter` يقوم بتسجيل الـ Class كـ Provider داخل NestJS.
- السطر الثاني ينشئ **اسم مستعار (Alias)**: يخبر NestJS أنه عندما يطلب أي كود حقن المورد باستخدام الرمز `NOTIFICATION_RATE_LIMITER`، قم بإعطائه نفس الـ Instance المشتركة (Singleton) الخاصة بـ `RedisRateLimiter` بدلاً من إنشاء نسخة جديدة.

### لماذا نقوم بعمل `export` لها في الـ exports؟
لكي تصبح هذه الرموز والخدمات مرئية وقابلة للاستخدام خارج نطاق الـ `NotificationModule`؛ مما يسمح لأي Module آخر يستورد نظام الإشعارات بالوصول إلى هذه الواجهات وتغييرها أو استدعائها برمجياً.

---

## 4. كيف يعمل نظام إعادة المحاولة (Retry Mechanism)؟

يتم التحكم بنظام إعادة المحاولة على مستوى طابور **BullMQ**.

### الكود والآلية:
في الملف `src/notification.service.ts`:
```typescript
const job = await this.notificationQueue.add(channel, { channel, message }, {
  attempts: policy.attempts,
  backoff: { 
    type: policy.backoffType === "fixed" ? "fixed" : "exponential", 
    delay: policy.delay 
  },
  removeOnComplete: policy.removeOnComplete,
  removeOnFail: policy.removeOnFail,
  priority,
});
```

1. **عدد المحاولات (`attempts`)**: يحدد كم مرة سيحاول النظام إرسال الرسالة في حال الفشل (الافتراضي 3 مرات).
2. **نوع التراجع (`backoff.type`)**:
   - `fixed`: الانتظار لوقت ثابت بين كل محاولة فاشلة والأخرى.
   - `exponential`: مضاعفة وقت الانتظار بعد كل فشل (مثال: المحاولة الأولى بعد 5 ثوانٍ، الثانية بعد 10 ثوانٍ، الثالثة بعد 20 ثانية) لتجنب الضغط على مزود الخدمة الخارجي.
3. **تطبيق المعالجة**: في الـ Processor، إذا حدث خطأ من نوع `NotificationProviderError` (مثل انقطاع طارئ في شبكة Twilio)، يقوم الـ Processor بإعادة رمي الخطأ (re-throw)؛ مما يجعل BullMQ يدرك أن العملية فشلت مؤقتاً ويعيد جدولتها تلقائياً وفقاً للـ Backoff Policy المحددة أعلاه.

---

## 5. شرح الـ Annotations والـ Decorators

### `@Optional()`
تخبر NestJS بأن هذا الاعتماد **ليس إجبارياً**. إذا لم يجد التطبيق أي Provider مسجل لهذا الرمز، فلن يتوقف التطبيق عن العمل (Crash)، بل سيقوم بحقن القيمة كـ `undefined` أو `null` ويقوم كود الخدمة بالتعامل مع ذلك داخلياً (مثل تفعيل وضع عدم الحفظ في حال غياب الـ Log Repository).

### `@Inject(NOTIFICATION_OBSERVERS)`
بما أن واجهة الـ Interface تُمسح عند التشغيل، فإن الـ Decorator `@Inject()` يوجه NestJS صراحةً للبحث عن الـ Provider المرتبط بالرمز الممرر بين القوسين وحقنه في المتغير المذكور.

---

## 6. تفصيل عمل الملفات الرئيسية

### أ. ملف `src/notification.service.ts`
هو واجهة النظام والمتحكم الأول (Orchestrator):
1. يستقبل الطلبات الخارجية عبر الدوال العامة `send` و `sendBulk`.
2. يمرر الطلب على خط الدفاع التمهيدي (Pre-flight checks):
   - التحقق من صلاحية الوقت.
   - التحقق من عدم التكرار.
   - التحقق من تفضيلات المستخدم.
   - التحقق من الـ Rate Limit.
3. يقوم بإدراج الطلبات المقبولة في طابور BullMQ مع إرفاق خيارات الأولوية وإعادة الإرسال.
4. ينشئ السجل الأولي للمهمة بوضعية `PENDING`.

### ب. ملف `src/notification.processor.ts`
هو العامل المنفذ (Worker):
1. يستمع للطابور ويلتقط المهام الجاهزة للمعالجة.
2. يدخل في مرحلة **التحضير المسبق (Pre-process)**:
   - يتأكد مجدداً أن الرسالة لم تنته صلاحيتها أثناء انتظارها في الطابور.
   - يترجم العناوين والنصوص اللغوية.
   - يدمج بيانات الـ context داخل القوالب باستخدام Handlebars.
3. يدخل في مرحلة **الإرسال (Send)**: يجلب القناة المسؤولة من الـ Factory ويقوم باستدعاء الإرسال الفعلي.
4. يدخل في مرحلة **الخاتمة (Post-process)**:
   - يحدث سجل قاعدة البيانات للوضعية النهائية (`SENT` أو `FAILED` أو `EXPIRED`).
   - يطلق الأحداث المقابلة في الـ Observers المسجلين لتسجيل الإحصائيات أو التحذيرات.

---

## 7. دليل اختبار القنوات (Channel Testing Guide)

للتحقق من أن كل قناة تعمل بشكل سليم بعد إعداد الباكدج، يمكنك استخدام هذه الإرشادات لاختبار كل قناة على حدة:

### 1. البريد الإلكتروني (Email - Nodemailer)
- **المتطلبات:** التأكد من إعداد `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`. (يُفضل استخدام **Google App Passwords** أو حساب **Ethereal** الوهمي للاختبار).
- **الاستدعاء:** 
  ```typescript
  await notificationService.send(ChannelType.EMAIL, {
    recipientId: 'test@example.com',
    subject: 'Test Email',
    body: 'Hello from BTS Notifications!'
  });
  ```
- **التحقق:** تفقد صندوق الوارد في البريد الإلكتروني المسجل.

### 2. رسائل القصيرة (SMS - Twilio)
- **المتطلبات:** إعداد `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_NUMBER`.
- **الاستدعاء:**
  ```typescript
  await notificationService.send(ChannelType.SMS, {
    recipientId: '+201000000000', // رقم هاتف بصيغة دولية شامل كود الدولة
    body: 'Test SMS from Twilio'
  });
  ```
- **التحقق:** ستصلك رسالة نصية على هاتفك. (ملاحظة: إذا كان حساب Twilio تجريبياً Trial، يجب أن يكون رقمك الشخصي مُفعّلاً ومُوثّقاً داخل Twilio لتستلم الرسائل).

### 3. واتساب (WhatsApp - Twilio)
- **المتطلبات:** نفس اعتمادات Twilio السابقة، بالإضافة إلى إعداد `TWILIO_WHATSAPP_NUMBER`.
- **الاستدعاء:**
  ```typescript
  await notificationService.send(ChannelType.WHATSAPP, {
    recipientId: 'whatsapp:+201000000000', // يجب إضافة السابقة whatsapp: قبل الرقم
    body: 'Test WhatsApp Message'
  });
  ```
- **التحقق:** لتفعيل الاختبار، يجب أن تُرسل رسالة نصية من رقمك الشخصي على واتساب إلى رقم Twilio الخاص بك (Join Message) لتفعيل نافذة الـ 24 ساعة، ثم ستصلك رسالة الاختبار.

### 4. تليجرام (Telegram)
- **المتطلبات:** الحصول على التوكن `TELEGRAM_BOT_TOKEN` من خلال البوت الرسمي `BotFather`.
- **الاستدعاء:**
  ```typescript
  await notificationService.send(ChannelType.TELEGRAM, {
    recipientId: '123456789', // Chat ID الخاص بالمستخدم
    body: 'Test Telegram Message'
  });
  ```
- **التحقق:** قم بالبحث عن البوت الخاص بك في تليجرام وأرسل له كلمة `/start`. لا يمكن لأي بوت أن يراسل مستخدماً لم يقم بالمبادرة والتحدث معه أولاً.

### 5. إشعارات الموبايل (Firebase FCM)
- **المتطلبات:** تحديد مسار ملف الصلاحيات `FIREBASE_SERVICE_ACCOUNT_PATH` (وهو ملف الـ JSON الذي تحمله من إعدادات Firebase Console).
- **الاستدعاء:**
  ```typescript
  await notificationService.send(ChannelType.FIREBASE_FCM, {
    recipientId: 'device-fcm-token-here', // التوكن الخاص بجهاز المستخدم
    subject: 'Test Push',
    body: 'Test Push Notification',
    channelOptions: { fcmOptions: { data: { click_action: 'FLUTTER_NOTIFICATION_CLICK' } } }
  });
  ```
- **التحقق:** استخدم تطبيق موبايل للمطورين أو موقع لاستخراج الـ FCM Token الخاص بجهازك، وستصلك الرسالة كإشعار (Push Notification) حقيقي.

### 6. ديسكورد (Discord Webhooks)
- **المتطلبات:** إنشاء Webhook من إعدادات أي قناة نصية (Server Settings -> Integrations -> Webhooks) ووضعه في `DISCORD_WEBHOOK_URL`.
- **الاستدعاء:**
  ```typescript
  await notificationService.send(ChannelType.DISCORD, {
    recipientId: 'default', // لا يهم لأن الإرسال يتم عبر الـ Webhook العام
    body: 'Test Discord Message from System'
  });
  ```
- **التحقق:** ستظهر الرسالة كإشعار آلي داخل القناة التي تم ربط الـ Webhook بها في خادم Discord الخاص بك.

### 7. مايكروسوفت تيمز (Microsoft Teams)
- **المتطلبات:** الحصول على رابط الـ Webhook الخاص بقناة Teams من الـ Connectors ووضعه في `TEAMS_WEBHOOK_URL`.
- **الاستدعاء:**
  ```typescript
  await notificationService.send(ChannelType.TEAMS, {
    recipientId: 'default',
    subject: 'System Alert',
    body: 'Test Teams Notification'
  });
  ```
- **التحقق:** ستظهر الرسالة كبطاقة مخصصة (Adaptive Card) داخل قناة Teams المحددة.

### 8. فيسبوك ماسنجر (Facebook Messenger)
- **المتطلبات:** إعداد `FB_PAGE_ACCESS_TOKEN` من منصة مطوري فيسبوك (Facebook Developers) وربطه بصفحتك.
- **الاستدعاء:**
  ```typescript
  await notificationService.send(ChannelType.FACEBOOK_MESSENGER, {
    recipientId: 'psid-123456789', // الـ Page-Scoped ID الخاص بالمستخدم
    body: 'Test Messenger Reply'
  });
  ```
- **التحقق:** لكي تحصل على الـ PSID، قم بمراسلة صفحة الفيسبوك من حسابك الشخصي (أو استخدم الـ Webhook لاستخراج رقم الـ Sender ID)، ثم نفذ الكود لتصلك الرسالة على الماسنجر. لا يمكنك مراسلة أي شخص عشوائي دون أن يكون قد راسل الصفحة مسبقاً.