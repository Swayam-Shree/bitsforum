export interface Group {
	_id: string,
	groupName: string,
	groupDesc: string,
	admins: string[],
	allMembers: string[]
}

export interface PostFile {
	name: string,
	url: string
}

export interface Comment {
	_id: string,
	postId: string,
	uid: string,
	name: string,
	text: string
}

export interface Post {
	_id: string,
	groupId: string,
	uid: string,
	name: string,
	title: string,
	content: string,
	files: PostFile[],
	commentAccess: number
}