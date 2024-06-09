# Client

## ENV
-  Put in a .env file in the client root
-  Set `VITE_SERVER_ORIGIN` variable to your server's origin

## Hosting the client
- set up the environment variable
- run
  ```
  npm i
  npm run build
  ```
- find the built project in `./dist` relative to client root and host that

## Running locally
- set up the environment variable to `http://localhost:6969` which is the server's default origin
- run
  ```
  npm i
  npm run dev
  ```
- client runs on `localhost:5173`