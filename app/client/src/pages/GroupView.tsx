import { auth } from "../firebase";

import { useParams, useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

import type { Group } from "../types";

import ManageUserTile from "../components/ManageUserTile";

import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function GroupView() {
	const { id } = useParams();

	const [manageUserModal, setManageUserModal] = useState(false);

	const emailDefault = "f20XXXXXX@<campus>.bits-pilani.ac.in";
	const [userEmail, setUserEmail] = useState(emailDefault);
	const [userEmailError, setUserEmailError] = useState(false);
	const [userEmailErrorText, setUserEmailErrorText] = useState("");

	const [groupDetails, setGroupDetails] = useState<Group>();

	const navigate = useNavigate();

	useEffect(() => {
		async function fetchGroup() {
			const result = await fetch(`http://localhost:6969/getGroup/${id}`);
			const group = await result.json();

			setGroupDetails(group);
		}

		fetchGroup();
	}, []);

	async function checkUserValidity() {
		const result = await fetch(`http://localhost:6969/getGroup/${id}`);
		const group = await result.json();

		setGroupDetails(structuredClone(group));

		if (!group.allMembers.includes(auth.currentUser?.uid || "")) {
			navigate("/profile");
			alert("Action incomplete. You have been removed from the group");
			return false;
		}
		
		return true;
	}

	async function handleAddUser() {
		const result = await fetch(`http://localhost:6969/addUser`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				groupId: id,
				requester: auth.currentUser?.uid,
				email: userEmail
			})
		});

		if (result.status === 403) {
			navigate("/profile");
			alert(await result.text());
		} else if (result.status === 404) {
			setUserEmailError(true);
			setUserEmailErrorText("User not found");
		} else if (result.status === 400) {
			setUserEmailError(true);
			setUserEmailErrorText("User is already in current group");
		} else if (result.status === 200) {
			groupDetails?.allMembers.push(await result.text());
			setGroupDetails(structuredClone(groupDetails));

			setUserEmailError(false);
			setUserEmail(emailDefault);
			setUserEmailErrorText("");
		}
	}

	async function handleManageUser() {
		if (!await checkUserValidity()) return;

		setUserEmail(emailDefault);
		setUserEmailError(false);
		setUserEmailErrorText("");
		setManageUserModal(true);
	}

	function updateGroupDetails(group: Group) {
		setGroupDetails(structuredClone(group));
	}

	return (<div>
		<div className="flex flex-col items-center gap-[20px] m-[20px] p-[20px] border-solid border-[1px] rounded border-violet-800">
			<Typography variant="h4">{groupDetails?.groupName}</Typography>
			<Typography variant="h6">{groupDetails?.groupDesc}</Typography>

			{
				groupDetails?.admins.includes(auth.currentUser?.uid || "") ? (
					<Button onClick={ handleManageUser } variant="outlined">Manage Users</Button>
				): (
					<Button onClick={ handleManageUser } variant="outlined">View Users</Button>
				)
			}

			<Modal
				open={manageUserModal}
				onClose={ () => setManageUserModal(false) }
			>	
				<div className="flex flex-col bg-white m-[32px] p-[32px] min-w-[300px] gap-[12px]">
					<Button color="error" onClick={ () => setManageUserModal(false) } variant="contained">Close</Button>

					{
						groupDetails?.admins.includes(auth.currentUser?.uid || "") && <div className="flex flex-col gap-[12px]">
							<Typography variant="h5">Add Members</Typography>
							<TextField
								value={userEmail}
								onChange={ (e) => setUserEmail(e.target.value) }
								error={userEmailError}
								label="Enter full user email"
								variant="outlined"
								helperText={userEmailErrorText}
							/>
							<Button onClick={ handleAddUser } size="small" variant="contained">Add User</Button>
						</div>
					}

					<Typography sx={{mt: 4}} variant="h5">Members:</Typography>

					<div>
						{
							groupDetails?.allMembers.map((uid) => {
								return (<ManageUserTile
									key={uid}
									uid={uid}
									groupId={id || ""}
									isAdmin={groupDetails.admins.includes(uid)}
									amAdmin={groupDetails.admins.includes(auth.currentUser?.uid || "")}
									updateGroup={updateGroupDetails}
									group={groupDetails}
								/>);
							})
						}
					</div>
				</div>
			</Modal>
		</div>
	</div>);
}