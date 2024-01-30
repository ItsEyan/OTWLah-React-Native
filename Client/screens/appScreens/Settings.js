import {
	getDownloadURL,
	getStorage,
	ref,
	uploadBytesResumable,
} from '@firebase/storage';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from '@rneui/themed';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import {
	collectionGroup,
	getDocs,
	orderBy,
	query,
	updateDoc,
	where,
} from 'firebase/firestore';
import React, { Fragment, useContext, useState } from 'react';
import {
	Alert,
	SafeAreaView,
	ScrollView,
	SectionList,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Icon, { Icons } from '../../components/Icons';
import Uploading from '../../components/Uploading';
import COLORS from '../../constants/colors';
import { baseAPIUrl } from '../../constants/sharedVariables';
import { SignInContext } from '../../contexts/authContext';

const Settings = () => {
	const [switchValue, setSwitchValue] = useState([
		{
			index: 4,
			title: 'Toggle Notifications',
			toggle: true,
		},
	]);
	const [image, setImage] = useState(null);
	const [progress, setProgress] = useState(0);
	const [canceled, setCanceled] = useState(false);

	const auth = getAuth();
	const storage = getStorage();
	const db = FIREBASE_DB;
	const navigation = useNavigation();
	const { signedIn, dispatchSignedIn } = useContext(SignInContext);

	function onValueChange(value, index) {
		const newValue = [...switchValue];
		newValue[index].toggle = value;
		setSwitchValue(newValue);
	}

	const showConfirmDialog = () => {
		return Alert.alert(`Sign Out`, `Are you sure you want to sign out?`, [
			{
				text: 'Sign Out',
				onPress: () => {
					logOut();
				},
			},
			{
				text: 'Cancel',
			},
		]);
	};

	const logOut = () => {
		signOut(auth)
			.then(() => {
				console.log('User signed out');
			})
			.catch((error) => {
				console.log(error);
			});
	};

	const selectProfilePicture = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [3, 4],
			quality: 1,
		});

		if (!result.canceled) {
			setImage(result.assets[0].uri);
			uploadImage(result.assets[0].uri, 'image');
		}
	};

	async function uploadImage(uri, fileType) {
		const response = await fetch(uri);
		const blob = await response.blob();

		const storageRef = ref(storage, `profilePictures/${signedIn.userUID}`);
		const uploadTask = uploadBytesResumable(storageRef, blob);
		try {
			uploadTask.on(
				'state_changed',
				(snapshot) => {
					const progress =
						(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					console.log('Upload is ' + progress + '% done');
					setProgress(progress.toFixed());
					if (canceled) {
						uploadTask.cancel();
						setCanceled(false);
						setImage(null);
						throw new Error('Upload canceled');
					}
				},
				(error) => {
					console.log(error);
				},
				() => {
					getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
						await updateProfile(auth.currentUser, {
							photoURL: downloadURL,
						});
						dispatchSignedIn({
							type: 'NEW_USER',
							payload: {
								userToken: 'signed-in',
								displayName: signedIn.userDisplayName,
								photoURL: downloadURL,
								uid: auth.currentUser.uid,
								email: auth.currentUser.email,
							},
						});
						const q = query(
							collectionGroup(db, 'members'),
							where('uid', '==', signedIn.userUID),
							orderBy('arrivalTime')
						);
						const querySnapshot = await getDocs(q);
						querySnapshot.forEach((doc) => {
							updateDoc(doc.ref, {
								avatar: downloadURL,
							});
						});
						setImage(null);
					});
				}
			);
		} catch (error) {
			console.log(error);
		}
	}

	const changePassword = () => {
		const url = `${baseAPIUrl}/sendResetPasswordEmail`;
		axios.get(url, {
			params: {
				email: signedIn.userEmail,
				username: signedIn.userDisplayName,
			},
		});
		navigation.navigate('OTPVerification', {
			email: signedIn.userEmail,
			username: signedIn.userDisplayName,
			password: null,
			isResetPassword: true,
		});
	};

	const settingsData = [
		{
			title: 'Account',
			data: [
				{
					title: 'Username',
					iconType: Icons.Feather,
					iconName: 'user',
					details: signedIn.userDisplayName,
				},
				{
					title: 'Email',
					iconType: Icons.MaterialCommunityIcons,
					iconName: 'email',
					onPress: () => Alert.alert('Email'),
					chevron: true,
					details: signedIn.userEmail,
				},
				{
					title: 'Privacy',
					iconType: Icons.MaterialIcons,
					iconName: 'security',
					onPress: () => Alert.alert('Privacy'),
					chevron: true,
				},
				{
					title: 'Sign Out',
					iconType: Icons.MaterialIcons,
					iconName: 'logout',
					onPress: showConfirmDialog,
					chevron: true,
				},
			],
		},
		{
			title: 'Preferences',
			data: [
				{
					title: 'Notifications',
					iconType: Icons.MaterialIcons,
					iconName: 'notifications-active',
					switch: true,
				},
			],
		},
		{
			title: 'Security',
			data: [
				{
					title: 'Change Password',
					iconType: Icons.MaterialCommunityIcons,
					iconName: 'lock-reset',
					onPress: changePassword,
					chevron: true,
				},
			],
		},
	];

	const renderItem = (props) => {
		const isFirstElement = props.index === 0;
		const isLastElement = props.index === props.section.data.length - 1;
		const topRadius = isFirstElement ? 10 : 0;
		const bottomRadius = isLastElement ? 10 : 0;
		const onPress = props.item.onPress ? props.item.onPress : () => {};
		const isDisabled = props.item.onPress === undefined;

		return (
			<TouchableOpacity onPress={onPress} disabled={isDisabled}>
				<View
					style={{
						borderTopLeftRadius: topRadius,
						borderTopRightRadius: topRadius,
						borderBottomLeftRadius: bottomRadius,
						borderBottomRightRadius: bottomRadius,
						backgroundColor: COLORS.white,
						paddingVertical: 10,
					}}>
					<View style={{ flexDirection: 'row' }}>
						<View
							style={{
								flex: 1,
								justifyContent: 'flex-start',
								flexDirection: 'row',
								paddingLeft: 17,
							}}>
							<Icon
								type={props.item.iconType}
								name={props.item.iconName}
								color={COLORS.darkGray}
							/>
							<Text style={styles.titleInfoStyle}>{props.item.title}</Text>
						</View>
						<View
							style={{
								flex: 1,
								justifyContent: 'flex-end',
								alignItems: 'center',
								flexDirection: 'row',
								paddingRight: 10,
							}}>
							{props.item.details && (
								<Text
									numberOfLines={1}
									style={{
										color: COLORS.darkGray,
										fontSize: 16,
										paddingRight: 5,
									}}>
									{props.item.details}
								</Text>
							)}
							{props.item.chevron && (
								<Icon
									type={Icons.MaterialIcons}
									name="chevron-right"
									color={COLORS.darkGray}
								/>
							)}
							{props.item.switch && (
								<Switch
									value={switchValue[props.index].toggle}
									onValueChange={(value) => onValueChange(value, props.index)}
									style={{
										position: 'absolute',
										right: 10,
										transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }],
									}}
								/>
							)}
						</View>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	const renderSectionHeader = ({ section }) => {
		return (
			<View
				style={{
					paddingHorizontal: 20,
					paddingVertical: 10,
				}}>
				<Text style={{ fontSize: 16, color: COLORS.darkGray }}>
					{section.title}
				</Text>
			</View>
		);
	};

	const renderSectionFooter = () => {
		return (
			<View
				style={{
					paddingBottom: 30,
				}}></View>
		);
	};

	const itemSeparatorComponent = () => {
		return (
			<View
				style={{
					backgroundColor: COLORS.lightGray,
					height: 0.7,
				}}
			/>
		);
	};

	return (
		<Fragment>
			<SafeAreaView style={{ flex: 0, backgroundColor: COLORS.white }} />
			<SafeAreaView style={{ flex: 1, backgroundColor: COLORS.settingsGray }}>
				{image && (
					<Uploading
						image={image}
						progress={progress}
						setCanceled={setCanceled}
					/>
				)}
				<View style={{ backgroundColor: COLORS.settingsGray, flex: 1 }}>
					<View
						style={{
							flexDirection: 'row',
							borderBottomWidth: 1,
							backgroundColor: COLORS.white,
							borderColor: '#c8c7cc',
							justifyContent: 'center',
							paddingBottom: 5,
						}}>
						<View
							style={{
								marginLeft: 10,
								marginTop: 7,
								position: 'absolute',
								left: 0,
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
						<View>
							<Text
								style={{
									textAlign: 'center',
									marginTop: 10,
									marginBottom: 10,
									fontWeight: 'bold',
									fontSize: 20,
								}}>
								Settings
							</Text>
						</View>
					</View>
					<ScrollView>
						<View style={{ flex: 1, alignItems: 'center' }}>
							<View
								style={{
									alignItems: 'center',
									marginTop: 20,
									paddingTop: 20,
									backgroundColor: COLORS.white,
									borderRadius: 10,
									paddingBottom: 11,
									paddingHorizontal: 20,
									...styles.shadow,
								}}>
								<TouchableOpacity onPress={selectProfilePicture}>
									<Avatar
										rounded
										source={{
											uri: signedIn.userPhotoURL,
										}}
										containerStyle={{ backgroundColor: COLORS.gray }}
										size={100}
									/>
								</TouchableOpacity>
								<Text
									style={{ fontWeight: 'bold', fontSize: 23, marginTop: 8 }}>
									{signedIn.userDisplayName}
								</Text>
								<Text>{signedIn.userEmail}</Text>
							</View>
						</View>

						<SectionList
							sections={settingsData}
							style={{
								flex: 1,
								marginTop: 16,
								marginHorizontal: 20,
							}}
							scrollEnabled={false}
							ItemSeparatorComponent={itemSeparatorComponent}
							keyExtractor={(item, index) => index.toString()}
							renderItem={renderItem}
							renderSectionHeader={renderSectionHeader}
							renderSectionFooter={renderSectionFooter}
						/>
					</ScrollView>
				</View>
			</SafeAreaView>
		</Fragment>
	);
};

const styles = StyleSheet.create({
	imageStyle: {
		marginLeft: 15,
		alignSelf: 'center',
		height: 30,
		width: 30,
		resizeMode: 'center',
	},
	titleInfoStyle: {
		fontSize: 16,
		color: COLORS.black,
		alignSelf: 'center',
		marginLeft: 10,
	},
	shadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 5,
		shadowOpacity: 0.3,
	},
});

export default Settings;
