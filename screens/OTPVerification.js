import React, { useState } from 'react';
import {
	Image,
	Keyboard,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import Button from '../components/Button';
import CodeInputField from '../components/CodeInputField';
import COLORS from '../constants/colors';

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

	const [code, setCode] = useState('');
	const [pinReady, setPinReady] = useState(false);

	//verification button
	const [verifying, setVerifying] = useState(false);

	const MAX_CODE_LENGTH = 6;

	// resent otp
	const [timeLeft, setTimeLeft] = useState(null);
	const [targetTime, setTargetTime] = useState(null);
	const [activeResend, setActiveResend] = useState(false);

	const [resendingEmail, setResendingEmail] = useState(false);
	const [resendStatus, setResendStatus] = useState('Resend');

	let resendTimerInterval;

	const submitOTPVerification = () => {};

	function dismissKeyboard() {
		if (Platform.OS != 'web') {
			Keyboard.dismiss();
		}
	}

	return (
		<SafeAreaView style={wrapper}>
			<TouchableWithoutFeedback
				onPress={() => dismissKeyboard()}
				accessible={false}>
				<View style={container}>
					<View style={topHalf}>
						<View style={iconBg}>
							<Image
								style={{ width: '100%', height: '100%', opacity: 1 }}
								source={require('../assets/OTWLahLogo.png')}
							/>
						</View>
					</View>
					<View style={[topHalf, bottomHalf]}>
						<Text style={header}>OTP Verification</Text>
						<Text style={infoText}>Please enter the 6-digit OTP sent to</Text>
						<Text style={[infoText, emphasiseText]}>EyanLee83@gmail.com</Text>

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
					</View>
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
	},
	topHalf: {
		flex: 0.5,
		justifyContent: 'center',
		alignItems: 'center',
	},
	bottomHalf: {
		flex: 1,
		justifyContent: 'flex-start',
		marginHorizontal: -40,
	},
	iconBg: {
		backgroundColor: COLORS.primary,
		width: 225,
		height: 225,
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
