# 🌟 Social Media API

Full-featured social media platform API with Instagram/Twitter-like functionality including posts, stories, messaging, hashtags, and real-time notifications.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - JWT-based auth with refresh tokens
- ✅ **User Profiles** - Bio, avatar, cover photo, verification badges
- ✅ **Follow System** - Follow/unfollow users, view followers/following
- ✅ **Posts** - Create posts with text, images, videos, location
- ✅ **Feed Algorithm** - Personalized feed from followed users
- ✅ **Likes** - Like/unlike posts with real-time counts
- ✅ **Comments** - Threaded comments with replies
- ✅ **Hashtags** - Auto-extract, search, trending hashtags
- ✅ **Mentions** - Tag users with @username
- ✅ **Stories** - 24-hour expiring stories with views
- ✅ **Direct Messaging** - Private conversations between users
- ✅ **Search** - Search users, posts, and hashtags
- ✅ **Notifications** - Real-time notifications for interactions
- ✅ **Saved Posts** - Bookmark posts for later

### Advanced Features
- 🔐 **Secure Authentication** - Password hashing, JWT tokens
- 📊 **User Statistics** - Posts count, followers, following
- 🔍 **Advanced Search** - Full-text search across platform
- 📈 **Trending Content** - Track popular hashtags
- 💬 **Conversation Management** - Organized message threads
- 🔔 **Smart Notifications** - Follow, like, comment, mention, message
- 🎯 **Privacy Controls** - Private accounts support
- ⚡ **Performance** - Redis caching ready
- 🌐 **Scalable** - Built for horizontal scaling

## 📦 Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5
- **Cache:** Redis 7 (optional)
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcrypt, helmet, cors
- **Validation:** Built-in validators
- **Image Processing:** Sharp (for future file uploads)

## 🛠️ Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager
- Redis 7+ (optional, for caching)

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd social-media-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Server
PORT=9000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/social_media_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# App
APP_URL=http://localhost:9000
FRONTEND_URL=http://localhost:3000
```

4. **Create database**
```bash
createdb social_media_db
```

5. **Run migrations**
```bash
npx prisma migrate dev
```

6. **Generate Prisma Client**
```bash
npx prisma generate
```

7. **Start development server**
```bash
npm run dev
```

Server runs on `http://localhost:9000`

## 📍 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |

### 👥 Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/:username` | Get user profile | ✅ |
| POST | `/api/users/:userId/follow` | Follow user | ✅ |
| DELETE | `/api/users/:userId/unfollow` | Unfollow user | ✅ |
| GET | `/api/users/:username/followers` | Get followers | ✅ |
| GET | `/api/users/:username/following` | Get following | ✅ |

### 📝 Posts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/posts` | Create post | ✅ |
| GET | `/api/posts/feed` | Get personalized feed | ✅ |
| GET | `/api/posts/user/:username` | Get user posts | ✅ |
| GET | `/api/posts/:id` | Get single post | ✅ |
| POST | `/api/posts/:id/like` | Like post | ✅ |
| DELETE | `/api/posts/:id/unlike` | Unlike post | ✅ |
| DELETE | `/api/posts/:id` | Delete post | ✅ |

### 💬 Comments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/comments/:postId` | Create comment | ✅ |
| GET | `/api/comments/:postId` | Get post comments | ✅ |
| GET | `/api/comments/:commentId/replies` | Get comment replies | ✅ |
| DELETE | `/api/comments/:commentId` | Delete comment | ✅ |

### 📸 Stories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/stories` | Create story | ✅ |
| GET | `/api/stories` | Get stories from following | ✅ |
| POST | `/api/stories/:storyId/view` | View story | ✅ |
| DELETE | `/api/stories/:storyId` | Delete story | ✅ |

### 💌 Direct Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/messages` | Send message | ✅ |
| GET | `/api/messages/conversations` | Get conversations | ✅ |
| GET | `/api/messages/:otherUserId` | Get messages with user | ✅ |

### 🔍 Search

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/search/users?query=text` | Search users | ✅ |
| GET | `/api/search/posts?query=text` | Search posts | ✅ |
| GET | `/api/search/hashtags?query=text` | Search hashtags | ✅ |
| GET | `/api/search/trending` | Get trending hashtags | ✅ |

### 🔔 Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get notifications | ✅ |
| PUT | `/api/notifications/:id/read` | Mark as read | ✅ |
| PUT | `/api/notifications/read-all` | Mark all as read | ✅ |

## 🗂️ Database Schema

### User
- Authentication & profile information
- Bio, avatar, cover photo, website, location
- Privacy settings (private accounts)
- Verification status
- Relations: posts, followers, following, stories, messages

### Follow
- Many-to-many relationship between users
- Tracks follower/following relationships

### Post
- Content, media URLs, media type
- Location tagging
- Privacy settings (public/private)
- Engagement counts (likes, comments, shares, views)
- Relations: user, likes, comments, hashtags, mentions

### Comment
- Threaded comments with parent/child relationships
- Nested replies support
- Like counts
- Relations: user, post, parent, replies

### Hashtag
- Trending hashtag tracking
- Usage count
- Relations: posts (many-to-many)

### Story
- 24-hour expiring content
- Media URL, caption
- View tracking
- Auto-cleanup after expiration

### Message
- Direct messaging between users
- Read receipts
- Media support
- Relations: sender, receiver

### Notification
- Type: FOLLOW, LIKE, COMMENT, MENTION, MESSAGE
- Read status tracking
- Entity linking (post, comment, message)

## 🧪 Testing

### Manual Testing

1. **Register users**
```bash
# Register Alice
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@social.com",
    "username": "alice_social",
    "password": "password123",
    "firstName": "Alice",
    "lastName": "Wonder"
  }'

# Register Bob
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@social.com",
    "username": "bob_social",
    "password": "password123",
    "firstName": "Bob",
    "lastName": "Builder"
  }'
```

2. **Test follow system**
```bash
# Alice follows Bob
curl -X POST http://localhost:9000/api/users/$BOB_ID/follow \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

3. **Test posts**
```bash
# Alice creates post
curl -X POST http://localhost:9000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "content": "Hello world! 🌟 #socialmedia @bob_social",
    "location": "San Francisco, CA"
  }'
```

4. **Test feed**
```bash
# Get personalized feed
curl http://localhost:9000/api/posts/feed \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

## 📄 Scripts
```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "migrate": "npx prisma migrate dev",
  "studio": "npx prisma studio"
}
```

## 🗂️ Project Structure
```
social-media-api/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── redis.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── post.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── story.controller.ts
│   │   ├── message.controller.ts
│   │   ├── search.controller.ts
│   │   └── notification.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── post.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── story.routes.ts
│   │   ├── message.routes.ts
│   │   ├── search.routes.ts
│   │   └── notification.routes.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── slug.ts
│   └── server.ts
├── uploads/
│   ├── posts/
│   ├── stories/
│   └── avatars/
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Use strong JWT secrets (32+ characters)
3. Configure production database URL
4. Set up Redis for caching
5. Configure CORS for your frontend domain
6. Enable HTTPS/SSL
7. Use PM2 or similar for process management

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=9000
DATABASE_URL=your-production-postgresql-url
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=strong-random-secret-min-32-chars
JWT_REFRESH_SECRET=different-strong-random-secret
```

## 🎓 Features Showcase

### Hashtags
- Automatically extracted from post content (#example)
- Clickable and searchable
- Trending hashtag tracking by usage count
- Case-insensitive matching

### Mentions
- Tag users with @username in posts
- Automatic notification to mentioned users
- Linked to user profiles

### Stories
- 24-hour auto-expiring content
- View tracking (who viewed)
- Organized by user in chronological order
- Support for images and videos

### Feed Algorithm
- Shows posts from followed users
- Includes own posts
- Reverse chronological order
- Pagination support

### Notifications
- Real-time notification system
- Types: FOLLOW, LIKE, COMMENT, MENTION, MESSAGE
- Unread count tracking
- Mark as read functionality

## 📊 API Features

- **Pagination:** Most list endpoints support `page` and `limit` parameters
- **Filtering:** Posts can be filtered by user, hashtag, media type
- **Sorting:** Feed sorted by creation date (newest first)
- **Statistics:** User stats (posts, followers, following counts)
- **Privacy:** Support for private accounts
- **Validation:** Input validation on all endpoints
- **Error Handling:** Consistent error responses

## 🔒 Security Features

- **Password Hashing:** bcrypt with salt rounds
- **JWT Authentication:** Access tokens (1h) + Refresh tokens (7d)
- **Input Validation:** Request validation middleware
- **CORS Protection:** Configured cross-origin policies
- **SQL Injection Prevention:** Prisma ORM parameterized queries
- **Helmet Security:** HTTP headers protection

## 📝 License

MIT

## 👤 Author

Ceren Demir

## 🙏 Acknowledgments

- [Prisma](https://www.prisma.io/) - Database ORM
- [Express](https://expressjs.com/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Redis](https://redis.io/) - Caching & pub/sub

---

**⭐ If you find this project useful, please consider giving it a star!**

## 📸 API Flow Examples

### User Registration → Post Creation → Engagement Flow
```
1. Alice registers → JWT tokens issued
2. Bob registers → JWT tokens issued
3. Alice follows Bob → Notification sent to Bob
4. Bob creates post with hashtags & mentions
5. Alice likes Bob's post → Notification sent
6. Alice comments on post → Notification sent
7. Bob views Alice's profile → Stats displayed
8. Alice creates story → Available for 24h
9. Bob views story → View count incremented
```

---

**Built with ❤️ using Node.js, TypeScript, and PostgreSQL**
