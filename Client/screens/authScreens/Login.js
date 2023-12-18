import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';

import {
	Dimensions,
	Image,
	Keyboard,
	Pressable,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import SlidingUpPanel from 'rn-sliding-up-panel';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Button from '../../components/Button';
import InputField from '../../components/InputField';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import { InfoText } from '../../components/styles';
import COLORS from '../../constants/colors';
import { baseAPIUrl } from '../../constants/sharedVariables';

const Login = () => {
	const {
		wrapper,
		container,
		header,
		description,
		iconBg,
		topHalf,
		panel,
		panelHandle,
	} = styles;
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
	const [forgotPasswordEmailError, setForgotPasswordEmailError] = useState('');
	const [forgotPasswordSelected, setForgotPasswordSelected] = useState(false);
	const [registerSelected, setRegisterSelected] = useState(false);
	const navigation = useNavigation();

	const auth = getAuth();
	const db = FIREBASE_DB;

	const screenHeight = Dimensions.get('window').height;

	const login = async () => {
		Keyboard.dismiss();
		if (email.length === 0) {
			setEmailError('Please enter an email address!');
			setPasswordError('');
			return;
		}
		if (!checkValidEmail(email)) {
			setEmailError('Invalid email!');
			setPasswordError('');
			return;
		}
		if (!checkValidPassword(password)) {
			setPasswordError('Wrong password!');
			setEmailError('');
			return;
		}
		await signInWithEmailAndPassword(auth, email, password)
			.then((userCredential) => {
				setEmailError('');
				setPasswordError('');
				dispatchSignedIn({
					type: 'UDATE_SIGN_IN',
					payload: { userToken: 'signed-in' },
				});
			})
			.catch((error) => {
				const errorCode = error.code;
				if (errorCode === 'auth/wrong-password') {
					setPasswordError('Wrong password!');
				}
				if (errorCode === 'auth/user-not-found') {
					setEmailError('User not found!');
				}
			});
	};

	const checkValidPassword = (password) => {
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

		return validationIssues.length === 0;
	};

	const checkValidEmail = (email) => {
		let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
		return reg.test(email);
	};

	const sendResetPasswordEmail = async () => {
		Keyboard.dismiss();
		try {
			setForgotPasswordEmail(forgotPasswordEmail.trim().toLowerCase());
			Keyboard.dismiss();
			if (!checkValidEmail(forgotPasswordEmail)) {
				setForgotPasswordEmailError('Invalid email!');
				return;
			}
			let username;
			const q = query(
				collection(db, 'User'),
				where('email', '==', forgotPasswordEmail)
			);
			await getDocs(q).then((querySnapshot) => {
				if (querySnapshot.empty) {
					setForgotPasswordEmailError('Invalid email!');
					throw new Error('Invalid email!');
				}
				username = querySnapshot.docs[0].data().username;
				setForgotPasswordEmailError('');
			});

			const url = `${baseAPIUrl}/sendResetPasswordEmail`;
			axios.get(url, {
				params: {
					email: forgotPasswordEmail,
					username: username,
				},
			});
			this._panel.hide();
			navigation.navigate('OTPVerification', {
				email: forgotPasswordEmail.toLowerCase(),
				username: username,
				password: null,
			});
		} catch (error) {
			console.log(error);
		}
	};

	const panelContent = () => {
		return (
			<View style={{ marginHorizontal: 20 }}>
				<Text style={[header, { color: COLORS.black }]}>Forgot Password?</Text>
				<Text style={[description, { color: COLORS.grey }]}>
					Enter your email address below and we will send you an OTP to reset
					your password.
				</Text>

				<InputField
					hint="Enter your email"
					keyboardType="email-address"
					setValue={setForgotPasswordEmail}
					error={forgotPasswordEmailError}
					submit={sendResetPasswordEmail}
				/>

				<Button
					title="Reset Password"
					filled={true}
					color={COLORS.black}
					onPress={sendResetPasswordEmail}
					style={{
						marginTop: 18,
						marginBottom: 4,
					}}
				/>
			</View>
		);
	};

	return (
		<View style={{ flex: 1 }}>
			<KeyboardAvoidingWrapper>
				<SafeAreaView style={wrapper}>
					<View style={container}>
						<View style={topHalf}>
							<LinearGradient
								colors={[COLORS.pink, COLORS.primary]}
								start={{ x: 0, y: 0.7 }}
								style={iconBg}>
								<Image
									style={{ width: '100%', height: '100%', opacity: 1 }}
									source={require('../../assets/OTWLahLogo.png')}
								/>
							</LinearGradient>
						</View>
						<View style={{ marginTop: 10 }}>
							<Text style={[{ textAlign: 'center' }, header]}>
								Welcome Back
							</Text>
						</View>

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
							submit={login}
							isPassword={true}
						/>
						<Pressable
							onPress={() => {
								this._panel.show();
								Keyboard.dismiss();
							}}
							onPressIn={() => setForgotPasswordSelected(true)}
							onPressOut={() => setForgotPasswordSelected(false)}>
							<Text
								style={{
									color: COLORS.grey,
									fontSize: 13,
									opacity: forgotPasswordSelected ? 0.4 : 1,
									fontWeight: 'bold',
									textAlign: 'right',
								}}>
								Forgot your password?
							</Text>
						</Pressable>

						<Button
							title="Log In"
							filled={true}
							onPress={login}
							style={{
								marginTop: 18,
								marginBottom: 4,
							}}
						/>
						<View style={{ flexDirection: 'row', justifyContent: 'center' }}>
							<InfoText style={{ paddingVertical: 10 }}>
								Don't have an account?{'  '}
							</InfoText>
							<Pressable
								onPress={() => {
									Keyboard.dismiss();
									navigation.navigate('Register');
								}}
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
									Sign up
								</Text>
							</Pressable>
						</View>
					</View>
					<SlidingUpPanel
						ref={(c) => (this._panel = c)}
						draggableRange={{ top: screenHeight / 2.5, bottom: 0 }}
						snappingPoints={[0]}
						backdropOpacity={0.6}>
						<View style={panel}>
							<View style={{ alignItems: 'center' }}>
								<View style={panelHandle} />
							</View>
							{panelContent()}
						</View>
					</SlidingUpPanel>
				</SafeAreaView>
			</KeyboardAvoidingWrapper>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: COLORS.white,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
	container: {
		paddingHorizontal: 22,
		height: '100%',
	},
	header: {
		marginVertical: 22,
		fontWeight: 'bold',
		fontSize: 25,
		color: COLORS.darkPurple,
	},
	description: {
		fontSize: 16,
		color: COLORS.black,
	},
	iconBg: {
		marginTop: 20,
		width: 250,
		height: 250,
		borderRadius: 250,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.8,
	},
	topHalf: {
		flex: 0.5,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 20,
	},
	panel: {
		flex: 1,
		backgroundColor: 'white',
		justifyContent: 'flex-start',
		borderRadius: 16,
	},
	panelHandle: {
		width: 150,
		height: 6,
		borderRadius: 10,
		backgroundColor: COLORS.grey,
		marginTop: 10,
		opacity: 0.6,
	},
});

export default Login;
