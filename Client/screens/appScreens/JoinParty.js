import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Button from '../../components/Button';
import CodeInputField from '../../components/CodeInputField';
import Icon, { Icons } from '../../components/Icons';
import KeyboardAvoidingWrapper from '../../components/KeyboardAvoidingWrapper';
import COLORS from '../../constants/colors';
import { baseAPIUrl } from '../../constants/sharedVariables';
import { SignInContext } from '../../contexts/authContext';

const JoinParty = () => {
	MAX_CODE_LENGTH = 4;
	const { signedIn } = useContext(SignInContext);
	const route = useRoute();
	const navigation = useNavigation();
	const userLocation = route.params.userLocation;

	const [code, setCode] = useState('');
	const [pinReady, setPinReady] = useState(false);
	const [error, setError] = useState(false);

	//verification button
	const [fetching, setFetching] = useState(false);

	const submitPartyID = async () => {
		setFetching(true);
		try {
			const response = await axios.get(`${baseAPIUrl}/joinParty`, {
				params: {
					partyID: parseInt(code),
					userID: signedIn.userUID,
					username: signedIn.userDisplayName,
					avatar: signedIn.userPhotoURL,
					lat: userLocation.coords.latitude,
					lng: userLocation.coords.longitude,
				},
			});
			if (response.data.status === 'SUCCESS') {
				setError(false);
				navigation.navigate('Map', {
					partyID: parseInt(code),
					destination: response.data.data.destination,
					arrivalTime: response.data.data.arrivalTime,
				});
			} else {
				console.log(response.data);
				setError(true);
			}
		} catch (error) {
			console.error(error);
			setError(true);
		}
		setFetching(false);
	};

	return (
		<SafeAreaView style={styles.wrapper}>
			<KeyboardAvoidingWrapper>
				<View
					style={{
						position: 'absolute',
						paddingTop: 30,
						paddingLeft: 30,
						zIndex: 1,
					}}>
					<TouchableOpacity onPress={() => navigation.goBack()}>
						<View>
							<Icon
								type={Icons.Ionicons}
								name="ios-chevron-back-outline"
								size={30}
								color={COLORS.black}
							/>
						</View>
					</TouchableOpacity>
				</View>
				<View style={styles.container}>
					<View style={styles.topHalf}>
						<LinearGradient
							colors={[COLORS.pink, COLORS.primary]}
							start={{ x: 0, y: 0.7 }}
							style={styles.iconBg}>
							<Image
								style={{ width: '100%', height: '100%', opacity: 1 }}
								source={require('../../assets/OTWLahLogo.png')}
							/>
						</LinearGradient>
					</View>
					<View style={[styles.topHalf, styles.bottomHalf]}>
						<Text style={styles.header}>Join Party</Text>
						<Text style={styles.infoText}>
							Enter the party code to join the party
						</Text>

						<CodeInputField
							setPinReady={setPinReady}
							code={code}
							setCode={setCode}
							maxLength={MAX_CODE_LENGTH}
						/>

						{fetching && (
							<View style={{ width: '50%' }}>
								<TouchableOpacity
									style={[
										styles.button,
										{
											backgroundColor: COLORS.primary,
											borderColor: COLORS.primary,
										},
									]}
									disabled={true}>
									<ActivityIndicator size="small" color={COLORS.white} />
								</TouchableOpacity>
							</View>
						)}

						{!fetching && pinReady && (
							<View style={{ width: '50%' }}>
								<Button
									title="Join Party"
									color={COLORS.primary}
									filled={true}
									onPress={submitPartyID}
								/>
							</View>
						)}

						{!fetching && !pinReady && (
							<View style={{ width: '50%' }}>
								<Button
									disabled={true}
									title="Join Party"
									color={COLORS.grey}
									filled={true}
								/>
							</View>
						)}

						<Text
							style={[
								styles.infoText,
								styles.emphasiseText,
								{
									color: error ? COLORS.errorRed : COLORS.white,
									paddingTop: 10,
								},
							]}>
							Invalid Party ID
						</Text>
						<View>
							<Text style={[styles.infoText, { paddingTop: 10 }]}>
								Don't have a party code?
							</Text>
							<Text style={[styles.infoText, { paddingBottom: 20 }]}>
								Scan a QR Code instead!
							</Text>
							<Button
								title="Scan QR"
								color={COLORS.darkBlue}
								filled={true}
								onPress={() => {
									navigation.navigate('QRCodeScanner', {
										userLocation: userLocation,
									});
								}}
							/>
						</View>
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
	},
	topHalf: {
		flex: 0.6,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 50,
	},
	bottomHalf: {
		flex: 1,
		paddingTop: 30,
		justifyContent: 'flex-start',
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
	button: {
		paddingVertical: 13,
		borderWidth: 2,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default JoinParty;
