import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { collectionGroup, getDocs, query } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
	Alert,
	FlatList,
	SafeAreaView,
	ScrollView,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import QRCode from 'react-native-qrcode-svg';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Button from '../../components/Button';
import Icon, { Icons } from '../../components/Icons';
import COLORS from '../../constants/colors';
import { SignInContext } from '../../contexts/authContext';
import { User } from '../../entity/User';

const PartyInfo = () => {
	let logoImage = require('../../assets/OTWLahLogo.png');
	const { signedIn } = useContext(SignInContext);
	const navigation = useNavigation();
	const route = useRoute();
	const partyID = route.params.partyID;
	const destination = route.params.destination;
	const [members, setMembers] = useState([]);
	const [isScrollable, setIsScrollable] = useState(true);
	const [isSwipeable, setIsSwipeable] = useState(false);
	const db = FIREBASE_DB;

	const code1 = Math.floor(partyID / 1000);
	const code2 = Math.floor((partyID % 1000) / 100);
	const code3 = Math.floor((partyID % 100) / 10);
	const code4 = Math.floor(partyID % 10);

	let row = [];
	let prevOpenedRow;

	const displayOptions = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: false,
	};

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

	useEffect(() => {
		getMembers();
	}, []);

	const closeRow = (index) => {
		if (prevOpenedRow && prevOpenedRow !== row[index]) {
			prevOpenedRow.close();
		}
		prevOpenedRow = row[index];
	};

	const showConfirmDialog = (item) => {
		return Alert.alert(
			`Leave Party ${item.partyID}`,
			'Are you sure you want to kick this member?',
			[
				{
					text: 'Yes',
					onPress: () => {
						console.log('Kicked member ' + item.name);
						prevOpenedRow.close();
					},
				},
				{
					text: 'No',
					onPress: () => {
						prevOpenedRow.close();
					},
				},
			]
		);
	};

	const getMembers = async () => {
		const q = query(collectionGroup(db, 'members'));
		const querySnapshot = await getDocs(q);
		let newMembers = [];
		querySnapshot.forEach((doc) => {
			if (doc.data().partyID == parseInt(partyID)) {
				newMembers.push(
					new User(
						doc.id,
						doc.data().username,
						doc.data().avatar,
						new Date(doc.data().departureTime),
						doc.data().currentLocation,
						doc.data().isLeader
					)
				);
				if (doc.id == signedIn.userUID && doc.data().isLeader) {
					setIsSwipeable(true);
				}
			}
		});
		setMembers(newMembers);
	};

	const renderItem = ({ item }) => {
		const renderRightView = () => {
			return (
				<View
					style={{
						margin: 0,
						alignContent: 'center',
						justifyContent: 'center',
						width: 70,
					}}>
					<Button
						color={COLORS.errorRed}
						filled={true}
						onPress={(e) => {
							showConfirmDialog(item);
						}}
						title="Kick"
						style={{ height: '100%', borderRadius: 0 }}
					/>
				</View>
			);
		};

		return (
			<Swipeable
				renderRightActions={(progress, dragX) => renderRightView()}
				onSwipeableOpen={() => closeRow(item.uid)}
				ref={(ref) => (row[item.uid] = ref)}
				rightOpenValue={-100}
				enabled={isSwipeable && !item.isLeader}>
				<View
					style={{
						backgroundColor: '#F4F4F4',
						padding: 10,
					}}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
						}}>
						<View style={{ paddingRight: 5 }}>
							<Avatar
								rounded
								source={{
									uri: item.avatar,
								}}
								containerStyle={{ backgroundColor: COLORS.gray }}
								size={30}
							/>
						</View>
						<View
							style={{
								flex: 1,
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}>
							<Text
								style={{ fontWeight: 'bold', fontSize: 25, textAlign: 'left' }}>
								{item.name}
							</Text>
							<Text style={{ fontSize: 20, textAlign: 'right' }}>
								{item.isLeader ? 'Leader' : 'Member'}
							</Text>
						</View>
					</View>
					<Text style={{ fontSize: 20 }}>
						{new Date(item.departureTime).toLocaleTimeString(
							'en-GB',
							displayOptions
						)}
					</Text>
				</View>
			</Swipeable>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<ScrollView scrollEnabled={isScrollable}>
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
				<View
					style={[
						styles.shadow,
						{
							marginHorizontal: 40,
							marginVertical: 30,
						},
					]}>
					<FlatList
						data={members}
						keyExtractor={(item) => item.name}
						renderItem={(item) => renderItem(item)}
						scrollEnabled={false}
						ItemSeparatorComponent={() => {
							return <View style={styles.panelSeparator} />;
						}}
					/>
				</View>
			</ScrollView>
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
	panelSeparator: {
		height: 1,
		backgroundColor: COLORS.grey,
		opacity: 0.6,
	},
});

export default PartyInfo;
