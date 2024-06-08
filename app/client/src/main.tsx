import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom";
import Router from "./Router.tsx"
import "./global.css"

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { io } from "socket.io-client";

export const socket = io (import.meta.env.VITE_SERVER_ORIGIN);
socket.on("connect", () => {
	console.log(`${socket.id} connected to server`);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
	// <React.StrictMode>
		<BrowserRouter>
			<Router />
		</BrowserRouter>
	// {/* </React.StrictMode> */}
);