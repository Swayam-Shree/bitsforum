# Server

## ENV
- 7 environment variable need to be set. Get a sample .env from https://drive.google.com/file/d/1ItSGTOEEpFVzS4Ld6mB9vng3TeEbXus0/view?usp=sharing
- `MONGO_URL` is for a mongodb uri. `REDIS_CLIENT_PASSWORD` is for redis password.
- `EMAIL` `REFRESH_TOKEN` `CLIENT_SECRET` `CLIENT_ID` are for google oauth credentials of an email address from which you want to send emails to the users.
- `EXTRA_ORIGIN` is for an additional origin for cors that you may want to put in while hosting. Origin for `localhost:5173` (default vite dev) and two vercel origins are already configured in `./server.ts` in the variable `origins`.
 
## Hosting the server via Docker
- Pull the image via `docker pull swayamshreesharma/bitsforum:latest`
- Set up the environment variables before running the container.
- port 6969 is exposed in the image.
  
## Hosting the server via Node.js
- Find the list `origins` in `./server.ts` and add in your the origin where your client is hosted at. This is useful if more than one origin is to be added.
- Set up the other environment variables and save in .env root, beside this README.
- run the following
  ```
  npm i
  npm run build
  npm run start
  ```
- default port is 6969. can be changed by adding in the environment variable `PORT`

## Hosting the server locally
- clone and put in the sample env from above in the server root and rename it to .env
- for production server, run
  ```
  npm i
  npm run build
  npm run start
  ```
- for dev server, run
  ```
  npm i
  npm run dev
  ```
- server runs on port 6969, and has the origin for `localhost:5173` (default vite dev) set up

## Once the server the started in either of the cases, it logs in the console the following within few seconds, post which its ready to listen to client.
- socket initialized
- app listening on port 6969
- email transporter ready
- connected to mongo and redis
- redis cache updated