import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useState } from 'react';
import { Keyboard, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import InputField from '../components/InputField';
import KeyboardAvoidingWrapper from '../components/KeyboardAvoidingWrapper';
import VerificationModal from '../components/VerificationModal';
import COLORS from '../constants/colors';
import { baseAPIUrl, firebaseURL } from '../constants/sharedVariables';

const ResetPassword = () => {
	const { wrapper, container, header, description } = styles;

	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [newPasswordError, setNewPasswordError] = useState('');
	const [confirmPasswordError, setConfirmPasswordError] = useState('');

	//modal
	const [modalVisible, setModalVisible] = useState(false);
	const [success, setSuccess] = useState(false);
	const [requstMessage, setRequestMessage] = useState('');

	const navigation = useNavigation();
	const route = useRoute();
	const email = route.params.email;

	const checkStrongPassword = (password) => {
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
			setNewPasswordError('Weak password');
			console.log(
				`Your password was too weak for the following reasons: ${validationIssues.join(
					'\n'
				)}`
			);
			return false;
		}
		return true;
	};

	const checkPasswordMatch = (password, confirmPassword) => {
		if (password !== confirmPassword) {
			setConfirmPasswordError('Passwords do not match!');
			return false;
		}
		return true;
	};

	const checkCurrentPassword = async (password) => {
		return new Promise(async (resolve, reject) => {
			await axios
				.post(`${firebaseURL}`, {
					email: email,
					password: password,
				})
				.then((res) => {
					reject(false);
				})
				.catch((error) => {
					resolve(true);
				});
		});
	};

	const handlePasswordReset = async (password, confirmPassword) => {
		Keyboard.dismiss();
		try {
			if (!checkStrongPassword(password)) {
				setNewPasswordError('Weak password');
				setConfirmPasswordError('');
				return;
			}
			if (!checkPasswordMatch(password, confirmPassword)) {
				setConfirmPasswordError('Passwords do not match!');
				setNewPasswordError('');
				return;
			}
			setNewPasswordError('');
			setConfirmPasswordError('');

			await checkCurrentPassword(password)
				.then((result) => {
					setNewPasswordError('');
				})
				.catch((error) => {
					setNewPasswordError(
						'Password cannot be the same as current password.'
					);
					throw new Error('Password cannot be the same as current password.');
				});

			const url = `${baseAPIUrl}/resetPassword`;
			await axios
				.get(url, {
					params: {
						email: email,
						password: password,
					},
				})
				.then((res) => {
					if (res.data.status === 'SUCCESS') {
						setSuccess(true);
					} else {
						setSuccess(false);
					}
					setRequestMessage(res.data.message);
					setModalVisible(true);
				});
		} catch (error) {
			setSuccess(false);
			setRequestMessage(error.message);
			console.log(error);
		}
	};

	const sendToLogin = () => {
		navigation.navigate('Login');
	};

	return (
		<SafeAreaView style={wrapper}>
			<KeyboardAvoidingWrapper>
				<View style={container}>
					<View style={{ marginVertical: 22 }}>
						<Text style={header}>Reset Password</Text>
						<Text style={description}>
							Enter your new password below to reset your password.
						</Text>
					</View>

					<InputField
						description="New Password"
						hint="Enter your new password"
						keyboardType="default"
						setValue={setNewPassword}
						error={newPasswordError}
						isPassword={true}
					/>
					<InputField
						description="Confirm Password"
						hint="Confirm your new password"
						keyboardType="default"
						setValue={setConfirmPassword}
						error={confirmPasswordError}
						isPassword={true}
					/>

					<Button
						title="Reset Password"
						filled={true}
						onPress={() => handlePasswordReset(newPassword, confirmPassword)}
						style={{
							marginTop: 18,
							marginBottom: 4,
						}}
					/>
					<VerificationModal
						successful={success}
						setModalVisible={setModalVisible}
						modalVisible={modalVisible}
						requestMessage={requstMessage}
						handler={sendToLogin}
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

export default ResetPassword;
