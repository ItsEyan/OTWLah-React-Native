export class User {
	constructor(uid, username, avatar, departureTime, currentLocation, isLeader) {
		this.uid = uid;
		this.name = username;
		this.avatar = avatar;
		this.departureTime = departureTime;
		this.currentLocation = currentLocation;
		this.isLeader = isLeader;
	}
}
