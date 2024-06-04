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

export interface Post {
	_id: string,
	groupId: string,
	uid: string,
	name: string,
	title: string,
	content: string,
	files: PostFile[]
}