import { GOOGLE_IOS_API_KEY } from '@env';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
	Dimensions,
	Keyboard,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, {
	MapCallout,
	MarkerAnimated,
	Polyline,
} from 'react-native-maps';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import SlidingUpPanel from 'rn-sliding-up-panel';
import Button from '../../components/Button';
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
	const [step, setStep] = useState('selecting');
	const [canPanelDrag, setCanPanelDrag] = useState(true);

	// date picker
	const [arrivalTime, setArrivalTime] = useState(new Date());
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

	const showDatePicker = () => {
		setCanPanelDrag(false);
		setDatePickerVisibility(true);
	};

	const hideDatePicker = () => {
		setCanPanelDrag(true);
		setDatePickerVisibility(false);
	};

	const options = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	};

	const handleConfirm = (date) => {
		setArrivalTime(date);
		hideDatePicker();
	};

	// panel

	const isAndroid = Platform.OS == 'android';
	const screenHeight = Dimensions.get('window').height;

	const [panelMaxHeight, setPanelMaxHeight] = useState(screenHeight / 3.5);
	const [panelMinHeight, setPanelMinHeight] = useState(0);

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

	const findZoomCoords = (coords) => {
		let minLat, maxLat, minLng, maxLng;

		// init values
		((coord) => {
			minLat = coord.latitude;
			maxLat = coord.latitude;
			minLng = coord.longitude;
			maxLng = coord.longitude;
		})(coords[0]);

		// calculate values
		coords.map((coord, index) => {
			minLat = Math.min(minLat, coord.latitude);
			maxLat = Math.max(maxLat, coord.latitude);
			minLng = Math.min(minLng, coord.longitude);
			maxLng = Math.max(maxLng, coord.longitude);
		});

		const midLat = (minLat + maxLat) / 2;
		const midLng = (minLng + maxLng) / 2;

		const deltaLat = maxLat - minLat + 0.01;
		const deltaLng = maxLng - minLng + 0.01;

		return {
			latitude: midLat,
			latitudeDelta: deltaLat,
			longitude: midLng,
			longitudeDelta: deltaLng,
		};
	};

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
					mapRef.current.animateToRegion(findZoomCoords(coords), 1000);
				});
		} catch (error) {
			console.log(error);
		}
	};

	const panelHidden = (value) => {
		if (value === 0 && currentPlace && step !== 'travelling') {
			setStep('selecting');
			setArrivalTime(new Date());
			setCurrentPlace(null);
			setPanelMaxHeight(screenHeight / 3.5);
		}
	};

	const locationPanelContent = () => {
		return (
			<View style={styles.panelContainer}>
				<Text style={styles.locatioName}>{currentPlace?.name}</Text>
				<Text style={styles.locationAddress}>
					{currentPlace?.formatted_address}
				</Text>
				<View style={styles.panelSeparator} />
				<View style={{ marginTop: 30, marginHorizontal: 20 }}>
					<Button
						title="Use This Location"
						filled={true}
						color={COLORS.primary}
						onPress={() => {
							setStep('settime');
							setPanelMaxHeight(screenHeight / 2.3);
							this._panel.show(screenHeight / 2.3);
						}}
					/>
				</View>
			</View>
		);
	};

	const setTimePanelContent = () => {
		return (
			<View style={styles.panelContainer}>
				<Text style={styles.locatioName}>{currentPlace?.name}</Text>
				<Text style={styles.locationAddress}>
					{currentPlace?.formatted_address}
				</Text>
				<View style={styles.panelSeparator} />
				<Text
					style={[styles.locatioName, { paddingTop: 30, textAlign: 'center' }]}>
					Arrival Time
				</Text>
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<View
						style={{
							borderWidth: 2,
							borderRadius: 10,
							paddingHorizontal: 20,
						}}>
						<TouchableOpacity onPress={showDatePicker}>
							<Text style={styles.arrivalTime}>
								{arrivalTime.toLocaleDateString('en-US', options)}
							</Text>
						</TouchableOpacity>
						<DateTimePickerModal
							date={arrivalTime}
							isVisible={isDatePickerVisible}
							mode="datetime"
							onConfirm={handleConfirm}
							onCancel={hideDatePicker}
							buttonTextColorIOS={COLORS.black}
							textColor={COLORS.black}
							minimumDate={new Date()}
						/>
					</View>
				</View>
				<View style={{ marginTop: 30, marginHorizontal: 20 }}>
					<Button
						title="Submit"
						filled={true}
						color={COLORS.primary}
						onPress={() => {
							setStep('travelling');
							getRoute(userLocation, currentPlace?.geometry?.location);
							setPanelMinHeight(screenHeight / 4);
							setPanelMaxHeight(screenHeight / 1.5);
							this._panel.show(screenHeight / 4);
						}}
					/>
				</View>
			</View>
		);
	};

	const setTravellingPanelContent = () => {};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="dark-content" />
			<MapView
				onPress={() => Keyboard.dismiss()}
				ref={mapRef}
				style={styles.map}
				showsCompass={false}
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
						this._panel.show();
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
			<SlidingUpPanel
				ref={(c) => (this._panel = c)}
				draggableRange={{ top: panelMaxHeight, bottom: panelMinHeight }}
				snappingPoints={[panelMinHeight, panelMaxHeight]}
				backdropOpacity={0}
				onMomentumDragEnd={(value) => panelHidden(value)}
				allowDragging={canPanelDrag}>
				<View style={styles.panel}>
					<View style={{ alignItems: 'center' }}>
						<View style={styles.panelHandle} />
					</View>
					{step === 'selecting' && locationPanelContent()}
					{step === 'settime' && setTimePanelContent()}
					{step === 'travelling' && setTravellingPanelContent()}
				</View>
			</SlidingUpPanel>
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
	panel: {
		flex: 1,
		backgroundColor: 'white',
		justifyContent: 'flex-start',
		borderRadius: 16,
	},
	panelHandle: {
		width: 150,
		height: 6,
		borderRadius: 10,
		backgroundColor: COLORS.grey,
		marginTop: 10,
		opacity: 0.6,
	},
	panelSeparator: {
		height: 1,
		backgroundColor: COLORS.grey,
		marginTop: 10,
		opacity: 0.6,
	},
	locatioName: {
		fontSize: 25,
		paddingBottom: 10,
		fontWeight: 'bold',
		color: COLORS.black,
		textAlign: 'left',
	},
	locationAddress: {
		fontSize: 15,
		color: COLORS.black,
		textAlign: 'left',
	},
	panelContainer: {
		marginHorizontal: 20,
		marginTop: 20,
	},
	arrivalTime: {
		fontSize: 20,
		color: COLORS.black,
		textAlign: 'center',
		paddingVertical: 10,
	},
});

export default Map;
