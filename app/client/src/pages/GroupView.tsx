import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../firebase";

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { InView } from "react-intersection-observer";

import type { Group, Post, PostFile } from "../types";

import ManageUserTile from "../components/ManageUserTile";
import PostDisplay from "../components/PostDisplay";

import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LinearProgress from '@mui/material/LinearProgress';

import AttachFileIcon from '@mui/icons-material/AttachFile';

export default function GroupView() {
	const { id } = useParams();

	const [manageUserModal, setManageUserModal] = useState(false);
	const [postModal, setPostModal] = useState(false);

	const emailDefault = "f20XXXXXX@<campus>.bits-pilani.ac.in";
	const [userEmail, setUserEmail] = useState(emailDefault);
	const [userEmailError, setUserEmailError] = useState(false);
	const [userEmailErrorText, setUserEmailErrorText] = useState("");

	const [groupDetails, setGroupDetails] = useState<Group>();

	const [postTitle, setPostTitle] = useState("");
	const [postTitleError, setPostTitleError] = useState(false);
	const [postContent, setPostContent] = useState("");
	const [postContentError, setPostContentError] = useState(false);
	const [postFiles, setPostFiles] = useState<File[]>([]);

	const [uploading, setUploading] = useState(false);

	const [posts, setPosts] = useState<Post[]>([]);

	const navigate = useNavigate();

	useEffect(() => {
		(async function loadData() {
			let result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/getGroup/${id}`);
			const group = await result.json();
			setGroupDetails(group);

			result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/getPosts/${id}-${posts.length}`);
			const p = await result.json();
			p.sort((a: Post, b: Post) => {
				return a._id > b._id ? -1 : 1;
			});
			setPosts(p);
		})();
	}, []);

	async function checkUserValidity() {
		const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/getGroup/${id}`);
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
		const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `:6969/addUser`, {
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

	async function handleAddPost() {
		if (!await checkUserValidity()) return;

		setPostModal(true);
	}
	async function handleCreatePost() {
		if (uploading) return;
		if (!await checkUserValidity()) return;

		setPostTitleError(!postTitle);
		setPostContentError(!postContent);

		if (!postTitle || !postContent) return;

		setUploading(true);

		let files: PostFile[] = [];

		for (let i = 0; i < postFiles.length; ++i) {
			const file = postFiles[i];
			const storageRef = ref(storage, `${id}${file.name}`);
			await uploadBytes(storageRef, file);
			files.push({
				name: file.name,
				url: await getDownloadURL(storageRef)
			});
		}

		let tmpPost = {
			groupId: id,
			uid: auth.currentUser?.uid,
			name: auth.currentUser?.displayName,
			title: postTitle,
			content: postContent,
			files: files,
			commentAccess: 0 // default allow all users
		}

		const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + "/createPost", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(tmpPost)
		});

		setUploading(false);
		if (result.status === 403) {
			navigate("/profile");
			alert(await result.text());
			return;
		} else if (result.status === 200) {
			let finalPost = {
				...tmpPost,
				_id: JSON.parse(await result.text()).insertedId
			} as Post;

			setPosts([finalPost, ...posts]);
			// posts.unshift(finalPost)
			// setPosts(posts);

			setPostTitle("");
			setPostContent("");
			setPostFiles([]);
			setPostModal(false);
		}
	}

	function updateGroupDetails(group: Group) {
		setGroupDetails(structuredClone(group));
	}
	function deletePost(postId: string) {
		setPosts(posts.filter((post) => post._id !== postId));
	}

	return (<div>
		<div className="flex flex-col items-center gap-[20px] m-[20px] p-[20px] border-solid border-[1px] rounded border-violet-800">
			<Typography variant="h4">{groupDetails?.groupName}</Typography>
			<Typography variant="h6">{groupDetails?.groupDesc}</Typography>

			{
				groupDetails?.admins.includes(auth.currentUser?.uid || "") ? ( <div className="flex justify-around gap-[32px]">
					<Button onClick={ handleManageUser } color="secondary" variant="contained">Manage Users</Button>
					<Button onClick={ handleAddPost } color="success" variant="contained">Add Post</Button>
				</div> ): (
					<Button onClick={ handleManageUser } variant="outlined">View Users</Button>
				)
			}

			<Modal
				open={manageUserModal}
				onClose={ () => setManageUserModal(false) }
			>	
				<div className="flex flex-col bg-white m-[32px] p-[32px] min-w-[300px] gap-[12px]">
					<Button onClick={ () => setManageUserModal(false) } color="error" variant="contained">Close</Button>

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
								size="small"
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

			<Modal
				open={postModal}
				onClose={ () => setPostModal(false) }
			>
				<div className="flex flex-col bg-white m-[32px] p-[32px] min-w-[300px] gap-[12px]">
					<Button color="error" onClick={ () => setPostModal(false) } variant="contained">Close</Button>
					<Button onClick={ () => { setPostTitle(""); setPostContent(""); setPostFiles([]); } } color="error" variant="outlined">Clear</Button>

					<Typography variant="h5">Add Post</Typography>
					<TextField
						value={postTitle}
						onChange={ (e) => setPostTitle(e.target.value) }
						label="Title"
						variant="outlined"
						size="small"
						inputProps={{ maxLength: 128 }}
						error={postTitleError}
					/>
					<TextField
						value={postContent}
						onChange={ (e) => setPostContent(e.target.value) }
						label="Content"
						variant="outlined"
						multiline
						rows={4}
						size="small"
						inputProps={{ maxLength: 2048 }}
						error={postContentError}
					/>
					<div className="flex flex-col">
						{
							postFiles?.map( file => (<Typography key={file.name} variant="caption">
								{"-" + file.name}
							</Typography>))
						}
					</div>
					<Button component="label" variant="outlined" startIcon={<AttachFileIcon />}>
						Add Files
							<input onChange={ (e) => setPostFiles(postFiles?.concat(Array.from(e?.target?.files || []))) } type="file" hidden multiple />
					</Button>
					{
						uploading && <LinearProgress />
					}
					<Button onClick={ handleCreatePost } variant="contained">Create Post</Button>
				</div>
			</Modal>

			{
				posts.length ? (
					posts.map((post, index) => {
						if (index === posts.length - 1) {
							return (<InView key={post._id}>
								{
									({inView, ref}: {inView: boolean, ref: any}) => {
										if (inView) {
											(async () => {
												const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/getPosts/${id}-${posts.length}`);
												const p = await result.json();
												const pids: string[] = [];
												for (let pp of posts) pids.push(pp._id);
												
												if (p.length && !pids.includes(p[0]._id)) {
													p.sort((a: Post, b: Post) => {
														return a._id > b._id ? -1 : 1;
													});
													setPosts(posts.concat(p));
												}
											})();
										}
										return (<div ref={ref}>
											<PostDisplay
												post={post}
												deletePost={deletePost}
												groupId={id || ""}
												amAdmin={groupDetails?.admins.includes(auth.currentUser?.uid || "") || false}
											/>
										</div>);
									}
								}
							</InView>);
						} else {
							return (<div key={post._id}>
								<PostDisplay
									post={post}
									deletePost={deletePost}
									groupId={id || ""}
									amAdmin={groupDetails?.admins.includes(auth.currentUser?.uid || "") || false}
								/>
							</div>);
						}
					})
				) : (
					<Typography variant="h6">No posts yet. Create one.</Typography>
				)
			}
		</div>
	</div>);
}