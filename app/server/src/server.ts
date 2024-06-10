import 'dotenv/config';
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { ObjectId } from 'mongodb';
import type { PullOperator } from 'mongodb';
import { db, postRepo, commentRepo } from "./db/connection.js";
import { google } from "googleapis";
import { Server, Socket } from "socket.io";

const nodemailer = require("nodemailer");

const app: Express = express();
const port = process.env.PORT || 6969;

const origins = [
	"http://localhost:5173",
	"https://bitsforum.vercel.app",
	"https://bitsforum-swayam-shrees-projects.vercel.app"
]
if (process.env.EXTRA_ORIGIN) {
	origins.push(process.env.EXTRA_ORIGIN);
}

app.use(cors({ origin: origins }));
app.use(express.json());

let nmTransporter: any;
(async function createNMTransporter() {
	const oauth2Client = new google.auth.OAuth2(
		process.env.CLIENT_ID,
		process.env.CLIENT_SECRET,
		"https://developers.google.com/oauthplayground"
	);
	oauth2Client.setCredentials({
		refresh_token: process.env.REFRESH_TOKEN
	});

	nmTransporter = await nodemailer.createTransport({
		service: "gmail",
		auth: {
			type: "OAuth2",
			user: process.env.EMAIL,
			accessToken: await oauth2Client.getAccessToken(),
			clientId: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			refreshToken: process.env.REFRESH_TOKEN
		}
	});

	console.log("email transporter ready");
})();

async function validateAdminRequest(groupId: string, requester: string, res: Response) {
	const group = await db.collection("groups").findOne({
		_id: new ObjectId(String(groupId))
	});

	if (!group?.admins.includes(requester)) {
		res.status(403).send("Action incomplete. You had been removed from the group.");
		return false;
	}

	return true;
}

// health check for render
app.get("/healthz", (req: Request, res: Response) => {
	res.status(200).send("OK");
});

app.get("/", (req: Request, res: Response) => {
	res.send("Welcome to BITSForum server");
});

// async function validateUserRequest(groupId: string, requester: string, res: Response) {
// 	const group = await db.collection("groups").findOne({
// 		_id: new ObjectId(String(groupId))
// 	});

// 	if (!group?.allMembers.includes(requester)) {
// 		res.status(403).send("Action incomplete. You had been removed from the group.");
// 		return false;
// 	}

// 	return true;
// }

// after each user logs in
app.post("/loggedin", async (req: Request, res: Response) => {
	const { uid, email } = req.body;

	if (!email.endsWith("bits-pilani.ac.in")) {
		res.status(403).send("Please login with your BITS mail");
		return;
	}

	const result = await db.collection("users").updateOne({
		uid: uid
	}, {
		$set: {
			uid: uid,
			email: email
		}
	}, {
		upsert: true
	});
	
	res.send(result).status(200);
});

app.post("/createGroup", async (req: Request, res: Response) => {
	const { uid, groupName, groupDesc } = req.body;

	const result = await db.collection("groups").insertOne({
		admins: [uid],
		allMembers: [uid],
		groupName: groupName,
		groupDesc: groupDesc
	});

	res.send(result).status(200);
});
app.delete("/deleteGroup/:groupId-:uid", async (req: Request, res: Response) => {
	const { groupId, uid } = req.params;

	const group = await db.collection("groups").findOne({
		_id: new ObjectId(String(groupId))
	});

	if (!group?.admins.includes(uid)) {
		return;
	}

	let result = await db.collection("posts").deleteMany({
		groupId: groupId
	});
	result = await db.collection("groups").deleteOne({
		_id: new ObjectId(groupId)
	});

	res.send(result).status(200);
});

// list of groups joined and not joined by a user
app.get("/joinedGroups/:uid", async (req: Request, res: Response) => {
	const { uid } = req.params;

	const result = await db.collection("groups").find({
		allMembers: {
			$in: [uid]
		}
	}).toArray();

	res.send(result).status(200);
});
app.get("/unjoinedGroups/:uid", async (req: Request, res: Response) => {
	const { uid } = req.params;

	const result = await db.collection("groups").find({
		allMembers: {
			$nin: [uid]
		}
	}).toArray();

	res.send(result).status(200);
});

app.get("/joinGroup/:groupId-:uid", async (req: Request, res: Response) => {
	const { groupId, uid } = req.params;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(groupId)
	}, {
		$push: {
			allMembers: uid
		} as PullOperator<Document>
	});

	res.send(result).status(200);
});
app.delete("/leaveGroup/:groupId-:uid", async (req: Request, res: Response) => {
	const { groupId, uid } = req.params;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(groupId)
	}, {
		$pull: {
			allMembers: uid,
			admins: uid
		} as PullOperator<Document>
	});

	res.send(result).status(200);
});

app.post("/makeAdmin/:groupId-:uid-:requester", async (req: Request, res: Response) => {
	const { groupId, uid, requester } = req.params;

	if (!await validateAdminRequest(groupId, requester, res)) return;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(groupId)
	}, {
		$push: {
			admins: uid
		} as PullOperator<Document>
	});

	res.send(result).status(200);
});

app.post("/addUser", async (req: Request, res: Response) => {
	const { groupId, requester, email } = req.body;

	if (!await validateAdminRequest(groupId, requester, res)) return;

	const user = await db.collection("users").findOne({
		email: email
	});

	if (!user) {
		res.status(404).send("user doesn't exist");
		return;
	}

	const group = await db.collection("groups").findOne({
		_id: new ObjectId(String(groupId))
	});

	if (group?.allMembers.includes(user.uid)) {
		res.status(400).send("User already in group");
		return;
	}

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(String(groupId))
	}, {
		$push: {
			allMembers: user.uid
		}
	});

	res.status(200).send(user.uid);
});
app.delete("/removeUser/:groupId-:uid-:requester", async (req: Request, res: Response) => {
	const { groupId, uid, requester } = req.params;

	if (!await validateAdminRequest(groupId, requester, res)) return;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(String(groupId))
	}, {
		$pull: {
			allMembers: uid,
			admins: uid
		} as PullOperator<Document>
	});

	res.status(200).send(result);
});

app.get("/getGroup/:groupId", async (req: Request, res: Response) => {
	const { groupId } = req.params;

	const result = await db.collection("groups").findOne({
		_id: new ObjectId(groupId)
	});

	res.send(result).status(200);
});

app.get("/getEmail/:uid", async (req: Request, res: Response) => {
	const { uid } = req.params;

	const result = await db.collection("users").findOne({
		uid: uid
	});

	res.status(200).send(result?.email);
});

app.post("/createPost", async (req: Request, res: Response) => {
	const { groupId, uid, name, title, content, files, commentAccess } = req.body;

	if (!await validateAdminRequest(groupId, uid, res)) return;

	const post = {
		groupId: groupId,
		uid: uid,
		name: name,
		title: title,
		content: content,
		files: files,
		commentAccess: commentAccess
	};
	
	const result = await db.collection("posts").insertOne(post);
	
	res.status(200).send(result);

	let cachedPosts = await postRepo.search().where("groupId").equals(groupId).return.first();

	if (cachedPosts) {
		const finalPost = {
			...post,
			_id: String(result.insertedId)
		};
		postRepo.save(finalPost._id, finalPost);
	}

	const group = await db.collection("groups").findOne({
		_id: new ObjectId(String(groupId))
	});
	const members = group?.allMembers || [];
	members.splice(members.indexOf(uid), 1);

	const offlineUsers = [];
	for (let member of members) {
		const socket = getSocketFromUid(member);
		if (socket) {
			socket.emit("notification", `New post in group: ${group?.groupName}`);
		} else {
			offlineUsers.push(member);
		}
	}
	
	const users = await db.collection("users").find({
		uid: {
			$in: offlineUsers
		}
	}).toArray();

	if (!users.length) return;

	let emailString = "";
	users.forEach(user => {
		emailString += user.email + ", ";
	});
	emailString = emailString.slice(0, -2);

	const groupUrl = req.get("origin") + "/group/" + groupId;

	await nmTransporter.sendMail({
		from: process.env.EMAIL,
		bcc: emailString,
		subject: `New Post. BITSForum. in your group, ${group?.groupName}`,
		html: `
			<p>New post in your BITSForum group ${group?.groupName} by ${name}</p>
			<br>
			<a href=${groupUrl}>Click here to view</a>
		`
	});
});
const postLLchunk = 3;
app.get("/getPosts/:groupId-:skip", async (req: Request, res: Response) => {
	const { groupId, skip } = req.params;
	const seen = parseInt(skip);

	if (!seen) {
		const cachedPosts = await postRepo.search().where("groupId").equals(groupId).return.all();
		if (cachedPosts.length) {
			res.status(200).send(cachedPosts);
			return;
		}

		const result = await db.collection("posts").find({
			groupId: groupId
		}).sort({ _id: -1 }).limit(postLLchunk).toArray();
		res.status(200).send(result);
	} else {
		const result = await db.collection("posts").find({
			groupId: groupId
		}).sort({ _id: -1 }).skip(seen).limit(postLLchunk).toArray();
		res.status(200).send(result);
	}
});
app.delete("/deletePost/:groupId-:uid-:postId", async (req: Request, res: Response) => {
	const { groupId, uid, postId } = req.params;

	if (!await validateAdminRequest(groupId, uid, res)) return;

	let result = await db.collection("comments").deleteMany({
		postId: postId
	});

	result = await db.collection("posts").deleteOne({
		_id: new ObjectId(postId)
	});

	await postRepo.remove(postId);

	res.status(200).send(result);
});

app.post("/createComment", async (req: Request, res: Response) => {
	const { postId, uid, name, text, groupId } = req.body;

	const group = await db.collection("groups").findOne({
		_id: new ObjectId(String(groupId))
	});
	if (!group?.allMembers.includes(uid)) {
		res.status(403).send("Action incomplete. You had been removed from the group.");
		return;
	}
	const post = await db.collection("posts").findOne({
		_id: new ObjectId(String(postId))
	});

	switch (post?.commentAccess) {		
		case 1:
			if (!group?.admins.includes(uid)) {
				res.status(403).send("Settings changed to allow only admins to comment.");
			}
		case 2:
			res.status(403).send("Settings changed to not allow anyone to comment.");
			return;
	}

	const comment = {
		postId: postId,
		uid: uid,
		name: name,
		text: text
	};

	const result = await db.collection("comments").insertOne(comment);

	res.status(200).send(result);

	const finalComment = {
		...comment,
		_id: String(result.insertedId)
	};
	commentRepo.save(finalComment._id, finalComment);

	if (uid === post?.uid) return;

	const socket = getSocketFromUid(post?.uid);
	if (socket) {
		socket.emit("notification", `${name} - commented on your post in group: ${group?.groupName}`);
		return;
	}

	const ownerEmail = await db.collection("users").findOne({
		uid: post?.uid
	});

	const groupUrl = req.get("origin") + "/group/" + groupId;

	await nmTransporter.sendMail({
		from: process.env.EMAIL,
		to: ownerEmail?.email,
		subject: `New Comment. BITSForum. on your post.`,
		text: `${name} commented on your post in group ${group?.groupName}.`,
		html: `
			<p>${name} commented on your post in group ${group?.groupName}</p>
			<br>
			<a href=${groupUrl}>Click here to view your group</a>
		`
	});
});
const commentLLchunk = 5;
app.get("/getComments/:postId-:skip", async (req: Request, res: Response) => {
	const { postId, skip } = req.params;
	const seen = parseInt(skip);

	if (!seen) {
		const cachedComments = await commentRepo.search().where("postId").equals(postId).return.all();
		if (cachedComments.length) {
			res.status(200).send(cachedComments);
			return;
		}

		const result = await db.collection("comments").find({
			postId: postId
		}).sort({ _id: -1}).limit(commentLLchunk).toArray();
		res.status(200).send(result);
	} else {
		const result = await db.collection("comments").find({
			postId: postId
		}).sort({ _id: -1}).skip(seen).limit(commentLLchunk).toArray();
		res.status(200).send(result);
	}
});
app.get("/getCommentAccess/:postId", async (req: Request, res: Response) => {
	const { postId } = req.params;

	const result = await db.collection("posts").findOne({
		_id: new ObjectId(String(postId))
	});

	res.status(200).send(String(result?.commentAccess));
});
app.patch("/updateCommentAccess/:groupId-:uid-:postId-:commentAccess", async (req: Request, res: Response) => {
	const { groupId, uid, postId, commentAccess } = req.params;

	if (!await validateAdminRequest(groupId, uid, res)) return;

	const result = await db.collection("posts").updateOne({
		_id: new ObjectId(postId)
	}, {
		$set: {
			commentAccess: parseInt(commentAccess)
		}
	});

	res.status(200).send(result);

	// let cachedPosts = await postRepo.search().where("groupId").equals(groupId).return.first();
	let cachedPost = await postRepo.fetch(postId);

	if (cachedPost) {
		cachedPost.commentAccess = parseInt(commentAccess);
		postRepo.save(postId, {
			...cachedPost,
		});
	}
});

const server = app.listen(port, () => {
	console.log(`app listening on port ${port}`);
});

const io = new Server(server, {
	cors: {
		origin: origins
	}
});
console.log("socket initialized");

const sockets: { uid: string, socket: Socket }[] = [];

io.on("connection", (socket) => {
	console.log(`socket connected: ${socket.id}`);
	
	socket.on("addUser", (uid) => {
		sockets.push({ uid, socket });
		socket.emit("notification", "Welcome to BITSForum");
	});

	socket.on("disconnect", () => {
		console.log(`socket disconnected: ${socket.id}`);
		for (let i = 0; i < sockets.length; ++i) {
			let s = sockets[i];
			if (s.socket.id === socket.id) {
				sockets.splice(i, 1);
				break;
			}
		}
	});
});

function getSocketFromUid(uid: string) {
	for (let s of sockets) {
		if (s.uid === uid) {
			return s.socket;
		}
	}
	return null;
}