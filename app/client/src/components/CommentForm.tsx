import { auth } from '../firebase';

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { InView } from "react-intersection-observer";

import type { Comment } from '../types';

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
			const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/getComments/${postId}-${comments.length}`);

			const c = await result.json();
			c.sort((a: Comment, b: Comment) => {
				return a._id > b._id ? -1 : 1;
			});
			setComments(c);
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
		const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + "/createComment", {
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

	return (<div className="flex flex-col items-center bg-white m-[32px] p-[32px] min-w-[300px] gap-[12px] rounded">
		<Button className="w-[50vw]" onClick={handleClose} size="small" color="error" variant="contained">Close</Button>

		{
			(access === 0 || (access === 1 && amAdmin)) &&
			<div className="flex flex-col gap-[12px] items-center">
				<Typography variant="h4">Comments</Typography>
				<TextField
					className="w-[70vw]"
					error={textError}
					value={text}
					onChange={(e) => setText(e.target.value)}
					label="comment..."
					multiline
					variant="outlined"
					size="small"
					inputProps={{ maxLength: 256 }}
					helperText={helperText}
				/>
				<Button className="w-[50vw]" onClick={handleSubmit} size="small" color="success" variant="contained">Submit</Button>
			</div>
		}

		<div className="flex flex-col gap-[12px] w-[70vw]">
			{
				comments.length ? (
					comments.map((comment, index) => {
						if (index === comments.length - 1) {
							return (<InView key={comment._id}>
								{
									({inView, ref}: {inView: boolean, ref: any}) => {
										if (inView) {
											(async () => {
												const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/getComments/${postId}-${comments.length}`);
												const c = await result.json();
												const cids: string[] = [];
												for (let cc of comments) cids.push(cc._id);
												
												if (c.length && !cids.includes(c[0]._id)) {
													c.sort((a: Comment, b: Comment) => {
														return a._id > b._id ? -1 : 1;
													});
													setComments(comments.concat(c));
												}
											})();
										}
										return (<div ref={ref} className="flex flex-col px-[12px] py-[4px] bg-gray-200 rounded">
											<Typography variant="caption">{ comment.name + " >>" }</Typography>
											<div className="prose lg:prose-xl">
												<Markdown remarkPlugins={[remarkGfm]}>
													{ comment.text }
												</Markdown>
											</div>
										</div>);
									}
								}
							</InView>);
						} else {
							return (<div key={comment._id} className="flex flex-col px-[12px] py-[4px] bg-gray-200 rounded">
								<Typography variant="caption">{ comment.name + " >>" }</Typography>
								<div className="prose lg:prose-xl">
									<Markdown remarkPlugins={[remarkGfm]}>
										{ comment.text }
									</Markdown>
								</div>
							</div>);
						}
					})
				) : (
					<Typography variant="h6">No Comments Yet</Typography>
				)
			}
		</div>
	</div>);
}