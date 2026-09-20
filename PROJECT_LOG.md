# Day 1 - System Design

## Goal

Design the architecture for the real-time chat application before writing code.

## Completed

### Core Features

* User registration
* User login
* User search
* Friend requests
* Friend request acceptance
* Chat creation
* Real-time messaging

### Database Entities Identified

* User
* FriendRequest
* Chat
* Message

### Architecture Decisions

* Use IDs instead of usernames as foreign keys
* Store hashed passwords instead of raw passwords
* Create chats automatically when friend requests are accepted
* Persist messages in database before sending through websocket
* Support offline users through database persistence

### Additional Design Decisions

* Cursor pagination for message history
* Unread message tracking using lastReadMessageId
* Store last message information in Chat table
* Prevent duplicate friend requests
* Prevent duplicate chats
* Prevent self friend requests

## Outcome

System design is sufficiently complete to begin implementation.
Next step: create project structure and Prisma schema.

## Future Features (V2)
- Read receipts
- Last read message tracking
- Typing indicators
- Online presence

# Day 2 - Database Setup

## Completed

- Designed User schema
- Designed FriendRequest schema
- Designed Chat schema
- Designed Message schema
- Added relations
- Connected Neon
- Ran first migration
- Generated Prisma client
- Bootstrapped Express server
- Verified localhost server works

## Next Session

Auth milestone:
- Register endpoint
- Login endpoint
- JWT generation
- Password hashing

# Day 3 - Auth routes setup 

## Completed

## Authentication Module

Implemented user registration endpoint.

Features:

* User creation using Prisma
* Password hashing with bcrypt
* Duplicate email protection
* Zod request validation
* Structured API responses

Implemented user login endpoint.

Features:

* Email lookup using Prisma
* Password verification with bcrypt.compare()
* Invalid credential handling
* Safe user response (excluding password)

## Backend Architecture

Implemented:

* Service layer
* Controller layer
* Route layer
* Global error middleware
* Custom ApiError class
* Validation schemas using Zod

## Testing

Verified using Postman:

* Successful registration
* Duplicate email handling
* Missing field validation
* Invalid input validation
* Successful login
* Invalid password handling
* Non-existent user handling

## Next Steps

1. JWT Fundamentals
2. Access Token Generation
3. Return JWT on Login
4. Authentication Middleware
5. Protected Route Testing

# Day 4 - JWT middleware and login setup 

## Features Implemented

### Authentication

* User registration endpoint completed.
* User login endpoint completed.
* Password hashing and verification implemented.
* JWT generation implemented after successful login.

### Authorization

* Authentication middleware created.
* Bearer token extraction implemented.
* JWT verification implemented.
* Decoded user payload attached to req.user.

### Protected Routes

* Created protected test route (/me).
* Verified authenticated requests using Postman.
* Successfully returned authenticated user information from token payload.

### TypeScript Improvements

* Created AuthUser interface.
* Extended Express Request interface with user property.
* Removed TypeScript errors related to req.user.
* Added proper typing for authenticated requests.

### Testing & Verification

* Tested login flow.
* Tested JWT generation.
* Tested JWT verification.
* Tested protected route access.
* Confirmed end-to-end authentication flow is functioning correctly.

## Challenges Faced

* Authorization header handling.
* Understanding Bearer token extraction.
* Debugging JWT verification failures.
* Fixing req.user TypeScript errors.
* Diagnosing invalid signature errors.
* Correcting Postman JWT usage.

## Milestone Status

✅ Register

✅ Login

✅ Password Hashing

✅ JWT Generation

✅ JWT Verification

✅ Authentication Middleware

✅ Protected Routes

✅ Typed req.user

Authentication system completed successfully.

## Next Phase

* Users
* Conversations
* Messages
* Real-Time Messaging (Socket.IO)

### User Search Endpoint

Implemented authenticated user search functionality.

Endpoint:

GET /api/v1/users/search?username=<query>

---

## Backend Flow

Request

↓

Route

↓

Controller

↓

Service

↓

Prisma Query

↓

Response

---

## Functionality

* Search users by partial username.
* Perform case-insensitive matching.
* Exclude the currently authenticated user.
* Return only safe user fields.
* Validate required query parameter.

---

## Security and Data Handling

Returned:

* id
* username

Excluded:

* password
* email

This follows the principle of least data exposure.

---

## Testing Completed

Verified:

* Partial match search
* Case-insensitive search
* Self-search exclusion
* Empty search results
* Missing username query parameter

All tests passed successfully.

---

## Current Project Status

✅ Register

✅ Login

✅ Password Hashing

✅ JWT Authentication

✅ Auth Middleware

✅ Protected Routes

✅ User Search

### Next Planned Feature

Friend Request System

Flow:

Search User

↓

Send Friend Request

↓

Accept Friend Request

↓

Auto Create Chat

# Day 5 - friend request and message endpoints 

### Friend Requests

Implemented:

* Send Friend Request
* Prevent Self Requests
* Prevent Duplicate Requests
* Prevent Reverse Duplicate Requests
* Get Incoming Friend Requests
* Accept Friend Requests

---

### Chat Creation

Implemented automatic chat creation when a friend request is accepted.

Added participant normalization:

```ts
const participant1Id = Math.min(senderId, receiverId);
const participant2Id = Math.max(senderId, receiverId);
```

to guarantee a single chat per user pair.

---

### Messaging

Implemented:

#### Send Message

Endpoint:

```http
POST /message/chat/:chatId
```

Features:

* Chat existence validation
* Participant authorization validation
* Content validation
* Transactional message creation
* Automatic update of:

  * lastMessage
  * lastMessageAt

#### Get Messages

Endpoint:

```http
GET /message/chat/:chatId
```

Features:

* Chat existence validation
* Participant authorization validation
* Chronological message retrieval

---

## Current Application Flow

```text
Register
↓
Login
↓
Search User
↓
Send Friend Request
↓
Accept Friend Request
↓
Chat Created
↓
Send Message
↓
Read Messages
```

---

## Current Status

Completed MVP backend flow for one-to-one messaging.

Core functionality now exists from user discovery all the way to message exchange.

Next likely feature:

```text
Get My Chats
```

to allow users to discover and open existing conversations.

## Next features

Login
↓
Get My Chats
↓
View Recent Conversations
↓
Open Chat
↓
View Other Participant
↓
Continue Conversation

# Day 6 - Get messages and friend request reject and socket.io setup

### Chat Discovery

Implemented:

```http
GET /chat
```

Features:

* Fetch all chats for the authenticated user
* Load participant information using Prisma relations
* Determine and return the other participant
* Return:

  * Chat ID
  * Other User
  * Last Message
  * Last Message Timestamp
* Sort chats by latest activity

Example Response:

```json
{
  "id": 1,
  "otherUser": {
    "id": 2,
    "username": "john"
  },
  "lastMessage": "Hello",
  "lastMessageAt": "..."
}
```

---

### Friend Request Rejection

Implemented:

```http
POST /friendRequest/:id/reject
```

Validation:

* Request exists
* Current user is the receiver
* Request status is PENDING

Action:

```text
PENDING
↓
REJECTED
```

---

### Friend Request Re-send Flow

Updated friend request handling logic.

Behavior:

```text
PENDING
↓
Blocked
```

```text
ACCEPTED
↓
Blocked
```

```text
REJECTED
↓
Revived To PENDING
```

Maintains:

```prisma
@@unique([senderId, receiverId])
```

without requiring additional database rows.

---

### Testing Completed

Verified full lifecycle:

```text
Send Request
↓
Reject Request
↓
Re-send Request
↓
Accept Request
↓
Chat Created
```

All transitions behave correctly.

---

Current Backend Status

```text
✅ Register
✅ Login
✅ JWT Middleware

✅ User Search

✅ Send Friend Request
✅ Get Incoming Requests
✅ Accept Friend Request
✅ Reject Friend Request

✅ Auto Create Chat

✅ Get Chats

✅ Send Message
✅ Get Messages
```

---

Next Major Feature

## Realtime Messaging (Socket.IO)

Goal:

```text
User A Sends Message
↓
Server Receives Message
↓
Server Pushes Message To User B Instantly
↓
No Page Refresh Required
```

Topics To Learn:

* WebSockets
* Socket.IO
* Events
* Emit / On
* Rooms
* User-to-Socket Mapping
* Realtime Message Delivery

Planned Progression:

```text
Understand HTTP Limitations
↓
Learn WebSocket Fundamentals
↓
Integrate Socket.IO
↓
Create Chat Rooms
↓
Realtime Messaging
↓
Online User Presence
```

### Chat Discovery

Implemented:

```http
GET /chat
```

Returns:

```json
{
  "id": 1,
  "otherUser": {
    "id": 2,
    "username": "john"
  },
  "lastMessage": "...",
  "lastMessageAt": "..."
}
```

Learned:

* Prisma relation includes
* Response transformation using map()
* Returning frontend-friendly DTOs

---

### Friend Request Rejection

Implemented:

```http
POST /friendRequest/:id/reject
```

Flow:

```text
Validate Request
↓
Validate Receiver
↓
Validate Pending Status
↓
Update Status To REJECTED
```

---

### Resend After Rejection Fix

Problem:

```text
Rejected requests could not be sent again.
```

Cause:

```prisma
@@unique([senderId, receiverId])
```

Solution:

```text
If request is REJECTED
↓
Update Status Back To PENDING
↓
Reuse Existing Row
```

Tested:

```text
Send
↓
Reject
↓
Resend
↓
Accept
```

Successfully working.

---

### Socket.IO Foundation

Implemented:

```text
HTTP Server Creation
Socket.IO Initialization
Socket Authentication Middleware
JWT Handshake Authentication
Socket Connection Testing
```

Verified:

```text
Client Connects
↓
JWT Verified
↓
User Attached To Socket
↓
Connection Accepted
```

---

## Current Backend Status

```text
✅ Register
✅ Login
✅ JWT Middleware

✅ User Search

✅ Send Friend Request
✅ Get Incoming Requests
✅ Accept Friend Request
✅ Reject Friend Request

✅ Auto Create Chat

✅ Get Chats

✅ Send Message
✅ Get Messages

✅ Socket.IO Server
✅ Socket.IO Authentication
```

---

## Next Feature

### Socket.IO Room Management

Flow:

```text
Socket Connect
↓
Authenticated User Available
↓
Fetch User Chats
↓
Join chat_<id> Rooms
↓
Verify Room Membership
```

Expected Result:

```text
User automatically joins all chat rooms
they participate in.
```

---

## After Room Management

### Realtime Message Delivery

Flow:

```text
POST /messages
↓
Save To Database
↓
Emit Socket Event
↓
Deliver Message To Chat Room
```

REST remains the source of truth.

Socket.IO becomes the realtime delivery layer.


# Day 7  - socket.io rooms made and updates messages endpoint 

## Dynamic Room Joining

### What was built

When a user connects via Socket.IO:

1. Socket authentication middleware verifies JWT.
2. Connection handler runs.
3. Backend fetches all chats belonging to the user.
4. User automatically joins all corresponding chat rooms.

Example:

User 1 chats:
- chat_1
- chat_5

Connection
    ↓
join chat_1
join chat_5

### Why it matters

Rooms allow targeting only relevant users instead of broadcasting events globally.

Without rooms:

emit
    ↓
every connected user receives it

With rooms:

emit to chat_1
    ↓
only chat_1 participants receive it

---

## Realtime Message Delivery

### What was built

After a message is successfully created:

Create message
    ↓
Update chat metadata
    ↓
Emit new_message

The controller emits the newly created message to:

chat_${chatId}

room.

### Result

Participants receive new messages instantly without refreshing or polling.

---

## End-to-End Verification

Verified complete flow:

User connects
    ↓
Joins chat rooms
    ↓
POST /messages
    ↓
Message stored in DB
    ↓
Socket event emitted
    ↓
Client receives payload

Observed payload:

{
  id: 4,
  chatId: 1,
  senderId: 2,
  content: "good morning",
  createdAt: "..."
}

---

Status:

✓ Dynamic room joining implemented
✓ Room architecture verified
✓ Realtime message emission implemented
✓ Realtime message reception verified
✓ End-to-end messaging flow working

# Day 8 - tested backend api's and fixed bugs 

Chat App Status:

Backend V1 Complete

✓ Auth
✓ Friend Requests
✓ Chats
✓ Messages
✓ Socket Rooms
✓ Realtime Messaging

Verified End-to-End:
Request → Accept → Chat → Message → Realtime Delivery

Next Step:
Frontend Architecture Session

# Day 9 - created frontend routes and auth page login

Chat App Frontend

Completed:
- Created Vite React TypeScript frontend project.
- Installed:
  - react-router-dom
  - axios
  - socket.io-client
- Created frontend folder structure:
  - pages
  - components
  - services
  - socket
- Created:
  - AuthPage
  - ChatPage
  - LoginForm
  - RegisterForm
- Configured routes:
  - /auth
  - /chat
- Verified routing works in browser.
- Implemented AuthPage toggle between LoginForm and RegisterForm.

Next:
- Build LoginForm UI.
- Build RegisterForm UI.
- Add form state using useState.
- Connect forms to backend auth endpoints.

# Day 10 - made loginform and registerform and connected with backend

- Added Tailwind CSS to the frontend.
- Built AuthPage with Login/Register toggle.
- Implemented LoginForm and RegisterForm.
- Created reusable Axios instance and auth API service.
- Connected login and registration to the backend.
- Verified successful login, cookie storage, navigation, and session persistence after refresh.

# Day 11 - Created the initial Chat Page layout with `Sidebar` and `ChatArea`.

- Added reusable components:
  - Sidebar
  - SearchUser
  - ChatList
  - ChatHeader
  - MessageList
  - MessageInput
- Implemented the Friend Requests button and modal UI.
- Added dummy chat messages and dummy friend request data for layout testing.
- Styled the initial chat page using Tailwind CSS to establish the application's overall structure.

# Day 12 - connected backend apis with frontend , made pages dynamic 

* Updated frontend types to match backend API responses.
* Connected chat list to the backend using `GET /chats`.
* Connected message list to the backend using chat-specific message fetching.
* Connected friend request modal to backend pending request data.
* Replaced hardcoded chat, message, and friend request UI with dynamic rendering.
* Added chat selection flow and automatic message loading using `useEffect`.
* Implemented accept and decline friend request actions with immediate UI updates after successful API responses.
* Prepared the application for the next milestone: real-time messaging with Socket.IO.

# Day 13 - socket client implementation , realtime message testing 

Implemented real-time messaging with Socket.IO.

Connected frontend socket after login.

Authenticated sockets using JWT cookies.

Joined all user chat rooms on connection.

Emitted new_message events from the backend.

Received real-time events on the frontend.

Verified live messaging between two different browsers/users.

# Day 14 - implemented userSearch and Ui improvements

## Authentication
- Added `/auth/me` endpoint.
- Integrated authenticated user fetching on the frontend.
- Removed the temporary hardcoded current user ID.
- Fixed message alignment using the authenticated user.

## Real-Time Chat
- Sidebar now updates immediately when new messages arrive.
- Chats automatically move to the top based on the latest activity.
- Implemented auto-scroll to the newest message.

## User Search
- Integrated live user search API.
- Added search results panel.
- Implemented relationship-aware search results.
- Added conditional button states:
  - Add Friend
  - Pending
  - Friends
  - Check Requests
- Implemented optimistic UI update after sending friend requests.

## Friend Requests
- Chat list refreshes immediately after accepting a friend request.
- Connected search flow with the existing friend request system.

## Notes
- Discovered shortcomings in the original API contract for the search feature.
- Decided to improve our future development process by designing:
  1. UI
  2. API Contract
  3. Edge Cases
  4. Backend
  5. Frontend
before implementing new features.

# Day - 15 fixed socket bugs and debounced the search

### Completed
- Fixed Socket.IO reconnection after browser refresh.
- Moved socket connection logic to the authenticated flow (`getCurrentUser`) instead of relying only on the login page.
- Added debounced user search (400ms delay) using `useEffect`, `setTimeout`, and `clearTimeout`.
- Verified both features are working correctly.

### Decision
- Feature development for Chat App v1 is considered complete.
- Next phase: deployment instead of adding more frontend polish.

# Chat App v1 - Project Log

## Duration

~15 days

---

## Goal

Build and deploy a production-ready real-time chat application while learning modern backend development.

---

## Major Milestones

### Backend

- Express server setup
- Prisma integration
- PostgreSQL database
- Authentication
- JWT
- Cookie authentication
- Friend request system
- Chat APIs
- Socket.IO integration

### Frontend

- Authentication pages
- Sidebar
- Chat interface
- Search users
- Friend requests
- Real-time message updates
- Auto-scroll
- Responsive layout

### Deployment

- Neon PostgreSQL
- Render backend
- Vercel frontend
- Production environment variables
- Production CORS
- Production cookies

---

## Biggest Challenges

- Socket.IO authentication
- Cookie-based authentication across different domains
- Production deployment
- React Router deployment
- TypeScript production builds
- Environment configuration

---

## Result

Successfully deployed a fully functional real-time chat application.

Users can:

- Register
- Login
- Add friends
- Chat in real time
- Refresh without losing messages

Project Status:

✅ Completed (Version 1)

# Chat App v2 - Project log started

# Day 1 - implemented schema changes and idempotency

### Database Schema

* Added a new `Attachment` model to support future file attachments.
* Updated the `Message` model:

  * Added a nullable `clientMessageId` field with a unique constraint to support idempotent message creation.
  * Made `content` nullable so the schema can support attachment-only messages in future phases.
* Generated and applied the corresponding Prisma migration.

### Message Service Refactor

Refactored the `sendMessage` service to support idempotent message creation.

Instead of querying the database first to check whether a message with the same `clientMessageId` already existed, the service now:

1. Attempts to create the message directly.
2. Relies on the database's unique constraint to detect duplicate requests.
3. If Prisma throws a `P2002` (unique constraint violation), fetches and returns the already-created message instead of creating a duplicate.

This keeps the common execution path efficient while still correctly handling client retries.

## Notes

* Attachment storage and upload integration are intentionally deferred to a later project phase.
* This work lays the foundation for retry-safe message delivery and future reconnect synchronization.

# Day 2 - Message reliability — clientMessageId, optimistic UI, socket reconciliation, and message states.

### Work Completed

1. Frontend clientMessageId
- Added clientMessageId to the frontend Message type.
- Generated a unique clientMessageId using crypto.randomUUID() whenever a new message is sent.
- Passed the clientMessageId along with the message content to the backend.
- Kept clientMessageId as the stable identifier connecting the optimistic message, database message, and Socket.IO message.

2. UIMessage and Message States
- Introduced a separate UIMessage type to represent messages while they are being processed on the client.
- Added message status:
  - sending
  - sent
  - failed
- Optimistic messages do not have a database id yet, so the database id remains optional on UIMessage.

3. Optimistic UI
- Implemented optimistic message insertion.
- A message is added to the UI immediately when the user presses Send instead of waiting for the backend.
- Newly created messages initially have status = "sending".
- Historical messages fetched from the backend are initialized with status = "sent".

4. Socket Echo / Duplicate Message Bug
- Discovered that the server broadcasts messages using io.to(chatId), which also sends the newly-created message back to the sender.
- This caused the same message to appear twice:
  - once from the optimistic UI
  - once from the Socket.IO event
- Fixed this by introducing an upsertMessage() function based on clientMessageId.
- If the clientMessageId already exists in the local message list, the incoming message updates the existing message instead of being appended.
- If it does not exist, the message is inserted normally.

5. Message List Identity
- Changed the React message key from the database id to clientMessageId.
- This allows optimistic messages and confirmed server messages to use the same stable identity.
- Existing database messages were backfilled with clientMessageId before relying on it as the message identity.

6. Failure Handling
- Added failure handling to the send operation.
- If the HTTP request fails, the optimistic message is changed from "sending" to "failed".
- The failed message remains visible instead of silently disappearing.

7. Message Status UI
- Added temporary visual indicators for:
  - Sending
  - Sent
  - Failed
- Verified that the message correctly transitions between these states.

### Testing

Successfully tested:

- Normal message sending.
- Multiple messages sent quickly.
- Optimistic message appearing immediately.
- Sending → Sent transition.
- Sending → Failed transition.
- Two browser tabs connected to the same chat.
- Sender receiving its own Socket.IO message without creating a duplicate.
- Receiver getting exactly one copy of the message.
- No React duplicate-key warnings.

### Current Message Flow

User sends message
    ↓
Generate clientMessageId
    ↓
Create optimistic UIMessage
status = sending
    ↓
Add immediately to UI
    ↓
HTTP request → backend
    ↓
Backend saves message
    ↓
Backend emits Socket.IO event
    ↓
Client receives message
    ↓
Match using clientMessageId
    ↓
Upsert existing optimistic message
    ↓
status = sent

If HTTP request fails:

sending → failed

### Next Task

Implement retry functionality for failed messages.

The retry flow will use the same clientMessageId so that the backend's idempotency mechanism can prevent duplicate database messages.

# Day 3 - Message retry , fixed old idempotency logic 

Continued development of Chat App v2 with a focus on reliable message delivery.

Implemented and verified:

* Client-generated `clientMessageId` for every outgoing message.
* Backend idempotency using `clientMessageId`.
* Optimistic message rendering on the frontend.
* Duplicate-message prevention when the same message request is received multiple times.
* Frontend message states:

  * `sending`
  * `sent`
  * `failed`
* Retry functionality for failed messages.
* Retry reuses the original `clientMessageId` instead of generating a new ID.
* Retry state transitions:

  * `failed → sending → sent`
  * `failed → sending → failed`
* Retry success continues to use the existing Socket.IO `new_message` event for final message reconciliation.
* Tested normal sending, failed sending, successful retry, repeated retry failure, and duplicate prevention.

### Reliability flow

```text
User sends message
       ↓
Optimistic UI
       ↓
clientMessageId generated
       ↓
Backend
       ↓
Database idempotency check
       ↓
Socket confirmation
       ↓
Message marked sent

If request fails:
       ↓
Message marked failed
       ↓
User clicks Retry
       ↓
Same clientMessageId reused
       ↓
Backend safely processes/reconciles request
```

### Result

The messaging system now handles temporary send failures without requiring the user to recreate the message manually, while the existing backend idempotency mechanism protects retries from creating duplicate messages.


# Day 4 - Reconnection & Message Synchronization

**Branch:** `feature/reconnection-sync-receipts`

Picked up Chat App v2 after a break and continued the reliability/scalability roadmap.

### Completed

- Reviewed the existing Socket.IO connection architecture.
- Confirmed that Socket.IO handles transport-level reconnection automatically.
- Confirmed that every new socket connection:
  - Re-runs JWT authentication middleware.
  - Reconstructs the user's chat room memberships through `joinUserRooms()`.
- Added frontend reconnect handling through the Socket.IO `connect` event.
- On reconnect:
  - Refresh chat/sidebar state using `fetchChats()`.
  - Synchronize the currently selected chat using `fetchMessages()`.
- Added cursor-based message synchronization using the auto-incrementing `Message.id`.
- Added optional `after` cursor support:
  - No cursor → fetch full message history.
  - `after=<messageId>` → fetch only messages after that ID.
- Fixed a React stale-closure issue in the reconnect handler by using `useRef` to access the latest message state.
- Tested the complete flow using two browser clients:
  - Client A disconnects.
  - Client B sends messages while A is disconnected.
  - Client A reconnects.
  - Missed messages are successfully synchronized.
  - `after=<id>` delta synchronization was verified through the actual API response.

### Milestone

- ✅ Socket.IO reconnection
- ✅ JWT re-authentication
- ✅ Room reconstruction
- ✅ Reconnect synchronization
- ✅ Cursor-based message synchronization

### Next

- Delivery receipts
- Read receipts
- End-to-end encryption later in the larger roadmap

# Day 5 — File Uploads (Images, Documents, Multi-Attachment)

**Branch:** `feature/file-uploads`

Picked up Chat App v2 to add file/image/document sharing, the next item after reconnection sync in the reliability/scalability roadmap.

### Completed

- Evaluated storage backends; started with Cloudflare R2, discovered it requires a card on file even for its free tier, switched to Supabase Storage instead.
- Integrated Supabase Storage via its S3-compatible endpoint using the standard `@aws-sdk/client-s3` SDK (not Supabase's own client), for portable, transferable S3 knowledge.
- Built a presigned-upload flow:
  - `POST /attachments/presign` validates file type/size and mints a short-lived signed PUT URL via `getSignedUrl`.
  - Client uploads directly to Supabase Storage — file bytes never pass through the backend.
- Extended the `Attachment` Prisma model: `objectKey` (storage identity), `mimeType`, `fileName`, `fileSize`, `duration`; supports multiple attachments per message.
- Extended `sendMessage` (service + controller) to accept an optional `attachments` array, create `Message` + `Attachment` rows in one transaction, and support text-only, attachment-only, and combined messages.
- Derived public object URLs at read-time from `objectKey` (never stored), applied consistently across the send-response, the duplicate-clientMessageId path, and message history fetches.
- Built multi-file selection UI in `MessageInput` (select, preview, remove) and wired `ChatArea`'s send flow to upload all files in parallel before constructing the optimistic message.
- Used `URL.createObjectURL` for instant local previews in the optimistic UI, replaced automatically by the server-confirmed URL once the real message round-trips.
- Fixed `Chat.lastMessage` sidebar preview to fall back to type-appropriate text (📷 Photo / 📄 filename / 📎 N files) for attachment-only messages — computed once on the backend, passed through the socket payload instead of being recomputed (incorrectly) on the client.
- Tested end-to-end with two browser clients: image send, document send, attachment-only send, combined text+attachment send, multi-file send — all rendering and persisting correctly.

### Milestone

- ✅ Presigned upload flow (Supabase S3-compatible)
- ✅ Multi-attachment schema
- ✅ Attachment-only / combined message support
- ✅ Optimistic UI with local preview → server URL handoff
- ✅ Sidebar preview fallback for non-text messages

### Next

- Voice message recording (reuses this same upload pipeline, tagged `AUDIO`)
- Delivery/read receipts
- End-to-end encryption

# Day 6 — Read Receipts

**Branch:** `feature/reconnect-sync`

Closed out the reconnect-sync branch's remaining scope by replacing the originally-planned "delivery receipts" with read receipts, per revised roadmap ordering (finish all small features before starting E2E encryption).

### Completed

- Added `participant1LastReadMessageId` / `participant2LastReadMessageId` (nullable Int) directly on `Chat` — no participant join table exists, so tracking lives on the chat row itself.
- Built `POST /chat/:chatId/read`: server computes the latest `Message.id` in the chat and writes it to the caller's field — never trusts a client-supplied value.
- Broadcasts a `chat_read` event via the existing `chat_{chatId}` socket room (same fanout pattern as `sendMessage`), so the other participant is notified live without a new subscription mechanism.
- Updated `getChats` to return a flattened `otherUserLastReadMessageId` per chat, matching the existing `otherUser` flattening pattern, so the frontend never needs to reason about `participant1Id`/`participant2Id`.
- Wired two frontend trigger points for marking a chat read: on chat selection, and on any new incoming message while that chat is open.
- Added a `chat_read` socket listener updating local `chats` state, and derived a single "live" selected-chat value from `chats` at render time to keep the read state and message list in sync.
- Implemented "Seen"/"Sent" rendering: a single status label shown only under the newest own message in the conversation (blank for all messages before it) — matched to Instagram/iMessage's convention rather than WhatsApp's per-message tick style.
- Reformatted message timestamps: time-only for today's messages, date+time for older ones, date+time+year once the message crosses into a previous year.
- Resolved a branch-divergence issue: file-upload work had landed on a separate branch, not on `reconnect-sync` — merged file-uploads into `main` first, then merged `main` into `reconnect-sync` before starting read-receipt work, avoiding a later merge conflict.
- Tested end-to-end across two clients: live read-status updates without refresh, correct "Seen" movement across multiple messages, correct state after a full page reload, and correct "no read event" behavior when the other client has the chat closed.

### Milestone

- ✅ Server-authoritative read-state computation
- ✅ Live read-receipt broadcast via existing socket room
- ✅ Single-marker "Seen"/"Sent" UI matching Instagram/iMessage convention
- ✅ Context-aware timestamp formatting
- ✅ Branch merged into `main`, `feature/reconnect-sync` deleted

### Next

- End-to-end encryption
- Redis / multi-instance scaling (separate non-`main`-merging branch, per earlier decision)

# Day 7 — E2EE: Client Key Generation

**Branch:** feature/e2ee-encryption

Started E2EE implementation per the locked design: static X25519 key exchange per conversation → HKDF → AES-GCM, single-device scope, Double Ratchet deliberately deferred (confirmed it builds on the same primitives, so nothing here is wasted if pursued later). This session covered the schema layer and the full client-side key generation/storage layer — the identity foundation everything else in E2EE builds on top of.

### Schema

    model User {
        id        String @id @default(uuid())
        ...
    +   publicKey String?      // X25519 public key, base64
    }

    model Message {
        ...
        content            String   // now holds JSON {ciphertext, nonce, tag} once encrypted
    +   encryptionVersion  Int?     // null = legacy plaintext, 1 = static X25519+AES-GCM
    }

    model Chat {
        ...
        lastMessage String?         // now holds the same JSON {ciphertext, nonce, tag} shape
    }

- No separate `nonce` column — it lives embedded inside the `content`/`lastMessage` JSON payload alongside ciphertext and tag, since the two are always needed together.
- `encryptionVersion` is the explicit disambiguator between old plaintext rows and new encrypted ones — deliberately not relying on "try JSON.parse and see if it throws," which would misfire on any old plaintext message that happens to look like valid JSON.

### Backend

- `PATCH /auth/me/publickey` — authenticated route, writes `publicKey` using the userId from the auth token, never a client-supplied id. Minimal handler: validate the string is present, `prisma.user.update`, return 200/204.

### Frontend

- New crypto utility module (key generation, storage, and base64 helpers) — pure logic, no React or HTTP dependency.
- `ensureKeyPairExists(userId)`:
  - Generates a non-extractable X25519 keypair via Web Crypto (`extractable: false`, usages `["deriveKey", "deriveBits"]`).
  - Reads/writes IndexedDB (`crypto-keys-db` → `keys` store), keyed by `userId`, not a hardcoded constant.
  - Exports the public key raw → base64, PATCHes it to the server, but only immediately after a fresh keypair is generated — not on every call.
  - Wrapped in a per-user in-flight promise map to dedupe concurrent invocations (React StrictMode double-invoke, or any future overlapping call) into a single execution.
- Wired into `ChatPage`'s mount `useEffect` — the app's sole authenticated route, so this single call site correctly covers new registrations, pre-E2EE existing accounts, and future storage-loss recovery without needing to special-case any of them.

### Bugs Found & Fixed (via deliberate testing, not just review)

1. **Cross-account key contamination** — IndexedDB record key was a hardcoded constant instead of `userId`; a second account on the same browser silently inherited the first account's keypair. Caught via a deliberate two-account test on the same browser.
2. **StrictMode-triggered race** — concurrent invocations for the same user both saw "no key exists" before either finished writing, generating two different keypairs; IndexedDB and the Postgres-stored public key ended up from different pairs. Fixed via the per-user in-flight promise map above.
3. **Unconditional PATCH on every mount** — caught during self-review; moved the server sync call inside the "freshly generated" branch only.

### Verified End-to-End

- IndexedDB and Postgres public keys match for a given account after a clean login.
- Refreshing the page does not re-fire the PATCH request.
- Two distinct accounts logging in on the same browser now produce two distinct, non-colliding keypairs.
- Console-log instrumentation confirmed key generation fires exactly once per identity after the dedupe fix, rather than twice under StrictMode.

### Milestone

- ✅ E2EE schema in place (`User.publicKey`, `Message.encryptionVersion`)
- ✅ Non-extractable, per-user-scoped X25519 keypair generation
- ✅ Idempotent public-key sync to server, server-authoritative write
- ✅ Two real concurrency/identity-scoping bugs found via deliberate multi-account/concurrent testing and fixed before building anything on top

### Next

- Key exchange on conversation open: fetch the other participant's `publicKey` from the server, import it as a `CryptoKey`, derive the shared secret via `deriveBits`, run it through HKDF to get the AES-GCM conversation key — verify independently on both participants' clients that the derived key is identical before wiring it into actual message send/receive.

# Day 8 — E2EE: Key Exchange & Derivation

**Branch:** feature/e2ee-encryption

Continued E2EE per the locked design, moving from client key generation/storage (Day 7) to actual key exchange: fetching the other participant's public key and deriving a shared AES-GCM key via X25519 → HKDF, verified identical on both sides before touching message encrypt/decrypt.

### Backend

    GET /chats/:chatId/public-key

- Auth check: confirms caller is one of the chat's two participants before returning anything — initial draft skipped this and silently returned the "other" key to any authenticated caller for any chatId, not just their own chats. Fixed before shipping.
- Single Prisma query via relation `include` (`participant1`, `participant2`), avoiding a second round-trip — reuses the same lookup needed for the auth check.
- Discriminated response handling: `chat not found` → 404, `caller not a participant` → 403, `chat found but other user has no key yet` → 200 with `{ publicKey: null }` (a normal, temporary state — not an error).

### Frontend

- New `useEffect` in `ChatPage`, keyed on `selectedChat?.id` (separate from the mount-time keypair-generation effect — different lifecycle, different trigger).
- Flow: fetch other participant's public key → `importKey` (X25519, raw) → `deriveBits` (256-bit shared secret) → `importKey` (HKDF, non-extractable) → `deriveKey` (HKDF, SHA-256, empty salt → AES-GCM key).
- Derived keys cached in a `Map<chatId, CryptoKey>` held in a `ref` (not state — avoids re-render on cache writes), guarded against re-deriving on chat revisit.
- Race-guarded with a `cancelled` flag in the effect cleanup, in case of fast chat-switching mid-derivation.

### Bugs Found & Fixed

1. **Missing participant authorization** — endpoint computed "the other participant's key" via a ternary without first checking the caller was actually a participant in that chat at all. Any authenticated user could query any chatId's public key. Added an explicit check before the lookup, returning 403 for non-participants.
2. **Collapsed null cases** — "chat doesn't exist" and "chat exists but other user has no key yet" were both being returned as 404. Split into distinct responses (404 vs 200 with `publicKey: null`) so the frontend can tell a real error apart from a normal wait-state.
3. **Prisma field casing mismatch** — schema had `PublicKey` (capital P), service code queried `publicKey` (lowercase). Unhandled 500 with no server-side logging to point at the cause. Renamed the schema field to lowercase for consistency with the rest of the schema, migrated.
4. **Axios `.data` not unwrapped** — `getChatPublicKey` returned the raw Axios response object instead of its `.data` payload; the destructured `publicKey` was silently `undefined` at the call site despite the network tab showing a correct response. Fixed by returning `response.data` explicitly.
5. **HKDF `extractable` misconfiguration** — WebCrypto requires the HKDF import key to be non-extractable with no exceptions; threw `KDF keys must set extractable=false`. Root cause was flipping the wrong key's extractability while trying to make the final AES-GCM key exportable for verification. Fixed by keeping the HKDF import key `false` always, and setting only the derived AES-GCM key temporarily `true`.
6. **Missing `hash` in HKDF params** — `HkdfParams` requires an explicit hash algorithm; WebCrypto doesn't default one. Added `hash: "SHA-256"`.
7. **HKDF salt randomized independently per side** (caught before testing, not a runtime bug) — an earlier draft called `crypto.getRandomValues()` for the salt on each client separately, which would have produced two different derived keys from the same shared secret. Fixed to a fixed/empty salt before it was ever exercised.

### Verified End-to-End

- Backend endpoint returns 403 for non-participants, 404 for nonexistent chats, and `{ publicKey: null }` (200) when the other user hasn't generated a key yet.
- `otherPublicKeyRaw` correctly populated on the frontend after the Axios fix.
- Both participants' browsers, tested independently (two accounts, same chat), derived and logged **identical** SHA-256 hashes of their respective derived AES-GCM keys — confirming X25519 → HKDF agreement is correct before any message encryption is built on top of it.

### Milestone

- ✅ `GET /chats/:chatId/public-key` implemented, authorized, and discriminated-response correct
- ✅ Frontend key-exchange effect implemented, keyed on `selectedChat?.id`, cached per-chat in a ref-backed `Map`
- ✅ X25519 → HKDF → AES-GCM derivation verified identical on both sides via independent hash comparison
- ✅ Seven issues (2 backend correctness, 2 silent/no-error bugs, 3 WebCrypto API misuses) found and fixed before building on top of this layer

### Cleanup Still Pending

- Flip the derived AES-GCM key's `extractable` back to `false` (was temporarily `true` for the verification test)
- Remove temporary verification `console.log`/export/hash code from the effect

### Next

- Message encrypt/decrypt: swap plaintext `content` for AES-GCM ciphertext on send, decrypt on render; extend to `Chat.lastMessage` (same encrypted JSON shape)
- Nonce handling: fresh random 96-bit nonce per message via `crypto.getRandomValues`, embedded in the content JSON alongside ciphertext/tag
- Legacy-message compatibility: `encryptionVersion: null` messages render as plaintext without attempting decryption
- Reactive staleness handling (deferred until basic encrypt/decrypt is solid): catch AES-GCM decrypt failure → clear cached key for that chat → re-derive → retry once → surface error if retry also fails

# Day 9 — E2EE: Encryption & Decryption of text messages 

## Goal for the session
Move from "E2EE primitives exist and are verified" to actual end-to-end encrypted
send/receive wired into the real message flow, including sidebar previews.

## What shipped

### 1. Message flow wired to encryption
- `encryptMessage(message, key)` in `lib/crypto/message.ts` — AES-GCM encrypt,
  returns a JSON string `{nonce, ciphertext, tag}` (all base64).
- `decryptMessage(encryptedMessage, key)` — reverses it, returns the original
  plaintext string.
- `decryptIfNeeded(message, key)` — the actual integration point. Branches on
  `encryptedVersion`: `null`/legacy → return content as-is; `1` → JSON.parse
  then `decryptMessage`; unknown key or parse/decrypt failure → safe fallback
  string instead of throwing.
- Fixed a real bug in the first draft of `encryptMessage`: IV was generated as
  `new Uint8Array(96)` (96 *bytes*) instead of `new Uint8Array(12)` (96 *bits*,
  the correct AES-GCM standard nonce size).

### 2. Key management — moved from per-selected-chat to bulk, cached
- Originally derived the shared AES key only for `selectedChat`, in a
  `useEffect` keyed on `[selectedChat?.id, currentUser]`.
- Replaced with `deriveAndCacheChatKey(chatId, userId)`, a standalone function
  called in a loop over all `chats` whenever the chat list loads
  (`useEffect` on `[chats, currentUser]`). Needed so sidebar previews for
  *unopened* chats can also be decrypted, not just the open one.
- Cache lives in a ref (`chatKeysRef = useRef<Map<number, CryptoKey>>`), not
  React state — keys don't need to trigger re-renders, they're read
  imperatively at send/decrypt time.
- Found and fixed a race: the original guard (`if (chatKeysRef.current.has(id))
  return`) was checked before any `await`, so if the effect re-fired while a
  derivation for the same chat was still in flight (e.g. `fetchChats()` being
  called from three different places — mount, socket reconnect, friend
  request accept — each producing a new `chats` array reference), duplicate
  `getChatPublicKey` calls fired for the same chat. Added a second ref
  (`pendingDerivations = useRef<Set<number>>`) marked *synchronously* before
  the first `await`, closing the window. Reduced request count but didn't
  fully eliminate duplicates — parked as a known imperfection, not reopened
  today (see Known gaps).

### 3. Two real naming/wiring bugs found via full send→store→fetch→decrypt trace
- **Field name mismatch, both directions**: frontend used
  `encryptionVersion` everywhere (type, `sendMessage`'s POST body,
  `decryptIfNeeded` calls); backend used `encryptedVersion` (Prisma field,
  service function, route handler). Value was silently lost on send and
  silently `undefined` on read. Standardized on `encryptedVersion` throughout
  (backend name won since it touches the DB column).
- **Swapped positional arguments**: controller called
  `messageService.sendmessage(chatId, userId, content, clientId, attachments, encryptedVersion)`
  but the service signature is
  `(chatId, userId, content, clientId, encryptedVersion, attachments = [])`.
  This silently stored `encryptedVersion: null` for every message (since an
  array is never `=== 1`) and would throw when `attachments.map` was called
  on what was actually the version number. Fixed by reordering the call site
  to match the function signature.

### 4. Sidebar preview (`Chat.lastMessage`) needed its own fix
- Server builds `lastMessage` from `message.content` via `buildMessagePreview`
  — which now receives ciphertext and passes it through untouched (it has no
  way to know it's encrypted). Fix: store an encrypted-version marker
  alongside the preview too.
  - Added `lastMessageEncryptedVersion Int?` to the `Chat` Prisma model,
    migrated.
  - Service now writes `lastMessageEncryptedVersion: encryptedVersion` next
    to `lastMessage` in the same `chat.update`.
- Frontend: added a separate `previewOverrides` state
  (`Record<chatId, decryptedPreviewText>`), computed in its own `useEffect`
  on `[chats, currentUser]`, merged into the `chats` array only at the point
  it's passed to `Sidebar` — deliberately *not* written back into `chats`
  itself, to avoid a decrypt-loop (decrypting would change `chats`, which
  would re-trigger the effect, which would try to re-decrypt already-plain
  text).
  - `handleNewMessage`'s live socket-driven sidebar update decrypts inline
    and writes straight into `chats.lastMessage` (a deliberate shortcut, not
    using `previewOverrides`) — had to also set
    `lastMessageEncryptedVersion: null` there so the effect above doesn't try
    to re-decrypt that already-plaintext value on the next `chats` change.

### 5. Unrelated infra hiccup
- Hit a `PrismaClientKnownRequestError P1001` (can't reach Neon DB host)
  mid-session — root cause was Neon's free-tier compute auto-suspend / cold
  start, not an app bug. Resolved itself on retry after the compute resumed.
  Possibly related to the elevated `public-key` request count observed later
  (socket reconnect churn during the outage window).

## Testing performed
Full manual pass, two real accounts:
1. Send text-only message — instant optimistic render, live socket decrypt
   on receiver, DB row confirmed as ciphertext JSON with `encryptedVersion: 1`.
2. Reload both sides post-send — confirmed decrypt-from-server (not just
   optimistic local state) works.
3. Attachment-only message (no text) — confirmed `content: null`,
   `encryptedVersion: null`, renders correctly after reload.
4. Retry flow (killed network mid-send, reconnected, retried) — sent and
   decrypted correctly.
5. Sidebar preview — failed on first pass (showed raw ciphertext JSON),
   fixed per section 4 above, passed on retest.

## Known gaps / deliberately parked
- Duplicate `getChatPublicKey` requests are reduced but not fully eliminated
  after the in-flight-guard fix (78 requests observed for 3 chats against an
  expected ~6 under StrictMode). Suspected residual cause: multiple
  `fetchChats()` call sites still producing new array references close
  together, especially under reconnect churn. Not reopened today — the app
  is at "quality bar is functionally correct, this is a wasted-request
  problem, not a correctness one." Candidate for a later pass if it gets
  worse or before shipping.
- No push-notification content preview story (server can't decrypt to build
  one).
- No key rotation / device-reset story (accepted tradeoff, not yet verified
  to fail gracefully).

# Day 10 — UI-Polish: changed the theme to dark , fixed format issues etc 

UI polish pass fully completed and merged into main (feature/ui-polish branch deleted). Fixed the background/text-contrast issues left by the first round of scoped Copilot prompts (dark canvas wasn't applied consistently, several text elements were dark-on-dark), restyled FriendRequestModal.tsx which had been missed entirely in the first pass, then did a comprehensive per-file pass — background, text, spacing, and states together per file — matched against an approved dark dev-tool-style mockup (teal accent, monospace metadata, layered surface depth instead of one flat background). Landed three real fixes alongside the styling: an image-attachment lightbox (click-to-expand, required new local state), a sidebar timestamp formatting bug (was rendering raw ISO string instead of reusing the existing formatter), and a sidebar width increase to fix the Friend Requests modal overflowing/clipping.

Confirmed the new UI is a genuine upgrade over the old plain blue-and-white look — not just different, actually better.

Investigated an apparent "key regenerates on login" issue seen on the deployed site vs localhost. Root-caused as expected, non-bug behavior: IndexedDB is origin-scoped, so localhost and the Vercel domain are separate origins with entirely separate key-pair storage — not a real regeneration bug. Confirmed keys persist correctly across refreshes on the deployed site itself.

Chat App V2 feature scope is now functionally complete. Remaining before calling V2 fully done: tag current main commit as stable-v2, disable auto-deploy on Render and Vercel, then start the Redis/multi-instance-scaling branch (final phase, deliberately kept off main/prod given free-tier hosting constraints).

# Day 11 -- Redis / multi-instance scaling (final phase of V2)

## Summary

Took the backend from "one Dockerized instance working" to a multi-instance
setup: 3 backend containers behind Nginx, Socket.IO synced through Redis, and
database connections capped through Neon's pooler. Cross-instance messaging
was tested end to end and works.

## What got done

- Smoke-tested the Dockerized backend against the frontend (closes step 2).
- Wrote `docker-compose.yml`: 3 backend services, Redis, Nginx.
- Wrote `nginx.conf`: round-robin upstream with WebSocket upgrade support.
- Wired the Socket.IO Redis adapter into `socket.ts`.
- Switched the app to Neon's pooled endpoint with an explicit pool cap, and
  added a separate direct URL for migrations.
- Verified cross-instance delivery: two users connected to different
  instances exchange messages, receipts and sidebar previews correctly.
- Measured DB connections with all three instances up: **13**.

## Decisions made (and why)

| Decision | Reason |
|---|---|
| 3 explicit backend services instead of `deploy.replicas: 3` | Each gets its own `INSTANCE_ID`, so logs show which instance served which user. Replicas would hide that. |
| No host ports on backends; only Nginx exposes 8080 | Traffic must go through the load balancer, otherwise the test proves nothing. |
| Redis used for pub/sub only, no persistence | It carries transient socket events. Nothing in it is worth saving. |
| Nginx round-robin, no sticky sessions | Clients use WebSocket-only transport, so no HTTP long-polling session needs to stay on one instance. |
| Frontend `transports: ["websocket"]` | Socket.IO's default long-polling handshake breaks under round-robin without sticky sessions. |
| `dns: 8.8.8.8` on each backend service | Same workaround as the earlier `docker run --dns` fix for Neon hostname resolution. |
| Frontend stays outside Docker, points at `localhost:8080` | This phase is backend/infra only. |
| Full pooled Neon setup, not just a `connection_limit` cap | Bounded DB footprint by design, plus the direct/pooled split is the standard production pattern. |
| `DATABASE_URL` pooled + `pgbouncer=true` + `connection_limit=5`; `DIRECT_URL` for migrations | Max 3 x 5 = 15 client connections; migrations need session features the pooler doesn't support. |
| Prisma 6.19.3 `directUrl` datasource setup | Supported as written on this version. |
| No self-hosted PgBouncer | Neon's built-in pooler already does the job. |
| Skipped rate limiting | Out of scope for this phase (decided earlier). |
| Skipped the load-test reproduction of the direct-connection failure | Optional, and time is limited with midterms. Noted as a design decision, not a measured result. |

## Problems hit and fixes

- **Build failed: `Cannot find module '@socket.io/redis-adapter'` and `'redis'`.**
  Root cause: the imports existed in `socket.ts` but the packages were never
  installed, so `npm ci` (cached) never pulled them in. Fix:
  `npm install @socket.io/redis-adapter redis` in `backend/`, and commit the
  updated lockfile (`npm ci` fails if it's out of sync).
- **Discovered `DATABASE_URL` was the direct Neon string** (no `-pooler` in
  the hostname) with no `connection_limit`, so each container would open
  Prisma's default pool of `CPUs * 2 + 1` connections.

## Verification

- Two users on different instances: messages arrive live across instances.
- "Seen" receipts and sidebar previews update on both sides.
- Connection count in `pg_stat_activity` with 3 instances running: 13.

## Not done / known limits

- No load test, so no measured claim about throughput or behavior under load.
- Observability (structured logging, metrics) and presence are not built.
- Prometheus/Grafana and Kubernetes are out of scope for this project.

## Next

1. Confirm `.env` files are gitignored and not in the diff; add `.env.example`.
2. Push code, merge branches into `main`.
3. Confirm Render and Vercel did not redeploy (live site stays on `stable-v2`).
4. Dedicated README day: architecture, E2EE, scaling, honest limitations.