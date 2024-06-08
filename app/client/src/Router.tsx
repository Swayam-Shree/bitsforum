// import { auth } from "./firebase.ts";

import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.tsx";

import Home from "./pages/Home.tsx";
import Profile from "./pages/Profile.tsx";
import Groups from "./pages/Groups.tsx";
import GroupView from "./pages/GroupView.tsx";

export default function Router() {
	return (
		<>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/groups" element={<Groups />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/group/:id" element={<GroupView />} />
				<Route path="*" element={<div>404, not found</div>} />
			</Routes>
		</>
	);
};