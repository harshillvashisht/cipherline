# Learning Notes

# 2026-06-20
## IDs vs Usernames

Do not use usernames as foreign keys.

Reason:

* Usernames can change.
* IDs are stable.

Use:

* senderId
* receiverId

instead of usernames.

---

## Message Ownership

Messages belong to chats.

Message:

* id
* chatId
* senderId
* content
* createdAt

Chat determines participants.

---

## Pagination

Do not load all messages.

Load:

* latest 25 messages

When user scrolls:

* request older messages
* use oldest loaded message as cursor

Example:
GET /messages?before=76

---

## Offline Messages

Always save messages to database first.

If recipient is online:

* send websocket event

If recipient is offline:

* message remains stored

Messages are loaded when user opens chat.

---

## Unread Counts

Receiving a websocket event does not mean message is read.

Track:

* lastReadMessageId

Unread count:

* messages after lastReadMessageId

---

## Duplicate Prevention

Before creating:

* FriendRequest
* Chat

Check whether one already exists.

Reject duplicates.

---

## Backend Design Principle

Think in entities and relationships.

Entities:

* User
* FriendRequest
* Chat
* Message

Before coding ask:

* What data exists?
* Who owns it?
* How is it related?

# 2026-06-21

## Prisma

- Foreign keys live on the many side.
- Relation arrays are mostly for reverse traversal and Prisma convenience.
- validate checks schema syntax, not architecture quality.
- generate creates the Prisma client.
- migrate creates actual database tables.

## Git

- Git can be initialized at a parent folder and track nested projects.

## Express

- app.ts creates/configures the app.
- server.ts starts the app.
- express.json() parses incoming JSON bodies.

# 2026-06-22

## Custom Error Handling

Learned why a custom ApiError class should extend JavaScript's built-in Error class. This allows application-specific information such as statusCode to be attached while still behaving like a normal error object.

## Error Propagation in Express

Learned how errors flow through an Express application:

Request → Controller → Service → throw Error → next(error) → Error Middleware → Response

Instead of handling errors inside every controller, errors can be passed to a centralized middleware using next(error).

## Global Error Middleware

Implemented a centralized error handling system capable of handling:

* ApiError instances
* Zod validation errors
* Unknown server errors

This keeps controllers and services clean while ensuring consistent API responses.

## Zod Validation

Learned how to create schemas for request validation and validate incoming request bodies using:

* string validation
* email validation
* minimum length validation

Also learned that Zod throws a ZodError when validation fails.

## Error Type Detection

Learned to distinguish different error types using instanceof rather than checking string names.

Examples:

* err instanceof ApiError
* err instanceof ZodError

## Authentication Fundamentals

Implemented user registration and login flows.

Registration flow:

* Validate request data
* Check for existing email
* Hash password using bcrypt
* Store user in database

Login flow:

* Validate request data
* Find user by email
* Compare passwords using bcrypt.compare()
* Return user information if authenticated

## HTTP Status Codes

Improved understanding of common status codes:

* 200 OK → Successful login
* 201 Created → Successful registration
* 400 Bad Request → Validation errors
* 401 Unauthorized → Invalid credentials
* 409 Conflict → Duplicate email
* 500 Internal Server Error → Unexpected failures

## Biggest Insight

The hardest part of authentication was not implementing login itself. The difficult part was building the architecture around it:

* Services
* Controllers
* Validation
* Error handling

Once the architecture was in place, implementing login became straightforward.

# 2026-06-23

## JWT Fundamentals

* JWT is encoded, not encrypted.
* JWT payload can be decoded by anyone possessing the token.
* Sensitive data should not be stored inside JWT payloads.
* JWT signing and verification must use the same secret.

## Login Flow

* Verify user credentials.
* Generate JWT using jwt.sign().
* Return token to client.
* Client stores token and sends it on future requests.

## Authentication Middleware

* Read Authorization header from incoming requests.
* Understand Bearer token format:
  Authorization: Bearer <token>
* Extract token using split(" ").
* Verify token using jwt.verify().
* Attach decoded payload to req.user.
* Call next() to continue request execution.

## Express Middleware Concepts

* Middleware executes before route handlers.
* Protected routes can be secured by placing auth middleware before routes.
* Middleware can modify the request object before passing control.

## TypeScript Learning

* Express Request does not contain a user property by default.
* Extend Express Request using declaration merging.
* Create custom AuthUser interface.
* Add AuthUser to Request type for autocomplete and type safety.
* Use type assertions when working with jwt.verify() results.

## Debugging Lessons

* Use console logs to identify where execution stops.
* Read actual error messages before changing code.
* jwt.verify() throws errors rather than returning null.
* Invalid signature errors usually indicate a token or secret mismatch.
* Not every bug is in the code; sometimes the tool usage is incorrect.

## Authentication Flow Understanding

Login
→ Generate JWT
→ Client stores token
→ Client sends token in Authorization header
→ Middleware extracts token
→ Middleware verifies token
→ User data attached to req.user
→ Protected route executes

## User Search API Design

Learned that searching users should use query parameters rather than path parameters.

Example:

GET /api/v1/users/search?username=har

Reason:

* Search is filtering a collection of users.
* Multiple results may be returned.
* Query parameters are designed for filtering.

---

## Partial Username Search

Implemented partial matching using Prisma.

Users do not need to remember the exact username.

Example:

Search:

har

Matches:

* harsh
* harry
* harshill

---

## Case-Insensitive Search

Learned how to perform case-insensitive searches in Prisma.

Example:

HAR
har
HaR

all return the same results.

This improves user experience and prevents unnecessary search failures.

---

## Excluding Current User

Learned that business rules can often be enforced directly in database queries.

Used a NOT condition to exclude the authenticated user from search results.

Reason:

* Users should not send friend requests to themselves.
* Unnecessary data is not returned from the database.

---

## Data Exposure Principle

Only return the data required by the feature.

For user search, return:

* id
* username

Do not return:

* password
* email
* internal fields

Principle:

Return the minimum data needed for the frontend to function.

---

## Search Input Sanitization

Usernames cannot contain spaces.

Removed spaces from the search query before querying the database.

Example:

"har sh"

becomes:

"harsh"

This makes searches more forgiving and user-friendly.

---

## API Testing

Verified the following cases:

* Partial username search
* Case-insensitive search
* Searching own username
* Nonexistent username
* Missing query parameter

Testing edge cases is important before considering a feature complete.

# 2026-06-24

## 1. Database Constraints vs Application Logic

Today I learned that database constraints and application logic solve different problems.

For example:

```prisma
@@unique([senderId, receiverId])
```

prevents duplicate rows from being inserted into the database, but it does not replace business logic checks.

I still need application-level validation for cases such as:

* Sending a friend request to myself
* Returning a user-friendly error message before the database throws an error
* Preventing reverse friend requests from creating duplicate relationships

I also learned that database constraints are the final safety net, not the first line of validation.

---

## 2. Canonical Representation of Relationships

A unique constraint on:

```prisma
@@unique([participant1Id, participant2Id])
```

does not prevent:

```text
(1,2)
(2,1)
```

because those are different tuples.

To solve this, I normalize the order before creating a chat:

```ts
const participant1Id = Math.min(senderId, receiverId);
const participant2Id = Math.max(senderId, receiverId);
```

This guarantees that every chat between two users is represented the same way.

---

## 3. Prisma Relations and Select

I learned how to fetch related data directly through Prisma relations.

Example:

```ts
select: {
    id: true,
    sender: {
        select: {
            id: true,
            username: true
        }
    }
}
```

This allowed me to return incoming friend requests together with sender information without writing SQL joins manually.

---

## 4. Transactions

I used Prisma transactions in two scenarios:

### Friend Request Acceptance

* Update request status
* Create chat

Both operations must succeed together.

### Message Sending

* Create message
* Update chat metadata

Both operations must succeed together.

I learned two transaction styles:

```ts
prisma.$transaction([
    ...
])
```

and

```ts
prisma.$transaction(async (tx) => {
    ...
})
```

The callback version is useful when later queries depend on results from earlier queries.

I also learned that `tx` is simply a transaction-scoped Prisma client.

---

## 5. Authorization Patterns

A recurring backend pattern appeared today:

```text
Find Resource
↓
Existence Check
↓
Authorization Check
↓
Business Validation
↓
Database Operation
```

I used this pattern in:

* Accept Friend Request
* Send Message
* Get Messages

---

## 6. Common Bugs Encountered

### Missing await

I accidentally wrote:

```ts
const chat = prisma.chat.findUnique(...)
```

instead of:

```ts
const chat = await prisma.chat.findUnique(...)
```

which caused TypeScript to treat the value as a Promise instead of a Chat object.

### Route Parameter Mistake

I called:

```text
/ friendRequest/:1/accept
```

instead of:

```text
/ friendRequest/1/accept
```

which resulted in `NaN` being parsed from the route parameter.

### Authorization Logic

I initially used:

```ts
||
```

where

```ts
&&
```

was required.

This reminded me that authorization conditions must be tested carefully using actual values.

---

## 7. Messaging Design

For message retrieval I chose:

```ts
orderBy: {
    createdAt: "asc"
}
```

because conversations should be read chronologically.

I also learned that chat lists are usually sorted differently:

```ts
lastMessageAt: "desc"
```

so the most recently active chats appear first.

---

## Key Takeaway

Today reinforced that backend development is less about writing queries and more about designing system behavior, validation rules, authorization checks, and data consistency.

# 2026-06-25

## 1. N+1 Query Problem

A naive implementation of `GET /chat` would fetch all chats and then execute an additional query for each chat to retrieve the other user's information.

Example:

```text
Get Chats
↓
For Each Chat
↓
Fetch Other User
```

This results in:

```text
1 Chat Query
+
N User Queries
```

which does not scale well.

Using Prisma relations with `include` allows all required data to be fetched in a single query.

---

## 2. API Responses Should Be Designed For Clients

Database structures and API responses do not have to look the same.

Database:

```text
participant1
participant2
```

API Response:

```text
otherUser
```

A transformation layer can reshape database results into a format that is easier for the frontend to consume.

Example:

```ts
const result = chats.map(...)
```

This pattern is common in backend development:

```text
Database Model
↓
Transformation
↓
API Response DTO
```

---

## 3. State Transitions Matter

Friend requests are not just records in a database.

They have a lifecycle:

```text
PENDING
↓
ACCEPTED
```

or

```text
PENDING
↓
REJECTED
↓
PENDING
```

Backend logic must correctly handle transitions between states.

---

## 4. Database Constraints Influence Design

The schema contains:

```prisma
@@unique([senderId, receiverId])
```

This prevents multiple friend request rows between the same pair of users.

Because of this constraint, re-sending a rejected request cannot create a new row.

Instead:

```text
REJECTED
↓
PENDING
```

must update the existing record.

This is an example of database constraints shaping business logic.

---

## 5. Common Backend Bug: Forgetting To Return

Handling a special case is not enough.

Example:

```text
Handle REJECTED
↓
Update Request
↓
Return
```

Without returning, execution continues and may trigger unintended logic.

A service should either:

```text
Return
```

or

```text
Throw
```

once a branch has been handled.

---

## 6. Designing Query Logic Around Business Rules

The initial friend request query filtered only:

```text
ACCEPTED
PENDING
```

which made it impossible to detect rejected requests.

The better approach was:

```text
Find Existing Request
↓
Inspect Status
↓
Apply Business Logic
```

rather than filtering away states that still matter to the application.

---

## 7. Chat Discovery Design

A chat list should return information useful to the frontend.

Response shape:

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

instead of exposing raw database fields like:

```text
participant1
participant2
```

which are implementation details.

## 1. Express App vs HTTP Server

Before Socket.IO:

```ts
app.listen(PORT);
```

After Socket.IO:

```ts
const server = http.createServer(app);
server.listen(PORT);
```

Reason:

* Express is a request handler.
* HTTP Server owns the network connection.
* Socket.IO must attach to the HTTP server, not Express.

Architecture:

```text
HTTP Server
├── Express
└── Socket.IO
```

---

## 2. REST and Socket.IO Have Different Responsibilities

REST:

```text
Persistence
Validation
Authorization
Database Operations
```

Socket.IO:

```text
Realtime Delivery
Connection Management
Rooms
Presence
```

We are NOT replacing existing REST endpoints.

Message flow:

```text
POST /messages
↓
Save To Database
↓
Emit Socket Event
↓
Realtime Update
```

Database remains the source of truth.

---

## 3. Socket.IO Authentication

Express middleware:

```ts
(req, res, next)
```

Socket.IO middleware:

```ts
(socket, next)
```

Authentication is performed during the handshake.

Client sends:

```ts
auth: {
    token: jwt
}
```

Server receives:

```ts
socket.handshake.auth.token
```

JWT is verified and user information is attached to the socket:

```ts
(socket as any).user = {
    id,
    email,
    username
}
```

---

## 4. Socket.IO Error Handling

Express:

```ts
throw new ApiError(...)
```

Socket.IO:

```ts
return next(new Error(...))
```

Socket.IO middleware should reject the connection using next(error).

---

## 5. Common Bug Found

JWT payload contained:

```ts
{
    id,
    email,
    username
}
```

but middleware attempted:

```ts
payload.userId
```

Result:

```text
id = undefined
```

Fix:

Use the same property name that was used when signing the JWT.

---

## 6. Testing Socket.IO

Used socket.io-client test script.

Flow:

```text
Client
↓
Connect
↓
Send JWT
↓
Authenticate
↓
Connection Accepted
```

Successfully verified:

```text
JWT reaches server
JWT verifies correctly
User attached to socket
Socket connection established
```
# 2026-06-26

## 1. Socket.IO Rooms Are Dynamic

Rooms do not need to be pre-created.

socket.join(`chat_${chat.id}`)

creates/uses the room automatically.

This allows an application to support any number of chats without hardcoding room names.

---

## 2. for...of vs for...in

Wrong:

for (const chat in chats)

Returns array indexes.

Correct:

for (const chat of chats)

Returns actual chat objects.

This bug surfaced while trying to access chat.id.

---

## 3. Separation of Concerns

Socket authentication:

Verify JWT
Attach user

Room management:

Join user rooms

Message service:

Business logic
Database operations

Controller:

Emit socket events
Return HTTP response

Each layer should have a single responsibility.

---

## 4. Event Name vs Payload

Incorrect mental model:

emit(result.content)

Socket.IO interprets the string as the event name.

Correct mental model:

emit(eventName, payload)

Example:

emit("new_message", result)

Where:

Event Name:
    new_message

Payload:
    created message object

---

## 5. Realtime + REST Work Together

Sockets are not a replacement for fetching history.

Pattern:

GET /messages
    ↓
Load existing messages

socket.on("new_message")
    ↓
Receive future messages

This is the standard architecture used by realtime chat applications.

---

## 6. Frontend and Rooms Are Different Concerns

Server-side:

User joins all chat rooms on connection.

chat_1
chat_5
chat_12

Frontend-side:

When a new message arrives:

if(message.chatId === currentOpenChatId)
    append message to conversation
else
    update chat list
    increment unread count

Room membership is handled by the server.
Message display decisions are handled by the frontend.

---

## 7. End-to-End Realtime Flow

User A sends message
        ↓
Message saved in database
        ↓
Socket event emitted to room
        ↓
Room routes event
        ↓
User B receives event

This was the first complete realtime feature implemented in the project.

# 2026-06-27

## Project Outcome

Built and verified:

- JWT Authentication
- Friend Requests
- Chat Creation
- Messaging
- Socket.IO Authentication
- Socket Rooms
- Realtime Message Delivery
- Prisma Migrations
- Database Indexes

Verified end-to-end flow:

User A
→ Send Request
→ User B Accepts
→ Chat Created
→ Send Message
→ Realtime Delivery

Backend V1 completed successfully.

---

# Technical Learnings

## 1. Architecture Matters More Than Coding

Most implementation became straightforward after deciding:

- Friend request flow
- Chat creation timing
- Database schema
- Room architecture
- API structure

Lesson:

> Spend time designing before coding.

---

## 2. Debugging Is a Skill

Example:

FriendRequest.updatedAt migration issue.

Process:

- Added logs
- Narrowed failure point
- Read stack trace
- Identified schema drift
- Applied migration

Lesson:

> Investigate before asking for help.

---

## 3. Read the Actual Error

Wrong approach:

- Guessing
- Looking only at HTTP 500

Correct approach:

- Read stack trace
- Find exact failing line
- Fix root cause

Lesson:

> The stack trace is usually the fastest path to the solution.

---

## 4. Schema Must Match Database

Problem:

Prisma schema expected:

updatedAt

Database did not contain:

updatedAt

Result:

P2022 error.

Lesson:

> After schema changes, always run migrations and verify database state.

---

## 5. Build First, Optimize Later

Avoided distractions:

- Typing indicators
- Read receipts
- Online presence
- Unread counts
- Attachments

Focused only on MVP.

Lesson:

> Finish the core product before adding extra features.

---

# Personal Learnings

## 1. Finish Things

Completed an entire backend instead of endlessly consuming tutorials.

Lesson:

> Building teaches more than watching.

---

## 2. Think Before Asking

Current habit:

Feature finished
→ Ask "What's next?"

Better habit:

Feature finished
→ Think for 5 minutes
→ Propose next step
→ Ask for review

Lesson:

> Develop architectural thinking, not just implementation skills.

---

## 3. Investigate Further Before Seeking Help

Before asking:

- Add logs
- Read error
- Form hypotheses

Target:

Reach 60-70% of investigation before requesting help.

---

## 4. Confidence Often Lags Behind Skill

Repeated pattern:

"I don't know backend."

Then successfully implementing:

- Transactions
- Authorization
- Realtime messaging
- Socket rooms

Lesson:

> Judge progress by capability, not by confidence.

---

## 5. Engineering Requires Decisions

Many situations do not have a perfect answer.

Better approach:

"This seems reasonable. Let's test it."

Instead of:

"What is the perfect solution?"

Lesson:

> Make decisions and gather evidence.

---

# Improvements For Frontend Phase

When a feature is completed:

Do not immediately ask:

"What's next?"

Instead:

1. Think independently.
2. Propose the next step.
3. Explain your reasoning.
4. Ask for critique.

Example:

"I think we should build routing before pages because multiple pages will need navigation. Am I missing something?"

Goal:

Move from:

"Tell me what to do."

to

"Review my plan."

---

# Key Takeaway

The biggest achievement of Backend V1 was not the code.

It was crossing the line from:

"I study programming."

to

"I can build software."

# 2026-06-28

Frontend Learning

- Created first React + TypeScript project using Vite.
- Learned Vite project creation flow:
  - Framework selection (React)
  - Variant selection (TypeScript)
  - ESLint setup
- Learned basic React Router setup:
  - BrowserRouter
  - Routes
  - Route
- Learned that JSX must be returned from a component.
- Fixed issue where BrowserRouter was not being returned from App component.
- Understood basic frontend architecture:
  - Pages
  - Components
  - Services
  - Socket layer
- Discussed AuthPage architecture and decided to use a Login/Register toggle inside a single AuthPage route.

## 2026-06-29

- Built controlled Login and Register forms using React state.
- Connected frontend forms to the backend through a dedicated auth API layer.
- Learned the child → parent callback pattern (`onRegisterSuccess`) for updating parent state.
- Configured Tailwind CSS for the project and used it for the auth UI.
- Debugged a CORS issue by tracing the request flow from React → Browser → Express instead of guessing.
- Completed my first full frontend authentication flow (React → Axios → Backend → Cookie → Navigation).

# 2026-06-30

### What I Learned

- Planned the chat page by breaking it into reusable components instead of creating one large component.
- Learned why state should eventually be owned by `ChatPage` and passed down as props rather than each component fetching its own data.
- Implemented a proper React modal pattern by passing an `onClose` callback from the parent component.
- Understood event bubbling and why `e.stopPropagation()` prevents the overlay click from firing while not affecting API requests.
- Reinforced that UI structure and functionality should be completed before spending time on visual polish.

# 2026-07-01

## Learning Log - Chat App Frontend Integration

* Replaced guessed frontend interfaces with types that exactly match backend API responses.
* Understood React's data flow by keeping application state in `ChatPage` and passing it to child components through props.
* Learned why callback props such as `onSelectChat` are preferred over directly exposing state setters.
* Converted `ChatList`, `ChatHeader`, `FriendRequestModal`, and `MessageList` from static UI to dynamic components using backend data.
* Practiced using `useEffect` for different scenarios:

  * Fetch chats on component mount.
  * Fetch friend requests on component mount.
  * Fetch messages whenever the selected chat changes.
* Reinforced the idea that components should only receive the data they need instead of managing unrelated state.
* Learned why HTTP-only JWT cookies require a future `/auth/me` endpoint to identify the currently logged-in user on the frontend.
* Improved React architecture by letting the parent component own state while child components communicate through callback props.

# 2026-07-02

How Socket.IO authentication works with HTTP-only cookies.

How to join users into multiple chat rooms.

How to emit room-specific events.

How frontend and backend sockets communicate in real time.

How to debug distributed systems using logs instead of guessing.

Why browser tabs can share authentication state and cause confusing test results

# 2026-07-03

## React
- Learned how to fetch and use the authenticated user throughout the application.
- Understood where optimistic UI updates should be implemented (where state is owned).
- Implemented automatic scrolling using `useRef` and `scrollIntoView()`.
- Practiced conditional rendering based on application state.

## Backend/API Design
- Learned that API responses should be designed around frontend requirements rather than directly mirroring database models.
- Understood the concept of enriching API responses with derived information (relationship status).

## State Management
- Updated chat sidebar state in response to Socket.IO events.
- Implemented optimistic updates for search results after sending friend requests.
- Refreshed chat state after accepting a request to synchronize the UI.

## Engineering Lessons
- Designing the API contract before implementation prevents unnecessary backend iterations.
- A database schema and an API response are two different things.
- Requirements discovered during implementation often indicate missing design decisions rather than bad code.
- Small UX improvements (auto-scroll, optimistic UI, real-time sidebar updates) significantly improve the feel of an application.

## Tomorrow
- Investigate Socket.IO reconnection after page refresh.
- Add search debounce.
- Review search feature edge cases.
- Optional: Better timestamp formatting and loading states.

# 2026-07-04

### Socket Reconnection
- Socket lifecycle should depend on authentication rather than the login action.
- Refresh destroys the existing socket, so reconnect after successful authentication.

### Debouncing
- Debounce the value that triggers the API, not the API itself.
- Implemented debounce using `useEffect`, `setTimeout`, and cleanup with `clearTimeout`.
- This prevents unnecessary requests while keeping the input responsive.

# Learning Log

## Biggest Technical Lessons

### 1. Localhost is not Production

Many issues only appeared after deployment.

Examples:

- Cookies
- CORS
- HTTPS
- Environment variables
- Build configuration

---

### 2. Debugging is a Process

Instead of guessing:

- Observe
- Form a hypothesis
- Test
- Verify
- Repeat

---

### 3. Socket.IO

Learned:

- Rooms
- Authentication middleware
- Connection lifecycle
- Event-based communication

---

### 4. Authentication

Learned:

- JWT
- HttpOnly cookies
- SameSite
- Secure cookies
- Protected routes

---

### 5. Deployment

Learned:

- Vercel
- Render
- Environment variables
- Production builds
- SPA routing
- Cloud debugging

---

## Personal Reflection

This was my first complete full-stack application deployed to the internet.

The project taught me much more than building features. Most of the learning came from debugging production issues and understanding how different parts of the stack interact.

# 2026-08-03

## What I Learned

### Trust the Database for Uniqueness

My initial idea was to check whether a message with the same `clientMessageId` already existed before inserting a new one. That approach would require an additional database query for every message sent.

I learned that this is not the most efficient design.

A better approach is to rely on the database's unique constraint:

* Attempt to insert the message immediately.
* If the insert succeeds, continue normally.
* If the database reports a unique constraint violation (`P2002`), fetch and return the existing message.

This optimizes for the common case because successful message sends only require the normal database operations, while the extra lookup is only performed when a retry actually occurs.

### Database Constraints Can Simplify Application Logic

Instead of implementing duplicate detection entirely in application code, the database can enforce uniqueness more reliably. The application only needs to handle the exceptional case, resulting in simpler logic and fewer unnecessary queries.

## Takeaway

A useful design principle I learned today is to optimize for the common execution path rather than the exceptional one. By allowing the database to enforce uniqueness and only handling duplicates when they actually occur, the implementation becomes both more efficient and more resilient to concurrent requests.



# 2026-08-08

### Topic: Reliable Message Delivery — Optimistic UI, Idempotency and Socket Reconciliation

Today I worked on the frontend reliability side of the chat application. The main learning was understanding how a message can exist in different states on the client and how the client reconciles those states with the server.

### 1. Optimistic UI

Instead of waiting for the server response before displaying a message, the client can display it immediately.

Flow:

User sends message
    ↓
Create temporary UI message
    ↓
status = sending
    ↓
Send request to server
    ↓
Server confirms through Socket.IO
    ↓
status = sent

This makes the application feel much faster because the UI does not wait for network latency.

### 2. Why clientMessageId is important

The database generates the normal message id, so the frontend does not know that id when it first creates the optimistic message.

Therefore we generate a clientMessageId on the frontend.

The clientMessageId acts as a stable identity for the message across:

- optimistic UI
- HTTP request
- database record
- Socket.IO event
- future retries

The important distinction is:

Database id:
- generated by the server/database
- represents the persisted database record

clientMessageId:
- generated by the client
- exists before the server creates the message
- allows the client to recognize its own message later

### 3. Socket.IO does not automatically solve message identity

Our server uses:

io.to(chatId).emit("new_message", message);

This broadcasts the message to everyone in the chat, including the sender.

Initially this caused:

optimistic message
    +
Socket.IO message
    =
duplicate message

The important lesson was that receiving the same logical message twice is possible even when the server only created it once.

The client therefore needs a way to recognize that the incoming Socket.IO message represents an existing local message.

clientMessageId provides that identity.

### 4. Upsert as reconciliation

Implemented an upsert-style operation:

If clientMessageId does not exist:
    insert the message

If clientMessageId already exists:
    update the existing message

This gives us:

optimistic message
    ↓
clientMessageId = X
    ↓
Socket.IO message arrives
    ↓
clientMessageId = X
    ↓
existing message found
    ↓
update instead of append

This prevents duplicate messages.

### 5. HTTP and Socket.IO have different responsibilities

I initially thought about confirmation through both the HTTP response and Socket.IO.

The current design separates their responsibilities:

HTTP request:
- sends the message to the backend
- tells the client if the request itself failed

Socket.IO:
- distributes the persisted message
- acts as the confirmation/reconciliation path for the sender
- delivers the message to other clients

Therefore a separate Socket.IO ACK mechanism is not necessary for this particular flow.

### 6. Message State Machine

A message on the frontend now has three important states:

sending
    ↓
sent

or

sending
    ↓
failed

This is useful because a message can no longer be treated as simply "present" or "absent".

The UI can represent what actually happened to the message.

### 7. Important debugging lesson

A major part of today's work was debugging rather than simply writing new code.

Several issues appeared while integrating the pieces:

- Type mismatch between Message and UIMessage.
- Optimistic messages not having a database id yet.
- Existing database messages having null clientMessageId before the backfill.
- React keys relying on database id.
- Socket.IO echo creating duplicate messages.
- Optimistic messages remaining stuck in "sending" after failures.
- Historical messages not having a UI status.
- State reconciliation between optimistic messages and server messages.

The important lesson is that adding a reliability feature often affects several existing layers at once:

Frontend types
    ↓
React state
    ↓
Optimistic UI
    ↓
HTTP
    ↓
Backend persistence
    ↓
Socket.IO
    ↓
Frontend reconciliation

A feature that looks small conceptually can expose assumptions that were previously hidden.

### 8. Current Understanding

The overall message lifecycle is now:

Client creates message
    ↓
clientMessageId generated
    ↓
Optimistic message displayed
    ↓
status = sending
    ↓
HTTP request
    ↓
Backend persists using clientMessageId
    ↓
Socket.IO broadcasts persisted message
    ↓
Frontend matches using clientMessageId
    ↓
Existing optimistic message is updated
    ↓
status = sent

If the request fails:

sending → failed

### Next Learning Topic

Retry and idempotency in practice.

The next step is to allow:

failed message
    ↓
retry
    ↓
same clientMessageId
    ↓
backend receives request again
    ↓
idempotency prevents duplicate creation
    ↓
message eventually becomes sent

# 2026-08-11

### 1. Retry is not inherently safe

I learned that simply retrying a failed network request can create duplicate operations.

A request can actually reach the backend and successfully modify the database while the response is lost before reaching the client.

For example:

```text
Client
  │
  │ send message
  ▼
Backend
  │
  │ message created successfully
  ▼
Database
  │
  X response lost
  │
Client thinks request failed
  │
  │ retry
  ▼
Backend
```

Without idempotency, the retry could create the same message twice.

Using a stable `clientMessageId` means the retry represents the **same logical operation**, rather than a new message.

Therefore:

> **Retry logic on the frontend depends on idempotency on the backend to be safe.**

---

### 2. Important lesson about Prisma transactions and error handling

While implementing the backend idempotency logic, I encountered an important bug in our previous implementation.

The initial approach placed the duplicate/idempotency handling inside the Prisma transaction:

```text
transaction
   │
   ├── create message
   │
   └── catch duplicate error
          ↓
       find existing message
```

The problem is that when the transaction fails, the transaction is **rolled back** and Prisma exits the transaction callback with an error.

The code inside the transaction does not continue executing as though the failed operation simply returned a normal result.

Therefore, our "find the existing message" logic needed to happen **outside the transaction**, in the outer `catch`.

The corrected conceptual flow is:

```text
try
   │
   └── transaction
          │
          └── create message
                 │
                 ├── success → return message
                 │
                 └── P2002
                        ↓
                    transaction fails
                        ↓
catch
   │
   └── detect P2002
          │
          └── query existing message
```

This was a valuable lesson because I initially thought of the transaction's `catch` as a normal place to recover from the failed create operation. Instead, the transaction boundary determines whether the code inside it can continue.

### General lesson

> **A transaction callback is not just a normal block of code with rollback added to it. Once the transaction fails, control leaves the transaction and the error must be handled at the appropriate outer boundary.**

This also helped me understand why error handling needs to respect the boundaries of database transactions rather than treating database errors like ordinary conditional branches.

---

### 3. State ownership and component responsibility

While implementing retry, I initially thought retry logic should live in `ChatArea` because normal message sending already happens there.

After examining the dependencies, I realized that retry does not depend on `ChatArea`'s local input state.

A new message needs:

* input text
* selected chat
* current user
* a newly generated `clientMessageId`

A retry already has everything it needs inside the existing `UIMessage`:

* `chatId`
* `content`
* `clientMessageId`

The message state itself is owned by `ChatPage`, so retry belongs there.

This reinforced an architectural principle:

> **A piece of logic should be placed according to the state and dependencies it actually needs, not simply because it resembles another operation.**

`MessageList` handles presentation and user interaction, `ChatArea` composes the chat UI, and `ChatPage` owns the message state and message-level operations.

---

### 4. Reusing existing reconciliation

For a successful retry, I did not manually change the message status to `sent`.

Instead, the existing Socket.IO `new_message` flow handles confirmation:

```text
retry
  ↓
sendMessage()
  ↓
backend
  ↓
new_message
  ↓
handleNewMessage()
  ↓
upsertMessage()
  ↓
sent
```

This avoids creating a second success/reconciliation path and keeps message confirmation centralized.

### Main takeaway

Today's work connected several concepts together:

**Optimistic UI + retries + idempotency + transactions + realtime reconciliation**

A reliable messaging system is not created by adding a Retry button. The frontend, backend, database, and realtime layer all have to cooperate so that an uncertain network outcome does not become a duplicate or inconsistent message.

# 2026-08-15 

## Chat App v2 — Reconnection & Message Synchronization

### React Closures & Stale State

- Learned that functions created inside a React render/effect can capture the state value from that particular render.
- Understood why the reconnect handler could see an old `messages` array instead of the latest one.
- Learned how `useRef` provides a persistent mutable reference that long-lived callbacks can read.
- Understood why adding `messages` to the dependency array would recreate the socket listener whenever messages change.

### React `useEffect`

- Improved understanding of how dependency arrays control when effects and their callbacks are recreated.
- Learned why socket listeners need careful lifecycle management.
- Understood the difference between:
  - Recreating a listener when state changes.
  - Keeping a stable listener while using a ref to access current state.

### Prisma Conditional Query Construction

Learned the Prisma conditional query pattern:

    after && {
        id: {
            gt: after
        }
    }

This conditionally adds the `id > after` filter only when an `after` cursor exists.

Conceptually:

    after exists
        ↓
    id > after

    after doesn't exist
        ↓
    no ID filter

This allowed the same message-fetching logic to support both:

    GET messages
        ↓
    Full message history

and:

    GET messages?after=150
        ↓
    Only messages where id > 150

### Cursor-Based Synchronization

- Learned what a cursor represents in a synchronization system.
- Understood why an auto-incrementing message ID is suitable as a cursor.
- Learned the difference between:
  - Fetching the entire conversation.
  - Fetching only the delta after the client's last known message.
- Understood how cursor synchronization reduces unnecessary data transfer during reconnects.

### End-to-End System Flow

Traced how the complete feature works across the application instead of treating each part independently:

    Network disconnect
          ↓
    Socket.IO reconnect
          ↓
    New socket handshake
          ↓
    JWT authentication
          ↓
    Room reconstruction
          ↓
    Frontend "connect" event
          ↓
    Fetch synchronization state
          ↓
    Determine cursor
          ↓
    Prisma query
          ↓
    Return missed messages
          ↓
    Update frontend state

### Debugging & Development

- Learned to distinguish application bugs from development-environment issues.
- Encountered stale HMR Socket.IO instances and learned that a hard refresh may be necessary before trusting contradictory socket behavior after modifying socket code.
- Learned to verify synchronization using the actual Network/API response instead of relying only on the UI.
- Reinforced the importance of checking autocomplete-generated field names, especially inside database queries where an incorrect field can silently produce plausible but incorrect results.

### Overall Takeaway

> A reliable real-time system is not just about keeping the socket connected. The database remains the source of truth, and reconnection requires a way for the client to determine what state it missed and synchronize that missing state.

# 2026-08-21

## Chat App v2 — File Uploads & Object Storage

### Presigned URLs

- Learned that a presigned URL is a cryptographically signed, time-limited permission slip for one specific operation — not a generic access token.
- Understood that constructing a `PutObjectCommand` does nothing on the network by itself; it's purely a description of an intended operation (bucket, key, content-type).
- Learned that `getSignedUrl()` takes that description and signs it locally using the backend's secret credentials, producing a URL the client can use without ever seeing the secret.
- Understood why the backend must be the one to mint this URL: it's the only party holding the credential, and it's the only place that can validate the request (auth, file type, size) before granting temporary permission.

### Presigned POST vs Presigned PUT

- Learned that presigned POST can carry policy conditions (e.g. `content-length-range`) enforced by the storage service itself, while presigned PUT cannot — whoever holds a PUT URL can send any size to it.
- Understood that this distinction only matters if enforcement needs to happen *at the signed-request level*; Supabase's bucket-level max-file-size setting moved that enforcement elsewhere, making PUT sufficient without reintroducing POST complexity.
- Learned to recognize when an apparent architectural inconsistency (switching POST → PUT) was actually already resolved by an earlier decision (switching storage providers), rather than an unnoticed mistake.

### S3-Compatible Services & Path-Style Addressing

- Learned that many services (Supabase, R2, MinIO) speak the S3 protocol without being AWS, and the same `@aws-sdk/client-s3` package works against any of them by changing only the endpoint/credentials.
- Learned about `forcePathStyle: true` — non-AWS S3-compatible services require path-style bucket addressing (`endpoint/bucket/key`) rather than AWS's default virtual-hosted style (`bucket.endpoint/key`), and omitting this flag is a very common, non-obvious failure point.

### Storage Identity vs Display Metadata

- Learned why the object's storage key (`objectKey`) and its human-facing filename (`fileName`) must be kept as separate fields — using user-controlled filenames as storage paths risks collisions, unsafe characters, and no real identity guarantee.
- Learned to derive a computed value (a public URL) from stored identity at read-time rather than storing the derived value itself — avoids a second source of truth that can silently go stale if the base URL or bucket ever changes.
- Applied the same derive-don't-store principle a second time, independently, for the sidebar's last-message preview text — recognized the pattern repeating rather than treating each case as new.

### Debugging Config Mismatches

- Diagnosed a `NoSuchBucket` error on reads despite successful writes — learned that this meant the read-path URL config (bucket name baked into the derived public URL) disagreed with the write-path config, even though both individually looked correct in isolation.
- Reinforced that two config values pointing at the same resource can silently diverge without either one looking obviously wrong on its own.

### React State Lifecycle for Async UI

- Learned to order async work deliberately: upload attachments fully *before* creating the optimistic UI message, so a "sending..." bubble never represents a file that turned out to fail uploading.
- Learned why `Promise.all` for independent uploads (not a sequential loop) is the correct choice — parallel uploads have no dependency on each other.
- Learned that error state shown in a UI needs an explicit clearing trigger (new attempt, new selection) — without one, a stale error can persist indefinitely after the underlying problem is already resolved.
- Learned a real browser quirk: a file `<input>` won't fire `onChange` again for an identical re-selection unless its value is manually reset — and separately, why using this quirk as an implicit "duplicate prevention" mechanism is the wrong tool, since it fails silently and doesn't actually reason about file content.

### Overall Takeaway

> Presigned URLs work by shifting *where* a decision gets made without changing *who* is trusted: the backend still holds every credential and makes every judgment call (is this allowed, how big, what type), it just hands the client a narrow, temporary, cryptographically-scoped permission instead of proxying the bytes itself. The recurring lesson across this feature — storage identity vs display name, computed URL vs stored URL, computed preview vs client-recomputed preview — was the same principle each time: derive from a single source of truth rather than storing or recomputing a value that could drift out of sync with it.

# 2026-08-27

## Chat App v2 — Read Receipts

### Server-Authoritative State

- Learned why "read up to message X" must be computed server-side from the DB (latest `Message.id` in the chat) rather than accepted as a client-supplied value in the request body — a client-trusted value opens the door to marking undelivered messages as read, or a stale client overwriting a more recent read state with an older one.
- Reinforced a pattern already seen elsewhere in this project (clientMessageId idempotency, presigned URL minting): the backend holds the source of truth and computes the canonical result; the client only signals *intent* ("I opened this chat"), never supplies the *result*.

### Reusing an Existing Broadcast Pattern

- Recognized that the read-receipt broadcast didn't need new infrastructure — it reused the exact same `io.to(chat_{chatId}).emit(...)` room-fanout pattern already built for `sendMessage`, since both participants are already members of that room.
- Learned to explicitly verify the room-name string matches across every emit site (`chat_${chatId}` vs `${chatId}`) rather than assuming consistency — a silent mismatch here would cause events to appear to work (no error) while never reaching the other client.

### Single-Marker vs Per-Message Read State

- Discovered two competing real-world conventions for rendering read state: a single "Seen" label under only the most recent read message (iMessage, Instagram DMs, Messenger) vs. a per-message status icon that updates individually on every message (WhatsApp, Telegram ticks).
- Learned that both conventions can be built on the exact same backend data model (`lastReadMessageId`) — the choice is a pure frontend rendering decision, not a schema or protocol difference.
- Iterated the frontend implementation twice: first version showed "Sent" under every past own message and "Seen" only on the latest — closer to WhatsApp's per-message idea but inconsistent with the chosen "Instagram-style" convention. Corrected by gating the status label entirely on being the newest own message in the conversation (blank for every message before it, one label only on the last).

### Frontend State Derivation Under Multiple Sources of Truth

- Hit a bug caused by two independent pieces of state (`selectedChat` and the `chats` array) both notionally representing "the current chat," but only one of them (`chats`) being updated by the read-receipt socket handler. Fixed by deriving a single "live" view of the selected chat from `chats` at render time, rather than trying to keep `selectedChat` itself in sync.
- Learned to trace a data field back to its actual origin before wiring a UI to it: an earlier plan assumed `participant1Id`/`participant2Id` would be available on the frontend's `Chat` object, but the real `getChats` response was already flattened to `otherUser` and never exposed those fields — required moving the "who is the other participant" resolution into the backend response itself instead of the frontend.

### Timestamp Display

- Learned to treat a raw ISO timestamp as a UX problem, not just a formatting one: showing full absolute timestamps is fine when the time is not self-evidently "today," but redundant and noisy for today's own messages — matched the convention where today's messages show time-only, older ones show date+time, and cross-year messages additionally show the year.

### Git Branch Hygiene

- Applied a merge-order lesson from the file-uploads branch situation to this feature's own branch lifecycle: bring divergent branches back in line (`main` → target branch) *before* starting new work on top, rather than discovering the gap mid-feature.
- Reinforced the practice of deleting a branch immediately once fully merged, both locally and on the remote, to keep the branch list meaningful.

### Overall Takeaway

> The read-receipt feature didn't introduce any genuinely new backend concept — it's the same "server computes canonical state, client only signals intent, broadcast via existing socket room" pattern already established by file uploads and message sending. The actual complexity was almost entirely on the frontend: figuring out which state derives from which source of truth, and matching a subtle, easy-to-get-wrong UX convention (single marker vs per-message) that looks simple once correct but is invisible until you compare it side-by-side with a reference app.

# 2026-08-29

## Chat App v2 — E2EE: Client Key Generation & Storage

Today was less about volume of code and more about actually understanding a new domain end-to-end — public-key cryptography concepts I'd only seen in reels before, then immediately hitting two real concurrency bugs that turned "concept learned" into "concept actually internalized."

---

### The Core Idea: How Two People Get the Same Secret Without Sending It

The thing that had to click before anything else made sense — Diffie-Hellman key exchange:

    Alice                                    Bob
    ─────                                    ───
    private_A, public_A                      private_B, public_B
    (generated locally, never shared)        (generated locally, never shared)

            public_A ───────────────────────►
            ◄─────────────────────── public_B

    Alice computes:                          Bob computes:
      shared = DH(private_A, public_B)         shared = DH(private_B, public_A)

      shared_A  ==  shared_B   (mathematically guaranteed, same value)

Only the *public* keys ever cross the network. Neither private key is ever transmitted, yet both sides land on the identical shared secret. This is the actual "magic" — everything else (AES-GCM, HKDF) is just plumbing around this one fact.

Learned specifically **why you don't stop here** and encrypt messages directly with this shared value: you run it through HKDF (a key-derivation function) to turn a raw DH output into a properly-shaped symmetric key, then use that key with AES-GCM — a fast, authenticated symmetric cipher — for the actual message content. Asymmetric crypto (X25519) sets up the secret; symmetric crypto (AES-GCM) does the heavy lifting on real data.

Also clicked: since both sides derive the *same* key, you only ever need **one** ciphertext per message — not one per recipient. This is different from PGP-style schemes where a sender encrypts a separate copy for every recipient's individual public key. Simpler mental model, simpler schema, direct consequence of DH being symmetric.

---

### Full Picture: Where Each Piece of Key Material Lives

This was the diagram that made the "what goes where" question stop being confusing:

    ┌─────────────────────────────┐         ┌─────────────────────────────┐
    │         Browser A            │         │           Server            │
    │                               │         │                              │
    │  IndexedDB (scoped by userId) │         │  Postgres                    │
    │  ├── X25519 private key 🔒    │         │  User                        │
    │  └── X25519 public key        │  PATCH  │  ├── id                      │
    │                               │ ──────► │  └── publicKey  ◄── (only    │
    │  (AES-GCM key: NEVER stored,  │         │                    this ever │
    │   derived fresh each time     │         │                    leaves    │
    │   it's needed via DH + HKDF)  │         │                    the       │
    │                               │         │                    browser)  │
    └─────────────────────────────┘         └─────────────────────────────┘

    Server's database contains, and will only ever contain:
      [x] public keys
      [x] ciphertext blobs (Message.content, Chat.lastMessage — as JSON {ciphertext, nonce, tag})

    Server's database will NEVER contain:
      [ ] private keys
      [ ] derived AES-GCM keys
      [ ] plaintext message content

Learned this is *why* E2EE is a real property and not just marketing — it's not policy ("we promise not to read your messages"), it's structural: the server literally never receives the information needed to decrypt anything.

---

### Extractability: A Free Hardening Step

Learned that `crypto.subtle.generateKey({ name: "X25519" }, extractable, ["deriveKey", "deriveBits"])` has a boolean flag that controls whether `exportKey()` can ever pull the raw key material out of the `CryptoKey` object later.

Initially set this to `true` out of habit (copied the shape from an unrelated ECDH example). Corrected to `false` once I understood: since the private key is only ever *used* (for `deriveBits`) and never *exported*, there's no reason to allow export at all. Setting it non-extractable means even a compromised/XSS'd page can call crypto operations *with* the key but can never exfiltrate the raw bytes over the network.

The part that surprised me: per the WebCrypto spec, **the public key stays exportable regardless of this flag** — it's only the private key's extractability that follows the parameter you pass. So this hardening is genuinely free: I still export the public key raw (to base64, to send to the server) exactly as before, while the private key gets strictly safer, for zero functional cost.

---

### Bug #1 — Scoping Identity to the Wrong Thing

**What happened:** first implementation stored the generated keypair in IndexedDB under a hardcoded literal record key: `db.put('keys', keys, 'keys')`. Worked fine for one account. Logged into a second account on the same browser to test — and it silently reused the first account's keypair. No error, no crash, just wrong.

    Browser IndexedDB, BEFORE fix:
    ┌───────────────────────────┐
    │  store: "keys"             │
    │  record key: "keys"  ◄──── single slot, shared by every account
    │  value: { userA's keypair }│
    └───────────────────────────┘

    User A logs in → checks slot "keys" → empty → generates → stores
    User B logs in → checks slot "keys" → NOT empty (it's User A's!) → skips generation
                                                                          [BUG] User B now
                                                                             "has" User A's
                                                                             private key

**Root cause, in plain words:** I was scoping storage by *browser*, when what actually needed scoping was *identity*. A browser can hold multiple logged-in accounts across sessions; each one needs its own slot.

**Fix:** use `userId` as the actual record key instead of a constant string:

    Browser IndexedDB, AFTER fix:
    ┌───────────────────────────┐
    │  store: "keys"             │
    │  record key: "user-A"  →  { userA's keypair }
    │  record key: "user-B"  →  { userB's keypair }
    └───────────────────────────┘

**The generalizable lesson:** any time client-side state is meant to represent "this specific user's identity or data," ask explicitly what it's keyed by — the same discipline server-side session/auth code already has to follow, but easy to forget applies just as much to browser storage.

---

### Bug #2 — A Race Condition That React Deliberately Exposed

**What happened:** even after fixing the scoping bug, testing the same account still occasionally produced a mismatch — the public key stored in IndexedDB didn't match the one stored in Postgres for the same user.

**Why:** React 18's `<StrictMode>` intentionally double-invokes effects in development — mount, run effect, unmount, remount, run effect again — specifically to catch code that silently assumes "this only runs once." My `useEffect(() => { ensureKeyPairExists(userId) }, [])` got called twice, back to back, before either call finished writing to IndexedDB:

    Time ──────────────────────────────────────────────────────►

    Call 1: read IndexedDB (empty) ─── generate keypair_1 ─── write IndexedDB ─── PATCH keypair_1 to server
    Call 2:   read IndexedDB (empty) ─── generate keypair_2 ─── write IndexedDB ─── PATCH keypair_2 to server
                    ▲
                    Both calls saw "empty" because neither had
                    finished writing yet — the check-then-act
                    sequence isn't atomic.

    Final state depends purely on which write/PATCH lands LAST:
      IndexedDB  → whichever db.put() finished last
      Postgres   → whichever PATCH response resolved last
      These two "lasts" aren't guaranteed to be the same call → mismatch.

**The key realization:** this isn't a React quirk to silence — StrictMode's double-invoke exists *specifically* to surface exactly this class of bug in a safe dev environment, instead of it waiting to appear in production under real-world timing (two tabs open, slow network, multiple rapid calls). It's a bug I'd introduced the moment I wrote a "check, then generate, then write" function without protecting it against concurrent execution — StrictMode just gave me a deterministic, free way to catch it immediately.

**Fix — the standard "dedupe concurrent async calls" pattern, applied per-identity:**

    inFlightMap: Map<userId, Promise<Keys>>

    ensureKeyPairExists(userId):
        if inFlightMap has no entry for userId:
            start the real work, store its PROMISE (not its result) in the map
        return inFlightMap.get(userId)   <- second caller gets the SAME promise,
                                             awaits the same execution instead of
                                             starting a second one
        (on completion, remove the entry so a later, genuinely separate
         call can run fresh)

This pattern is worth remembering beyond this feature — it's the fix shape for anything that must not run concurrently with itself: duplicate form submissions, double-fetch on remount, any "only once" assumption that React (or just real-world timing) doesn't actually guarantee.

---

### Smaller Fix Along the Way

Caught during self-review before it caused a symptom: the public-key `PATCH` to the server was firing on *every* mount, not just after a fresh key was generated — wasteful, and sloppy enough that it could've masked the real bugs above if left in. Moved it inside the "key was just generated" branch so it only fires exactly once per identity, ever (barring storage loss).

---

### Overall Takeaway

> The cryptography itself (X25519, AES-GCM, HKDF) turned out to be conceptually straightforward once the DH diagram clicked — Web Crypto does the actual math, I just need to call it correctly. The real engineering difficulty today was entirely about *scope and concurrency*: state that should have been scoped per-identity was scoped globally (per-browser, per-process), and neither bug produced an error — both failed silently, and both were only catchable by deliberately testing the exact scenario (two accounts, concurrent invocation) designed to expose them. That's a pattern I want to carry forward: for any "check if X exists, then create X" function, explicitly ask "what happens if this runs twice, concurrently, for two different identities" before considering it done.

# 2026-09-03

## Chat App v2 — E2EE: Key Exchange & Derivation

Today picked up right where key generation left off: two clients that each have their own keypair now need to agree on a *shared* one, without ever transmitting it. Less new conceptual ground than last session, but the WebCrypto API turned out to be far less forgiving than expected — four real bugs, each a different flavor, each silent or cryptically-worded until hit at runtime.

---

### Why Three Steps, Not One

The part that needed unpacking before writing any code: going from "I have their public key" to "I have a usable AES key" isn't a single API call, it's three, and each one is solving a genuinely different problem:

    1. deriveBits (X25519)       →  raw shared secret (math only — DH output,
                                     NOT uniformly random, unsafe to use directly)
    2. importKey (as HKDF input) →  pure WebCrypto plumbing — wraps raw bytes
                                     as a CryptoKey because deriveKey requires one
    3. deriveKey (HKDF)          →  the actual whitening step — turns the biased
                                     DH output into a proper, uniform AES-GCM key

Skipping step 3 and using the raw DH output directly as an AES key is a known real-world mistake — several protocols have been broken this way. Step 2 has zero cryptographic purpose; it exists purely because the WebCrypto spec requires KDF inputs to be `CryptoKey` objects. Understanding *why* each step exists made the later API errors much easier to diagnose instead of guessing.

---

### Endpoint: The Auth Check That Almost Didn't Happen

First draft of `GET /chats/:chatId/public-key` computed "the other participant's key" with a ternary — `participant1Id === userId ? participant2.publicKey : participant1.publicKey` — without ever checking that `userId` was a participant *at all*. A stranger could pass any `chatId` and silently fall into the `else` branch, getting back someone's public key for a conversation they were never part of. Caught this before writing the route handler, not after — worth noting since it's the kind of bug that doesn't crash, doesn't error, just quietly leaks the wrong thing to the wrong person.

Also collapsed two genuinely different `null` cases into one 404 response initially: "chat doesn't exist" and "chat exists, other user just hasn't generated a key yet" are not the same situation, and conflating them would have made the frontend treat a totally normal, temporary state as a hard error.

---

### Four Bugs, Four Different Layers

**1. Prisma field casing.** Schema had `PublicKey` (capital P) — the one field in an otherwise consistently camelCase schema — while the service code queried `publicKey` (lowercase). Prisma treats field names as case-sensitive, so this wasn't "wrong data," it was "field doesn't exist," thrown as an unhandled 500 with zero server-side logging to explain why. Renamed the schema field instead of patching around it, since it was the actual inconsistency.

**2. Axios response unwrapping.** `api.get(...)` resolves to the full Axios response object (`{ data, status, headers, ... }`), not the JSON body. The helper function's return type (`Promise<{ publicKey: string | null }>`) was accurate to intent but not to runtime reality — TypeScript happily compiled a destructure that pulled `undefined` at runtime. Same category of trap as a bug from last session: something that looks structurally correct and produces no error, just silently wrong data.

**3. HKDF's `extractable` rule.** WebCrypto enforces that the *intermediate* key imported for HKDF must be non-extractable — no exceptions, spec-level rule, not a project decision. This threw `KDF keys must set extractable=false`, and the fix required distinguishing between two different keys in the same function: the HKDF import key (must stay `false`, always) versus the final derived AES-GCM key (temporarily `true`, only for this session's verification step, back to `false` before anything real depends on it).

**4. Missing `hash` parameter.** `HkdfParams` requires an explicit hash algorithm (`SHA-256`) — WebCrypto doesn't default one for HKDF the way some other algorithms default parameters. Omitting it isn't a silent wrong answer, at least — it throws immediately, which made this the fastest of the four to fix.

---

### Verifying Agreement, Not Just Absence of Errors

Getting past all four errors doesn't prove the keys actually match — a bug in the *content* of the derivation (wrong public key fetched, salt mismatch between the two sides) would also compile and run without throwing. So the actual test: temporarily flip the derived AES key's `extractable` to `true`, export it raw, hash it with SHA-256, and compare the hex output logged from two independent browser sessions (two different accounts, same chat).

    Browser A: chat 10 key hash: 0589ed1f23776013eff4b56c952bdda0ac2ccf6c4a409484eebf7453cfe567d6
    Browser B: chat 10 key hash: 0589ed1f23776013eff4b56c952bdda0ac2ccf6c4a409484eebf7453cfe567d6

Identical. This is the one property that matters most in this whole feature — if it's wrong, nothing downstream can ever work, silently, forever. Confirming it *before* touching message encrypt/decrypt means any future decrypt failure can be isolated to the encryption logic itself, not re-litigated back to "wait, do the keys even match."

One near-miss caught before it became a fifth bug: an earlier draft of the HKDF salt used `crypto.getRandomValues()` independently on each side — which would have produced two *different* derived keys from the identical shared secret, since HKDF's output depends on the salt. Fixed to an empty/fixed salt (correct per HKDF's spec — security comes from the input keying material, not the salt) before it ever got tested, so it never actually surfaced as a runtime mismatch.

---

### Overall Takeaway

> Today made a distinction worth remembering: some bugs throw and some don't, and the ones that don't are the dangerous ones. The Prisma casing issue and the Axios `.data` issue both compiled cleanly and only revealed themselves as `undefined`/500 at runtime with no direct pointer to the cause — versus the two WebCrypto param errors, which at least threw immediately with a specific message. Cross-checking API call shapes against actual spec requirements (not just "does the logic look right") would have caught the WebCrypto ones earlier; the casing and unwrapping ones needed the kind of "did I verify this round-trips correctly" testing that doesn't come from reading code alone. Confirming key agreement via independent hash comparison — rather than assuming it's correct because nothing threw — is the same discipline as last session's "explicitly test the two-account/concurrent scenario instead of trusting the happy path."

# 2026-09-05

## Chat App v2 - E2EE: Encryption & Decryption of text 

## AES-GCM nonce size
Web Crypto's `crypto.getRandomValues(new Uint8Array(N))` takes a byte count,
not a bit count. Wrote `new Uint8Array(96)` intending a 96-*bit* IV (the
standard AES-GCM nonce size) and actually got a 96-*byte* (768-bit) IV.
Web Crypto doesn't hard-reject non-standard IV lengths for AES-GCM, so this
would have run without erroring — just silently outside the well-analyzed
parameter range the algorithm is designed around. Correct: `new
Uint8Array(12)` (12 bytes = 96 bits).

Takeaway: when a crypto API takes a byte array sized for a "bit length"
value, always convert explicitly (bits / 8) rather than eyeballing it — the
API won't catch the mistake for you.

## Refs vs state vs module-level caches
Spent a while confused about whether "ref" meant the React `ref` prop
(DOM/imperative-handle attachment) or a ref *object* (`useRef`'s `.current`
container). They're unrelated concepts that share a name. A ref object is
just a mutable box — passable as a normal prop, readable/writable anywhere,
and importantly *silent*: writing to `.current` doesn't trigger a re-render.

This makes refs the right tool for a cache that many places need to read
imperatively (encrypt-on-send, decrypt-on-render, decrypt-on-socket-event)
but that nothing needs to *react* to changing. If something does need to
react to the cache changing (e.g. disabling a send button until a key is
ready), that needs real state layered on top, kept separate from the cache
itself.

## Why `encryptionVersion`/`encryptedVersion` exists at all
Not part of the crypto operation — it's wire/storage metadata. Needed
because:
- Old messages in the DB predate encryption entirely and are plain strings —
  without a marker, there's no way to tell "decrypt this" from "this is
  already plaintext, don't touch it."
- Future-proofing: if the encryption scheme ever changes, a version *number*
  (not a boolean) lets old messages keep decrypting under their original
  scheme forever while new messages use a new one — a boolean can't
  distinguish two different encrypted formats from each other.

## The specific bug class that ate the most time today: name/order agreement across a boundary
Two separate bugs today were both instances of the same underlying mistake —
frontend and backend (or caller and callee) silently disagreeing about the
*shape* of data crossing a boundary, with nothing forcing them to agree:
1. Field name mismatch (`encryptionVersion` vs `encryptedVersion`) across the
   HTTP request/response boundary — no compiler check catches this because
   JSON bodies aren't type-checked across a network call the way in-process
   function calls are.
2. Positional argument order mismatch between a function's definition and a
   call site (`attachments`/`encryptedVersion` swapped) — TypeScript *should*
   catch this if the types of the two swapped parameters actually differ
   (array vs number), which is a reminder to check why it didn't surface as
   a compile error immediately, rather than assume the type-check is
   airtight just because the language is typed.

General lesson: anywhere data crosses a boundary that isn't enforced by the
compiler (HTTP JSON bodies, anything typed loosely as `any`/`Request` further
upstream), treat field-name/order agreement as something to verify by
tracing an actual value through both sides, not something types alone
guarantee.

## Effects re-running on data that "looks the same"
`setChats(response.data)` creates a *new array reference* every time it
runs, even if the actual chat list contents are identical to before. Any
`useEffect` depending on `chats` re-fires on every such call — including
calls from unrelated code paths (socket reconnect, accepting a friend
request) that happen to also refresh the same state. This is why a
same-looking cache guard can still race: the effect body can start running
again before an in-flight async operation from the *previous* run has
finished, if the guard is only checked synchronously at the top and not
updated until the operation completes.

## Debugging approach that worked today
Traced one value (`encryptedVersion` / message content) through its entire
lifecycle end to end — frontend send → HTTP body → controller → service →
DB write → DB read → HTTP response → frontend decrypt — rather than
assuming any one layer was correct because it "looked right" in isolation.
Both real bugs today were only found this way; neither was visible from
reading any single file on its own.

# 2026-09-20

## Scaling a realtime backend: multiple instances, Redis, Nginx, DB connection pooling

## 1. Why database connections are the real scaling limit

- Each Postgres connection is a separate OS process on the server, so
  Postgres enforces a hard `max_connections`.
- Adding backend containers is easy; the database is the part that does not
  scale out by adding more copies. Every new instance multiplies the
  connections hitting it.
- Neon's free compute allows about 100 usable connections (7 are reserved
  for the superuser).
- Failure mode: at some instance count you hit "too many connections" and
  every instance fails at once.

## 2. Prisma pool sizing

- Default pool per Prisma client: `num_cpus * 2 + 1` connections.
- Docker Desktop on Windows usually exposes all logical CPUs to
  containers, so 3 instances on a 16-thread machine could mean ~99
  connections, right at the limit.
- `connection_limit=N` in the URL caps it explicitly, independent of CPU count.

## 3. Pooled vs direct connections (PgBouncer)

- Neon's pooled endpoint is the same database with `-pooler` added to the
  endpoint hostname. It routes through PgBouncer, which multiplexes many
  client connections onto fewer real Postgres connections.
- PgBouncer in **transaction mode** does not support session-level state
  (`SET`, `LISTEN/NOTIFY`, temp tables, session advisory locks). That is why
  migrations use a separate `DIRECT_URL`.
- `pgbouncer=true` tells Prisma to avoid patterns that break under
  transaction pooling (prepared statement handling).
- Rule: app traffic goes through the pooler, migrations and admin tasks go
  direct.
- What this proves: a predictable, bounded DB footprint (13 connections
  measured). It does not prove speed or load survival. That needs a load
  test.

## 4. Socket.IO across multiple instances

- Rooms and socket state live in each process's memory. Without help, a
  message emitted on instance A never reaches a user connected to instance B.
- The Redis adapter fixes this with pub/sub: emits are published to Redis
  and every instance forwards them to its own local sockets. Existing
  `io.to(room).emit(...)` code works unchanged.
- Redis is used for pub/sub only here, so no persistence is needed.

## 5. Sticky sessions vs WebSocket-only transport

- Socket.IO's default starts with HTTP long-polling, and the handshake spans
  several requests. Under round-robin without sticky sessions, those
  requests hit different instances, producing intermittent 400 errors.
- Forcing `transports: ["websocket"]` on the client means a single
  long-lived connection, so no stickiness is needed.

## 6. Nginx as a WebSocket-aware load balancer

- Needs `proxy_http_version 1.1` and the `Upgrade` / `Connection` headers
  forwarded, or WebSocket upgrades fail.
- A `map` on `$http_upgrade` sets `Connection: upgrade` only for upgrade
  requests.
- `proxy_read_timeout` defaults to 60s and would kill idle sockets, so it is
  raised.
- An `upstream` block with service names works because Docker Compose gives
  containers DNS names on the shared network.

## 7. Docker and Compose details

- `npm ci` layer caching: if `package.json` and the lockfile did not change,
  the install step is cached. Adding an import without installing the
  package fails at `tsc`, not at install.
- `npm ci` requires the lockfile to match `package.json`, so commit lockfile
  changes.
- YAML anchors (`x-backend: &backend` + `<<: *backend`) avoid repeating
  service config.
- `env_file` loads variables from a file; `environment:` entries override it.
- `healthcheck` + `depends_on: condition: service_healthy` makes backends wait
  for Redis to be ready.
- Containers on this machine could not resolve the Neon hostname without
  `dns: 8.8.8.8`. Root cause still not investigated (open question).

## 8. How to verify distributed behavior

- Log an `INSTANCE_ID` on socket connect so you can see which instance handled
  each user.
- `redis-cli pubsub channels` shows `socket.io#...` channels when the
  adapter is live.
- A test that can fail: remove the adapter and confirm cross-instance
  messages stop arriving. If they still arrive, both users were on the same
  instance and the test proved nothing.
- Failover: stopping one backend while users are connected should trigger
  client reconnection to another instance.

## 9. Engineering judgement

- A config change is a design decision, not a result, until you measure it.
  Do not present "used a pooler" as an outcome without a before/after
  number.
- Only claim features that exist in the repo. Unbuilt items go under
  "known limitations".

## Open questions

- Why containers fail to resolve the Neon hostname without a custom DNS.
- Actual behavior under load (not measured yet).