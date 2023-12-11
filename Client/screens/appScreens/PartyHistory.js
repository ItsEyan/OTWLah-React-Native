import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import {
	collectionGroup,
	deleteDoc,
	doc,
	getDocs,
	orderBy,
	query,
	where,
} from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
	Alert,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import SectionList from 'react-native-tabs-section-list';
import { io } from 'socket.io-client';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Button from '../../components/Button';
import COLORS from '../../constants/colors';
import { baseAPIUrl } from '../../constants/sharedVariables';
import { SignInContext } from '../../contexts/authContext';

const PartyHistory = () => {
	const { signedIn } = useContext(SignInContext);
	const db = FIREBASE_DB;
	const [parties, setParties] = useState([]);
	const [fetching, setFetching] = useState(false);
	const [error, setError] = useState(false);
	const route = useRoute();
	const navigation = useNavigation();
	const userLocation = route.params.userLocation;

	const socket = io(baseAPIUrl, {
		query: {
			userId: signedIn.userUID,
		},
	});

	let row = [];
	let prevOpenedRow;

	useEffect(() => {
		getParties();
	}, []);

	const displayOptions = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: false,
	};

	const getParties = async () => {
		const q = query(
			collectionGroup(db, 'members'),
			where('uid', '==', signedIn.userUID),
			orderBy('arrivalTime')
		);
		const querySnapshot = await getDocs(q);
		const createdParties = [];
		const joinedParties = [];
		querySnapshot.forEach((doc) => {
			if (doc.data().isLeader) {
				createdParties.push({
					name: doc.data().destination.name,
					address: doc.data().destination.address,
					arrivalTime: doc.data().arrivalTime,
					partyID: doc.data().partyID,
					departureTime: doc.data().departureTime,
				});
			} else {
				joinedParties.push({
					name: doc.data().destination.name,
					address: doc.data().destination.address,
					arrivalTime: doc.data().arrivalTime,
					partyID: doc.data().partyID,
					departureTime: doc.data().departureTime,
				});
			}
		});
		if (createdParties.length === 0 && joinedParties.length === 0) {
			setParties([
				{
					title: 'No Parties',
					data: [],
				},
			]);
		} else if (createdParties.length === 0) {
			setParties([
				{
					title: 'Joined Parties',
					data: joinedParties,
				},
			]);
		} else if (joinedParties.length === 0) {
			setParties([
				{
					title: 'Created Parties',
					data: createdParties,
				},
			]);
		} else {
			setParties([
				{
					title: 'Created Parties',
					data: createdParties,
				},
				{
					title: 'Joined Parties',
					data: joinedParties,
				},
			]);
		}
	};

	const showConfirmDialog = (item) => {
		return Alert.alert(
			`Leave Party ${item.partyID}`,
			'Are you sure you want to leave this party?',
			[
				{
					text: 'Yes',
					onPress: () => {
						leaveParty(item);
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

	const leaveParty = async (item) => {
		try {
			await deleteDoc(
				doc(db, 'parties', item.partyID.toString(), 'members', signedIn.userUID)
			).then(() => {
				getParties();
				socket.emit('leaveParty', item.partyID.toString(), signedIn.userUID);
			});
		} catch (error) {
			console.log(error);
		}
	};

	const closeRow = (index) => {
		if (prevOpenedRow && prevOpenedRow !== row[index]) {
			prevOpenedRow.close();
		}
		prevOpenedRow = row[index];
	};

	const renderItem = ({ item, index }) => {
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
						title="Leave"
						style={{ height: '100%', borderRadius: 0 }}
					/>
				</View>
			);
		};

		const connectToParty = async (partyID) => {
			setFetching(true);
			try {
				const response = await axios.get(`${baseAPIUrl}/joinParty`, {
					params: {
						partyID: partyID,
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
						partyID: partyID,
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
			<TouchableOpacity
				onPress={() => connectToParty(item.partyID)}
				disabled={fetching}>
				<Swipeable
					renderRightActions={(progress, dragX) => renderRightView()}
					onSwipeableOpen={() => closeRow(item.partyID)}
					ref={(ref) => (row[item.partyID] = ref)}
					rightOpenValue={-100}>
					<View style={styles.itemContainer}>
						<View style={styles.itemRow}>
							<Text
								style={[
									styles.itemTitle,
									{ fontWeight: 'bold', paddingBottom: 5 },
								]}>{`Party ID: ${item.partyID}`}</Text>
							<Text
								style={[
									styles.itemPrice,
									{
										color:
											item.departureTime <= Date.now()
												? COLORS.errorRed
												: '#131313',
									},
								]}>
								{new Date(item.arrivalTime).toLocaleTimeString(
									'en-GB',
									displayOptions
								)}
							</Text>
						</View>
						<Text style={styles.itemTitle}>{item.name}</Text>

						<Text style={styles.itemDescription}>{item.address}</Text>
					</View>
				</Swipeable>
			</TouchableOpacity>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
			<View>
				<Text
					style={{
						fontWeight: 'bold',
						textAlign: 'center',
						padding: 10,
						fontSize: 20,
					}}>
					Party History
				</Text>
			</View>
			<View style={styles.container}>
				<SectionList
					sections={parties}
					keyExtractor={(item, index) => index.toString()}
					stickySectionHeadersEnabled={false}
					scrollToLocationOffset={0}
					tabBarStyle={styles.tabBar}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
					renderTab={({ title, isActive }) => (
						<View
							style={[
								styles.tabContainer,
								{ borderBottomWidth: isActive ? 1 : 0 },
							]}>
							<Text
								style={[
									styles.tabText,
									{ color: isActive ? '#090909' : '#9e9e9e' },
								]}>
								{title}
							</Text>
						</View>
					)}
					renderSectionHeader={({ section }) => (
						<View>
							<View style={styles.sectionHeaderContainer} />
							<Text style={styles.sectionHeaderText}>{section.title}</Text>
							<View style={styles.titleSeparator} />
						</View>
					)}
					renderItem={(item) => renderItem(item)}
				/>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f6f6f6',
	},
	tabBar: {
		backgroundColor: '#fff',
		borderBottomColor: '#f4f4f4',
		borderBottomWidth: 1,
	},
	tabContainer: {
		borderBottomColor: '#090909',
	},
	tabText: {
		padding: 15,
		color: '#9e9e9e',
		fontSize: 18,
		fontWeight: '500',
	},
	separator: {
		height: 0.5,
		width: '96%',
		alignSelf: 'flex-end',
		backgroundColor: '#eaeaea',
	},
	titleSeparator: {
		height: 1,
		width: '100%',
		alignSelf: 'flex-end',
		backgroundColor: COLORS.gray,
	},
	sectionHeaderContainer: {
		height: 10,
		backgroundColor: '#f6f6f6',
		borderTopColor: '#f4f4f4',
		borderTopWidth: 1,
		borderBottomColor: '#f4f4f4',
		borderBottomWidth: 1,
	},
	sectionHeaderText: {
		color: '#010101',
		backgroundColor: '#fff',
		fontSize: 23,
		fontWeight: 'bold',
		paddingTop: 25,
		paddingBottom: 20,
		paddingHorizontal: 15,
	},
	itemContainer: {
		paddingVertical: 20,
		paddingHorizontal: 15,
		backgroundColor: '#fff',
	},
	itemTitle: {
		flex: 1,
		fontSize: 20,
		color: '#131313',
	},
	itemPrice: {
		fontSize: 18,
		color: '#131313',
	},
	itemDescription: {
		marginTop: 10,
		color: '#b6b6b6',
		fontSize: 16,
	},
	itemRow: {
		flexDirection: 'row',
	},
});

export default PartyHistory;
