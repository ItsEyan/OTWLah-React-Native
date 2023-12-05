import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { fetchSignInMethodsForEmail, getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import {
	Keyboard,
	Platform,
	Pressable,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { FIREBASE_DB } from '../FirebaseConfig';
import Button from '../components/Button';
import InputField from '../components/InputField';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';
import { InfoText } from '../components/styles';
import COLORS from '../constants/colors';
import { baseAPIUrl } from '../constants/sharedVariables';

const Register = () => {
	const { wrapper, container, header, description } = styles;
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [emailError, setEmailError] = useState('');
	const [usernameError, setUsernameError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [registerSelected, setRegisterSelected] = useState(false);
	const navigation = useNavigation();
	const auth = getAuth();
	const db = FIREBASE_DB;

	const checkValidEmail = async (email) => {
		setEmail(email.trim());
		return new Promise(async (resolve) => {
			let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
			if (!reg.test(email)) {
				setEmailError('Invalid email!');
				setPasswordError('');
				resolve(false);
				return;
			}

			await fetchSignInMethodsForEmail(auth, email).then((signInMethods) => {
				if (signInMethods.length > 0) {
					setEmailError('Email already in use!');
					setPasswordError('');
					resolve(false);
					return;
				}
			});
			resolve(true);
			return;
		});
	};

	const checkValidUsername = async (username) => {
		setUsername(username.trim());
		return new Promise(async (resolve) => {
			if (username.length === 0) {
				setUsernameError('Please enter a username!');
				setEmailError('');
				setPasswordError('');
				resolve(false);
				return;
			}
			const q = query(
				collection(db, 'User'),
				where('lowercase_username', '==', username.toLowerCase())
			);
			await getDocs(q).then((querySnapshot) => {
				if (!querySnapshot.empty) {
					setUsernameError('Username already in use!');
					setEmailError('');
					setPasswordError('');
					resolve(false);
					return;
				}
				resolve(true);
			});
		});
	};

	const checkStrongPassword = async (password) => {
		return new Promise((resolve) => {
			let validations = [
				{ pattern: /[a-z]/, issue: 'Must include a lowercase letter.' },
				{ pattern: /[A-Z]/, issue: 'Must include an uppercase letter.' },
				{ pattern: /[0-9]/, issue: 'Must include a number.' },
				{ pattern: /.{8,}/, issue: 'Must be at least 8 characters long.' },
			];
			let validationIssues = validations
				.filter((validation) => {
					return !password?.match?.(validation.pattern);
				})
				.map((validation) => validation.issue);
			if (/^(?=.*\s)/.test(password))
				validationIssues.push('Must not contain spaces.');
			if (validationIssues.length > 0) {
				setPasswordError('Weak password');
				console.log(
					`Your password was too weak for the following reasons: ${validationIssues.join(
						'\n'
					)}`
				);
				resolve(false);
				return;
			}
			resolve(true);
		});
	};

	const handleSignup = async () => {
		Keyboard.dismiss();
		try {
			await checkValidUsername(username).then((result) => {
				if (!result) {
					throw new Error('invalid username');
				}
				setUsernameError('');
			});

			await checkValidEmail(email).then((result) => {
				if (!result) {
					throw new Error('invalid email');
				}
				setEmailError('');
			});

			await checkStrongPassword(password).then((result) => {
				if (!result) {
					throw new Error('weak password');
				}
				setPasswordError('');
			});
			const url = `${baseAPIUrl}/requestOTP`;
			axios.get(url, {
				params: {
					email: email.toLowerCase(),
					username: username,
				},
			});

			navigation.navigate('OTPVerification', {
				email: email.toLowerCase(),
				password: password,
				username: username,
			});
		} catch (error) {
			if (
				error &&
				error !== undefined &&
				error.toString &&
				error.toString !== undefined
			) {
				// print the general exception
				console.log(error.toString());
			}
			if (
				error.response &&
				error.response !== undefined &&
				error.response.data &&
				error.response.data !== undefined
			) {
				// print the exception message from axios response
				console.log(error.response.data);
			}
		}
	};

	return (
		<SafeAreaView style={wrapper}>
			<KeyboardAvoidingWrapper>
				<View style={container}>
					<View style={{ marginVertical: 22 }}>
						<Text style={header}>Create Account</Text>
						<Text style={description}>Connect with your friends!</Text>
					</View>

					<InputField
						description="Username"
						hint="Enter your username"
						keyboardType="default"
						setValue={setUsername}
						error={usernameError}
					/>
					<InputField
						description="Email Address"
						hint="Enter your email address"
						keyboardType="email-address"
						setValue={setEmail}
						error={emailError}
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

					<View style={{ flexDirection: 'row', justifyContent: 'center' }}>
						<InfoText style={{ paddingVertical: 10 }}>
							Already have an account?{'  '}
						</InfoText>
						<Pressable
							onPress={() => navigation.navigate('Login')}
							onPressIn={() => setRegisterSelected(true)}
							onPressOut={() => setRegisterSelected(false)}>
							<Text
								style={{
									color: COLORS.primary,
									opacity: registerSelected ? 0.4 : 1,
									fontSize: 15,
									paddingVertical: 10,
									fontWeight: 'bold',
								}}>
								Log in
							</Text>
						</Pressable>
					</View>
				</View>
			</KeyboardAvoidingWrapper>
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
