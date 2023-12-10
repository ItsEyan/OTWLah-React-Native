export const SignInReducer = (state, action) => {
	switch (action.type) {
		case 'UPDATE_SIGN_IN':
			return {
				userToken: action.payload.userToken,
				userEmail: action.payload.email,
				userDisplayName: action.payload.displayName,
				userPhotoURL: action.payload.photoURL,
				userUID: action.payload.uid,
			};
		case 'NEW_USER':
			return {
				userToken: action.payload.userToken,
				userEmail: action.payload.email,
				userDisplayName: action.payload.displayName,
				userPhotoURL: action.payload.photoURL,
				userUID: action.payload.uid,
			};
		default:
			return state;
	}
};
