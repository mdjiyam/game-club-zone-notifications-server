# Game Club Zone - Notification Server

Secure server-side backend for sending FCM Push Notifications.

## Features

- Firebase Cloud Messaging HTTP v1 API
- Firebase Realtime Database থেকে FCM token সংগ্রহ
- `all` এবং `user` target support
- Invalid/expired token automatic skip + cleanup
- API Key authentication
- CORS enabled
- Service Account private key environment variable-এ রাখা (কখনো client-এ যায় না)

## Environment Variables

`.env` ফাইল তৈরি করুন (`.env.example` থেকে কপি করে):

```bash
PORT=3000
NODE_ENV=production
API_SECRET_KEY=your_super_secret_api_key_here_change_this_immediately
FIREBASE_PROJECT_ID=game-club-zone
FIREBASE_DATABASE_URL=https://game-club-zone-default-rtdb.firebaseio.com/
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Local Run

```bash
cd notification-server
npm install
cp .env.example .env
# .env ফাইল এডিট করুন
npm start
# অথবা development mode:
npm run dev
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Send Notification
```
POST /api/send-notification
Headers:
  Authorization: Bearer <API_SECRET_KEY>
  Content-Type: application/json

Body:
{
  "title": "Test Notification",
  "message": "Hello User",
  "targetType": "all",
  "targetUserId": ""
}
```
