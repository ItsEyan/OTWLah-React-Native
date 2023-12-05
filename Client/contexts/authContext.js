import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useEffect, useReducer, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import COLORS from '../constants/colors';
import { SignInReducer } from '../reducers/authReducers';

export const SignInContext = createContext();

export const SignInContextProvider = (props) => {
	const [signedIn, dispatchSignedIn] = useReducer(SignInReducer, {
		userToken: null,
	});
	const [loading, setLoading] = useState(true);

	const auth = getAuth();

	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				setLoading(false);
				dispatchSignedIn({
					type: 'UPDATE_SIGN_IN',
					payload: { userToken: 'signed-in' },
				});
			} else {
				setLoading(false);
				dispatchSignedIn({
					type: 'UPDATE_SIGN_IN',
					payload: { userToken: null },
				});
			}
		});
	}, []);

	const loadingScreen = () => {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<LinearGradient
					colors={[COLORS.pink, COLORS.primary]}
					start={{ x: 0, y: 0.7 }}
					style={styles.iconBg}>
					<Image
						style={{ width: '100%', height: '100%', opacity: 1 }}
						source={require('../assets/OTWLahLogo.png')}
					/>
				</LinearGradient>
			</View>
		);
	};

	return (
		<SignInContext.Provider value={{ signedIn, dispatchSignedIn }}>
			{loading && loadingScreen()}
			{!loading && props.children}
		</SignInContext.Provider>
	);
};

const styles = StyleSheet.create({
	iconBg: {
		marginTop: 20,
		width: 250,
		height: 250,
		borderRadius: 250,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.8,
	},
});
