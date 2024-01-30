import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import {
	createUserWithEmailAndPassword,
	getAuth,
	reload,
	signInWithEmailAndPassword,
	updateProfile,
} from 'firebase/auth';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';
import React, { useContext, useEffect, useState } from 'react';
import {
	Image,
	Keyboard,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Button from '../../components/Button';
import CodeInputField from '../../components/CodeInputField';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import ResendTimer from '../../components/ResendTimer';
import VerificationModal from '../../components/VerificationModal';
import COLORS from '../../constants/colors';
import { baseAPIUrl } from '../../constants/sharedVariables';
import { SignInContext } from '../../contexts/authContext';

const OTPVerification = () => {
	const {
		wrapper,
		container,
		topHalf,
		bottomHalf,
		iconBg,
		header,
		infoText,
		emphasiseText,
	} = styles;

	const navigation = useNavigation();
	const route = useRoute();
	const storage = getStorage();

	const { dispatchSignedIn } = useContext(SignInContext);

	//data
	const email = route.params.email;
	const username = route.params.username;
	const password = route.params.password;
	const isResetPassword = route.params.isResetPassword
		? route.params.isResetPassword
		: false;

	//firebase
	const auth = getAuth();
	const db = FIREBASE_DB;

	const [code, setCode] = useState('');
	const [pinReady, setPinReady] = useState(false);

	//verification button
	const [verifying, setVerifying] = useState(false);

	const MAX_CODE_LENGTH = 6;

	//modal
	const [modalVisible, setModalVisible] = useState(false);
	const [verificationSuccessful, setVerificationSuccessful] = useState(false);
	const [requstMessage, setRequestMessage] = useState('');

	//resent otp
	const [timeLeft, setTimeLeft] = useState(null);
	const [targetTime, setTargetTime] = useState(null);
	const [activeResend, setActiveResend] = useState(false);

	const [resendingEmail, setResendingEmail] = useState(false);
	const [resendStatus, setResendStatus] = useState('Resend');

	let resendTimerInterval;

	const triggerTimer = (targetTimeInSeconds = 30) => {
		setTargetTime(targetTimeInSeconds);
		setActiveResend(false);
		const finalTime = +new Date() + targetTimeInSeconds * 1000;
		resendTimerInterval = setInterval(() => calculateTimeLeft(finalTime), 1000);
	};

	const calculateTimeLeft = (finalTime) => {
		const difference = finalTime - +new Date();
		if (difference >= 0) {
			setTimeLeft(Math.round(difference / 1000));
		} else {
			clearInterval(resendTimerInterval);
			setActiveResend(true);
			setTimeLeft(null);
		}
	};

	useEffect(() => {
		triggerTimer();

		return () => {
			clearInterval(resendTimerInterval);
		};
	}, []);

	const resendEmail = async () => {
		setResendingEmail(true);

		const url = `${baseAPIUrl}/resendOTP`;
		try {
			await axios.get(url, {
				params: {
					email: email,
					username: username,
				},
			});
			setResendStatus('Sent!');
		} catch {
			setResendStatus('Failed');
			alert('Failed to resend OTP. Please try again later.');
		}
		setResendingEmail(false);

		setTimeout(() => {
			setResendStatus('Resend');
			setActiveResend(false);
			triggerTimer();
		}, 5000);
	};

	const submitOTPVerification = async () => {
		Keyboard.dismiss();
		try {
			setVerifying(true);
			const url = `${baseAPIUrl}/verifyOTP`;
			const result = await axios.get(url, {
				params: {
					email: email,
					otp: code,
				},
			});
			const { data } = result;
			if (data.status !== 'SUCCESS') {
				setVerificationSuccessful(false);
				setRequestMessage(data.message);
			} else {
				if (password !== null) registerUser();
				setVerificationSuccessful(true);
			}

			setModalVisible(true);
			setVerifying(false);
		} catch (error) {
			console.log('error');
			setRequestMessage(error.message);
			setVerificationSuccessful(false);
			setModalVisible(true);
			setVerifying(false);
		}
	};

	const registerUser = async () => {
		try {
			const response = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			const user = response.user;

			await updateProfile(user, {
				displayName: username,
			});

			let photo;

			const reference = ref(storage, '/default_profile_picture.png');
			await getDownloadURL(reference).then((url) => {
				photo = url;
				updateProfile(user, {
					photoURL: url,
				});
			});
			await reload(user).then(() => {
				dispatchSignedIn({
					type: 'NEW_USER',
					payload: {
						userToken: 'signed-in',
						displayName: username,
						photoURL: photo,
						uid: auth.currentUser.uid,
						email: auth.currentUser.email,
					},
				});
			});

			await setDoc(doc(db, 'User', user.uid), {
				username: username,
				lowercase_username: username.toLowerCase(),
				email: email.toLowerCase(),
			});
			await deleteDoc(doc(db, 'otp_verification', email));
		} catch (error) {
			console.log(error);
		}
	};

	const persistLoginAfterOTPVerification = async () => {
		if (password === null) {
			navigation.navigate('ResetPassword', {
				email: email,
				isResetPassword: isResetPassword,
			});
		} else {
			signInWithEmailAndPassword(auth, email, password);
			dispatchSignedIn({
				type: 'UDATE_SIGN_IN',
				payload: { userToken: 'signed-in' },
			});
		}
	};

	return (
		<SafeAreaView style={wrapper}>
			<KeyboardAvoidingWrapper>
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
					<View style={[topHalf, bottomHalf]}>
						<Text style={header}>OTP Verification</Text>
						<Text style={infoText}>Please enter the 6-digit OTP sent to</Text>
						<Text style={[infoText, emphasiseText]}>{email}</Text>

						<CodeInputField
							setPinReady={setPinReady}
							code={code}
							setCode={setCode}
							maxLength={MAX_CODE_LENGTH}
						/>

						{!verifying && pinReady && (
							<View style={{ width: '50%' }}>
								<Button
									title="Verify"
									color={COLORS.primary}
									filled={true}
									onPress={submitOTPVerification}
								/>
							</View>
						)}

						{!verifying && !pinReady && (
							<View style={{ width: '50%' }}>
								<Button
									disabled={true}
									title="Verify"
									color={COLORS.grey}
									filled={true}
									onPress={submitOTPVerification}
								/>
							</View>
						)}

						<ResendTimer
							activeResend={activeResend}
							resendingEmail={resendingEmail}
							resendStatus={resendStatus}
							timeLeft={timeLeft}
							targetTime={targetTime}
							resendEmail={resendEmail}
						/>
					</View>

					<VerificationModal
						successful={verificationSuccessful}
						setModalVisible={setModalVisible}
						modalVisible={modalVisible}
						requestMessage={requstMessage}
						handler={persistLoginAfterOTPVerification}
					/>
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
	},
	topHalf: {
		flex: 0.5,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 50,
	},
	bottomHalf: {
		flex: 1,
		justifyContent: 'flex-start',
		marginHorizontal: -40,
	},
	iconBg: {
		width: 250,
		height: 250,
		borderRadius: 250,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.8,
	},
	header: {
		fontSize: 25,
		fontWeight: 'bold',
		color: COLORS.primary,
		padding: 10,
		textAlign: 'center',
	},
	infoText: {
		fontSize: 15,
		color: COLORS.grey,
		textAlign: 'center',
	},
	emphasiseText: {
		fontWeight: 'bold',
		fontStyle: 'italic',
	},
});

export default OTPVerification;
