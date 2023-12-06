import { GOOGLE_IOS_API_KEY } from '@env';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
	Keyboard,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, {
	MapCallout,
	MarkerAnimated,
	Polyline,
} from 'react-native-maps';
import CurrentLocationIcon from '../../components/CurrentLocationIcon';
import ActionButton from '../../components/FloatingActionButton';
import FloatingActionMenu from '../../components/FloatingActionMenu';
import { Icons } from '../../components/Icons';
import COLORS from '../../constants/colors';

const Map = () => {
	const mapRef = useRef(null);
	const latDelta = 0.008;
	const longDelta = 0.008;
	const polyline = require('@mapbox/polyline');

	const [pin, setPin] = useState({
		latitude: 1.29027,
		latitudeDelta: latDelta,
		longitude: 103.851959,
		longitudeDelta: longDelta,
	});
	const [currentPlace, setCurrentPlace] = useState(null);
	const [userLocation, setUserLocation] = useState(null);
	const [routeCoords, setRouteCoords] = useState(null);

	const isAndroid = Platform.OS == 'android';

	useEffect(() => {
		(async () => {
			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				console.log('Permission to access location was denied');
				return;
			}

			let location = await Location.getCurrentPositionAsync({
				accuracy: isAndroid ? Location.Accuracy.Low : Location.Accuracy.Lowest,
			});
			setUserLocation(location);

			moveToLocation(location?.coords?.latitude, location?.coords?.longitude);
		})();
	}, []);

	const moveToLocation = (lat, long) => {
		mapRef.current.animateToRegion(
			{
				latitude: lat,
				latitudeDelta: latDelta,
				longitude: long,
				longitudeDelta: longDelta,
			},
			1000
		);
	};

	const getUserLocation = async () => {
		let { status } = await Location.requestForegroundPermissionsAsync();

		if (status !== 'granted') {
			console.log('Permission to access location was denied');
			return;
		}

		const location = await Location.getCurrentPositionAsync({
			accuracy: isAndroid ? Location.Accuracy.Low : Location.Accuracy.Lowest,
		});
		setUserLocation(location);

		moveToLocation(
			userLocation?.coords?.latitude,
			userLocation?.coords?.longitude
		);
	};

	const getRoute = async (originLoc, destinationLoc) => {
		const url = 'https://maps.googleapis.com/maps/api/directions/json?';
		try {
			await axios
				.get(url, {
					params: {
						destination: `${destinationLoc.lat},${destinationLoc.lng}`,
						origin: `${originLoc.coords.latitude},${originLoc.coords.longitude}`,
						key: GOOGLE_IOS_API_KEY,
					},
				})
				.then((response) => {
					if (response.data.status !== 'OK') {
						throw new Error('No route found');
					}
					const points = polyline.decode(
						response.data?.routes[0]?.overview_polyline?.points
					);
					const coords = points.map((point) => {
						return {
							latitude: point[0],
							longitude: point[1],
						};
					});
					coords.unshift({
						latitude: originLoc.coords.latitude,
						longitude: originLoc.coords.longitude,
					});
					coords.push({
						latitude: destinationLoc.lat,
						longitude: destinationLoc.lng,
					});
					setRouteCoords(coords);
				});
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />
			<MapView
				onPress={() => Keyboard.dismiss()}
				ref={mapRef}
				style={styles.map}
				initialRegion={{
					latitude: 1.29027,
					latitudeDelta: latDelta,
					longitude: 103.851959,
					longitudeDelta: longDelta,
				}}>
				{routeCoords && (
					<Polyline
						coordinates={routeCoords}
						strokeColor={COLORS.primary}
						strokeWidth={2}
						lineDashPattern={[1]}
					/>
				)}
				{currentPlace && (
					<MarkerAnimated
						coordinate={pin}
						onPress={Keyboard.dismiss}
						onCalloutPress={() => {
							Keyboard.dismiss();
						}}>
						<MapCallout>
							<Text>{currentPlace?.name}</Text>
						</MapCallout>
					</MarkerAnimated>
				)}
				<MarkerAnimated
					coordinate={userLocation?.coords}
					onPress={Keyboard.dismiss}
					onCalloutPress={() => {
						Keyboard.dismiss();
					}}>
					<CurrentLocationIcon />
					<MapCallout>
						<View>
							<Text style={{ width: 90 }}>Your Location</Text>
						</View>
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
						setCurrentPlace(details);
						moveToLocation(
							details?.geometry?.location?.lat,
							details?.geometry?.location?.lng
						);
						getRoute(userLocation, details?.geometry?.location);
					}}
					query={{
						key: GOOGLE_IOS_API_KEY,
						language: 'en',
						components: 'country:sg',
					}}
					enablePoweredByContainer={false}
					fetchDetails={true}
				/>
				<View style={{ alignItems: 'flex-end', marginVertical: 10 }}>
					<ActionButton
						iconType={Icons.MaterialIcons}
						iconName="my-location"
						onPress={getUserLocation}
						buttonStyle={{ backgroundColor: COLORS.white }}
						iconColor={COLORS.black}
						fabSize={40}
						underlayColor={COLORS.gray}
					/>
				</View>
			</SafeAreaView>
			<FloatingActionMenu />
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
