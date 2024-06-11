# BITSForum

### https://bitsforum.vercel.app

## About
Forum for BITSians. Stay up to date with the latest news and updates from around the campus.

## Features
- Groups: add and delete groups
- Posts: with markup, attachments and commenting permissions and are cached and lazy loaded
- Comments: with markup and are cached and lazy loaded
- Users: admins and members
- User management: Add, remove and make admin
- Updates: for new posts and comments, get notifications if use is online or emails if user is offline

## Structure
Server and Client have separate folders within app. Find their individual README's in their respective root directories to configure them separately. Both are separate entities.

## Want to contribute?
### Backend
- Express.js for REST
- Socker.io for realtime notifications
- MongoDB as main database
- Redis with RedisOM for caching
- Nodemailer and googleapi for emails

The database connections, schemas and initial cache load code is in `@server/src/db/connection.ts`
To get the jist of relations between documents in the mongo database, go through the schemas in the above mentioned file and the type definitions in `@client/src/types.ts` There are 4 main collection, `users` `groups` `posts` `comments`. groups, posts and comments follow a heirarchy of `groups > posts > comments`. Things below the ladder only have reference to things above it. For example, a group doesn't have reference to all posts it contains, but each post of that group has a reference to it.
Rest of the server code with the rest and socket calls are in `@server/src/server.ts`

### Frontend
- Vite react app
- most of the directory and file names are self explainatory
- webmanifest config is in vite config
