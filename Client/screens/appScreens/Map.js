import { GOOGLE_IOS_API_KEY } from '@env';
import React, { useRef } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { MapCallout, MarkerAnimated } from 'react-native-maps';
import Fab from '../../components/Fab';
import COLORS from '../../constants/colors';

const Map = () => {
	const mapRef = useRef(null);
	const latDelta = 0.2;
	const longDelta = 0.2;

	const [pin, setPin] = React.useState({
		latitude: 1.29027,
		latitudeDelta: 0.0922,
		longitude: 103.851959,
		longitudeDelta: 0.0421,
	});

	const moveToLocation = (lat, long) => {
		mapRef.current.animateToRegion(
			{
				latitude: lat,
				latitudeDelta: latDelta,
				longitude: long,
				longitudeDelta: longDelta,
			},
			1500
		);
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />
			<MapView
				ref={mapRef}
				style={styles.map}
				initialRegion={{
					latitude: 1.29027,
					latitudeDelta: latDelta,
					longitude: 103.851959,
					longitudeDelta: longDelta,
				}}>
				<MarkerAnimated coordinate={pin}>
					<MapCallout>
						<Text>hi</Text>
					</MapCallout>
				</MarkerAnimated>
			</MapView>
			<SafeAreaView style={styles.searchContainer}>
				<GooglePlacesAutocomplete
					placeholder="Search for a location..."
					onPress={(data, details = null) => {
						setPin({
							latitude: details?.geometry?.location?.lat,
							latitudeDelta: latDelta,
							longitude: details?.geometry?.location?.lng,
							longitudeDelta: longDelta,
						});
						moveToLocation(
							details?.geometry?.location?.lat,
							details?.geometry?.location?.lng
						);
					}}
					query={{
						key: GOOGLE_IOS_API_KEY,
						language: 'en',
						components: 'country:sg',
					}}
					enablePoweredByContainer={false}
					fetchDetails={true}
				/>
			</SafeAreaView>
			<Fab />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	searchContainer: {
		position: 'absolute',
		marginHorizontal: 30,
		justifyContent: 'center',
		width: '84%',
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
