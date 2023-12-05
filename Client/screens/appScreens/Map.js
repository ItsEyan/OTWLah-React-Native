import { getAuth, signOut } from 'firebase/auth';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import Button from '../../components/Button';
import COLORS from '../../constants/colors';

const Map = () => {
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
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />
			<MapView style={styles.map}>
				<Button
					title="Log Out"
					filled={true}
					color={COLORS.black}
					onPress={logOut}
					style={{
						marginTop: 40,
						marginBottom: 4,
						justifyContent: 'center',
						alignItems: 'center',
					}}
				/>
			</MapView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	map: {
		width: '100%',
		height: '100%',
	},
	wrapper: {
		flex: 1,
		backgroundColor: COLORS.white,
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
});

export default Map;
