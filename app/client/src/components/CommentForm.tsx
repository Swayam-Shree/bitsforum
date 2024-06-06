import { auth } from '../firebase';

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import type { Comment } from '../types';

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function CommentForm({ amAdmin, access, postId, groupId, handleClose }:{
	amAdmin: boolean,
	access: number,
	postId: string,
	groupId: string,
	handleClose: () => void }
) {
	const [text, setText] = useState("");
	const [textError, setTextError] = useState(false);
	const [helperText, setHelperText] = useState("");

	const [comments, setComments] = useState<Comment[]>([]);

	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			const result = await fetch(`http://localhost:6969/getComments/${postId}`);
			const comments = await result.json();

			setComments(comments);
		})();
	}, []);

	async function handleSubmit() {
		if (!text) {
			setHelperText("Comment cannot be empty");
			setTextError(true);
			return;
		}

		const comment = {
			uid: auth.currentUser?.uid || "",
			name: auth.currentUser?.displayName || "",
			postId: postId,
			text: text,
			groupId: groupId
		};
		const result = await fetch("http://localhost:6969/createComment", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(comment)
		});

		if (result.status === 403) {
			alert(await result.text());
			navigate("/profile");
			return;
		} else if (result.status === 200) {
			const finalComment = {
				_id: (await result.json()).insertedId,
				...comment
			};
			setComments([finalComment, ...comments]);
			setText("");
			setHelperText("submitted succesfully");
			setTextError(false);
		}
	}

	return (<div className="flex flex-col bg-white m-[32px] p-[32px] min-w-[300px] gap-[12px] rounded">
		<Button onClick={handleClose} size="small" color="error" variant="contained">Close</Button>

		{
			(access === 0 || (access === 1 && amAdmin)) &&
			<div className="flex flex-col gap-[12px]">
				<Typography variant="h5">Comments</Typography>
				<TextField
					error={textError}
					value={text}
					onChange={(e) => setText(e.target.value)}
					label="comment..."
					multiline
					fullWidth
					variant="outlined"
					size="small"
					inputProps={{ maxLength: 256 }}
					helperText={helperText}
				/>
				<Button onClick={handleSubmit} size="small" color="success" variant="contained">Submit</Button>
			</div>
		}

		<div className="flex flex-col gap-[12px]">
			{
				comments.length ? (
					comments.map((comment) => {
						return (<div key={comment._id} className="flex flex-col px-[12px] py-[4px] bg-gray-200 rounded">
							<Typography variant="caption">{ comment.name + " >>" }</Typography>
							<Typography variant="body1">{ comment.text }</Typography>
						</div>);
					})
				) : (
					<Typography variant="h6">No Comments Yet</Typography>
				)
			}
		</div>
	</div>);
}