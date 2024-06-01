import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.tsx";

import Home from "./pages/Home.tsx";
import Profile from "./pages/Profile.tsx";
import Groups from "./pages/Groups.tsx";

export default function Router() {
	return (
		<>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/groups" element={<Groups />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="*" element={<div>404, not found</div>} />
			</Routes>
		</>
	);
};