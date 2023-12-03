import {
	createUserWithEmailAndPassword,
	getAuth,
	linkWithCredential,
} from 'firebase/auth';
import React, { useState } from 'react';
import {
	Keyboard,
	Platform,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import Button from '../components/Button';
import InputField from '../components/InputField';
import COLORS from '../constants/colors';

const Register = () => {
	const { wrapper, container, header, description } = styles;
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [emailError, setEmailError] = useState('');
	const [phoneError, setPhoneError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const auth = getAuth();

	function dismissKeyboard() {
		if (Platform.OS != 'web') {
			Keyboard.dismiss();
		}
	}

	const checkValidEmail = (text) => {
		let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
		return reg.test(text);
	};

	const handleSignup = async () => {
		if (!checkValidEmail(email)) {
			setEmailError('Invalid email');
			return;
		}
		setEmailError('');
		try {
			const response = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			linkWithCredential(auth.currentUser, phone.replace(/\s/g, ''))
				.then((usercred) => {
					const user = usercred.user;
					console.log('Account linking success', user);
				})
				.catch((error) => {
					console.log('Account linking error', error);
				});
		} catch (error) {
			console.log(error);
			if (error.code === 'auth/email-already-in-use') {
				setEmailError('Email already in use');
				setPasswordError('');
			}
			if (
				error.code === 'auth/missing-password' ||
				error.code === 'auth/weak-password'
			) {
				setEmailError('');
				setPasswordError('Weak password');
			}
		}
	};

	return (
		<SafeAreaView style={wrapper}>
			<TouchableWithoutFeedback
				onPress={() => dismissKeyboard()}
				accessible={false}>
				<View style={container}>
					<View style={{ marginVertical: 22 }}>
						<Text style={header}>Create Account</Text>
						<Text style={description}>Connect with your friends!</Text>
					</View>

					<InputField
						description="Email Address"
						hint="Enter your email address"
						keyboardType="email-address"
						setValue={setEmail}
						error={emailError}
					/>
					<InputField
						description="Phone Number"
						hint="Enter your phone number"
						keyboardType="phone-pad"
						setValue={setPhone}
						error={phoneError}
					/>
					<InputField
						description="Password"
						hint="Enter your password"
						keyboardType="default"
						setValue={setPassword}
						error={passwordError}
						isPassword={true}
					/>

					<Button
						title="Register"
						filled={true}
						onPress={handleSignup}
						style={{
							marginTop: 18,
							marginBottom: 4,
						}}
					/>
				</View>
			</TouchableWithoutFeedback>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: COLORS.white,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
	container: {
		flex: 1,
		paddingHorizontal: 22,
	},
	header: {
		marginVertical: 22,
		fontWeight: 'bold',
		fontSize: 22,
		color: COLORS.black,
	},
	description: {
		fontSize: 16,
		color: COLORS.black,
	},
});

export default Register;
