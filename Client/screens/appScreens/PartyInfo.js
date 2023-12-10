import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
	SafeAreaView,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Button from '../../components/Button';
import Icon, { Icons } from '../../components/Icons';
import COLORS from '../../constants/colors';

const PartyInfo = () => {
	let logoImage = require('../../assets/OTWLahLogo.png');
	const navigation = useNavigation();
	const route = useRoute();
	const partyID = route.params.partyID;
	const destination = route.params.destination;

	const code1 = Math.floor(partyID / 1000);
	const code2 = Math.floor((partyID % 1000) / 100);
	const code3 = Math.floor((partyID % 100) / 10);
	const code4 = Math.floor(partyID % 10);

	const onShare = async () => {
		try {
			const result = await Share.share({
				message: 'Share this link with your friends to join your party!',
				url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			});
			if (result.action === Share.sharedAction) {
				if (result.activityType) {
					// shared with activity type of result.activityType
				} else {
					// shared
				}
			} else if (result.action === Share.dismissedAction) {
				// dismissed
			}
		} catch (error) {
			Alert.alert(error.message);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View
				style={{
					position: 'absolute',
					paddingTop: 75,
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
			<Text style={styles.header}>Party QR</Text>
			<View style={[styles.container, styles.shadow]}>
				<LinearGradient
					colors={[COLORS.white, COLORS.white]}
					start={{ x: 0, y: 0.7 }}
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						borderRadius: 20,
						borderBlockColor: COLORS.black,
						padding: 20,
					}}>
					<QRCode
						value={partyID.toString()}
						logo={logoImage}
						logoSize={50}
						size={250}
					/>
				</LinearGradient>
			</View>
			<Text
				style={{
					fontSize: 30,
					textAlign: 'center',
					paddingTop: 20,
				}}>
				Party ID
			</Text>
			<View
				style={[
					styles.container,
					{ justifyContent: 'space-evenly', marginTop: 20 },
				]}>
				<View style={{ flexDirection: 'row' }}>
					<View style={[styles.codeBox, styles.shadow]}>
						<Text style={styles.code}>{code1}</Text>
					</View>
					<View style={[styles.codeBox, styles.shadow]}>
						<Text style={styles.code}>{code2}</Text>
					</View>
					<View style={[styles.codeBox, styles.shadow]}>
						<Text style={styles.code}>{code3}</Text>
					</View>
					<View style={[styles.codeBox, styles.shadow]}>
						<Text style={styles.code}>{code4}</Text>
					</View>
				</View>
			</View>
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-evenly',
					marginTop: 20,
				}}>
				<Button
					title="Share"
					filled={true}
					color={COLORS.darkBlue}
					onPress={() => {
						onShare();
					}}
					icon={{
						iconName: 'ios-share',
						iconType: Icons.MaterialIcons,
						iconSize: 24,
						iconColor: COLORS.white,
						iconStyle: {
							right: 5,
							bottom: 3,
						},
					}}
					style={{
						marginTop: 20,
						marginHorizontal: 20,
						paddingVertical: 15,
						paddingHorizontal: 40,
					}}
				/>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	header: {
		fontSize: 40,
		fontWeight: 'bold',
		color: COLORS.black,
		textAlign: 'center',
		marginTop: 20,
		marginBottom: 20,
	},
	shadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 8,
		shadowOpacity: 0.5,
	},
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	codeBox: {
		marginHorizontal: 5,
		paddingVertical: 20,
		paddingHorizontal: 20,
		borderRadius: 10,
		backgroundColor: COLORS.white,
	},
	code: {
		fontSize: 30,
		fontWeight: 'bold',
		color: COLORS.black,
		textAlign: 'center',
	},
});

export default PartyInfo;
