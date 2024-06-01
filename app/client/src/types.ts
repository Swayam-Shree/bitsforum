export interface Group {
	_id: string,
	groupName: string,
	groupDesc: string,
	admins: string[],
	allMembers: string[]
}