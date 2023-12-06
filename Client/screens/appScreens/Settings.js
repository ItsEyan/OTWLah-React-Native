import { getAuth, signOut } from 'firebase/auth';
import React, { useState } from 'react';
import {
	Alert,
	Image,
	SafeAreaView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import Button from '../../components/Button';
import COLORS from '../../constants/colors';

const Settings = () => {
	const [switchValue, setSwitchValue] = useState(false);
	const onValueChange = (value) => {
		setSwitchValue(value);
	};

	const auth = getAuth();
	const logOut = () => {
		signOut(auth)
			.then(() => {
				console.log('User signed out');
			})
			.catch((error) => {
				console.log(error);
			});
	};

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
				<View
					style={{
						borderBottomWidth: 1,
						backgroundColor: '#f7f7f8',
						borderColor: '#c8c7cc',
					}}>
					<Text
						style={{
							alignSelf: 'center',
							marginTop: 10,
							marginBottom: 10,
							fontWeight: 'bold',
							fontSize: 20,
						}}>
						Settings
					</Text>
				</View>
				<View style={{ backgroundColor: '#EFEFF4', flex: 1 }}>
					<SettingsList borderColor="#c8c7cc" defaultItemSize={50}>
						<SettingsList.Header headerStyle={{ marginTop: 15 }} />
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/airplane.png')}
								/>
							}
							hasSwitch={true}
							switchState={switchValue}
							switchOnValueChange={onValueChange}
							hasNavArrow={false}
							title="Airplane Mode"
						/>
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/wifi.png')}
								/>
							}
							title="Wi-Fi"
							titleInfo="Bill Wi The Science Fi"
							titleInfoStyle={styles.titleInfoStyle}
							onPress={() => Alert.alert('Route to Wifi Page')}
						/>
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/blutooth.png')}
								/>
							}
							title="Blutooth"
							titleInfo="Off"
							titleInfoStyle={styles.titleInfoStyle}
							onPress={() => Alert.alert('Route to Blutooth Page')}
						/>
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/cellular.png')}
								/>
							}
							title="Cellular"
							onPress={() => Alert.alert('Route To Cellular Page')}
						/>
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/hotspot.png')}
								/>
							}
							title="Personal Hotspot"
							titleInfo="Off"
							titleInfoStyle={styles.titleInfoStyle}
							onPress={() => Alert.alert('Route To Hotspot Page')}
						/>
						<SettingsList.Header headerStyle={{ marginTop: 15 }} />
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/notifications.png')}
								/>
							}
							title="Notifications"
							onPress={() => Alert.alert('Route To Notifications Page')}
						/>
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/control.png')}
								/>
							}
							title="Control Center"
							onPress={() => Alert.alert('Route To Control Center Page')}
						/>
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/dnd.png')}
								/>
							}
							title="Do Not Disturb"
							onPress={() => Alert.alert('Route To Do Not Disturb Page')}
						/>
						<SettingsList.Header headerStyle={{ marginTop: 15 }} />
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/general.png')}
								/>
							}
							title="General"
							onPress={() => Alert.alert('Route To General Page')}
						/>
						<SettingsList.Item
							icon={
								<Image
									style={styles.imageStyle}
									source={require('../../assets/images/display.png')}
								/>
							}
							title="Display & Brightness"
							onPress={() => Alert.alert('Route To Display Page')}
						/>
						<SettingsList.Header headerStyle={{ marginTop: 15 }} />
						<View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
							<Button
								title="Log Out"
								filled={true}
								color={COLORS.black}
								onPress={logOut}
								style={{
									marginTop: 30,
									marginBottom: 4,
									justifyContent: 'center',
									alignItems: 'center',
								}}
							/>
						</View>
					</SettingsList>
				</View>
			</View>
		</SafeAreaView>
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
		color: '#8e8e93',
		alignSelf: 'center',
		marginRight: 10,
		fontWeight: 'bold',
	},
});

export default Settings;
