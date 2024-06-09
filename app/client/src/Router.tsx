import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.tsx";

import Home from "./pages/Home.tsx";
import Profile from "./pages/Profile.tsx";
import Groups from "./pages/Groups.tsx";
import GroupView from "./pages/GroupView.tsx";

import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

export default function Router() {
	const [user, loading, error] = useAuthState(auth);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error</div>;

	if (user && !user?.email?.endsWith("bits-pilani.ac.in")) {
		setTimeout(async () => {
			await signOut(auth);
		}, 10000);
		return (<div className="flex flex-col items-center m-[32px]">
			<CircularProgress />
			<Typography variant="h5">Please sign in with your BITS mail. You are beging redirected in 10 seconds. If you have only logged in with one gmail account on this browser, login with your BITS mail in Gmail then login here.</Typography>
		</div>);
	}

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