import { GOOGLE_IOS_API_KEY } from '@env';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
	Dimensions,
	FlatList,
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
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
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
	const [directions, setDirections] = useState(null);
	const [departureTime, setDepartureTime] = useState(null);
	const [timeLeft, setTimeLeft] = useState(null);

	const [canPanelDrag, setCanPanelDrag] = useState(true);

	// animations
	const [isSearchBarVisible, setSearchBarVisible] = useState(true);
	const [isCardViewVisible, setCardViewVisible] = useState(false);

	const searchBarFadeInOpacity = useSharedValue(0);
	const searchBarYValue = useSharedValue(0);
	const cardViewFadeInOpacity = useSharedValue(1);
	const locationYValue = useSharedValue(0);

	const locationMoveDown = () => {
		locationYValue.value = withTiming(0, {
			duration: 500,
			easing: Easing.linear,
		});
	};

	const locationMoveUp = () => {
		locationYValue.value = withTiming(
			-50,
			{
				duration: 300,
				easing: Easing.linear,
			},
			(isFinished) => {
				if (isFinished) locationYValue.value = 0;
			}
		);
	};

	const searchBarFadeIn = () => {
		setSearchBarVisible(true);
		searchBarFadeInOpacity.value = withTiming(1, {
			duration: 500,
			easing: Easing.linear,
		});
		searchBarYValue.value = withTiming(0, {
			duration: 500,
			easing: Easing.linear,
		});
	};

	const searchBarFadeOut = () => {
		searchBarFadeInOpacity.value = withTiming(
			0,
			{
				duration: 200,
				easing: Easing.linear,
			},
			(isFinished) => {
				if (isFinished) {
					runOnJS(setSearchBarVisible)(false);
				}
			}
		);
		searchBarYValue.value = withTiming(-50, {
			duration: 200,
			easing: Easing.linear,
		});
	};

	const cardViewFadeIn = () => {
		setCardViewVisible(true);
		cardViewFadeInOpacity.value = withTiming(1, {
			duration: 500,
			easing: Easing.linear,
		});
	};

	const cardViewFadeOut = () => {
		cardViewFadeInOpacity.value = withTiming(
			0,
			{
				duration: 200,
				easing: Easing.linear,
			},
			(isFinished) => {
				if (isFinished) runOnJS(setCardViewVisible)(false);
			}
		);
	};

	const searchBarAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: searchBarFadeInOpacity.value, // Use the value directly
			transform: [{ translateY: searchBarYValue.value }],
		};
	});

	const cardViewAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: cardViewFadeInOpacity.value, // Use the value directly
		};
	});

	const locationAnimationStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateY: locationYValue.value }],
		};
	});

	useEffect(() => {
		if (step === 'travelling') {
			searchBarFadeOut();
			locationMoveUp();
			cardViewFadeIn();
		} else {
			locationMoveDown();
			cardViewFadeOut();
			searchBarFadeIn();
		}
	}, [step]);

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

	const selectionOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
	};

	const displayOptions = {
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

	const [panelMaxHeight, setPanelMaxHeight] = useState(screenHeight / 3.1);
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

		const deltaLat = 1.1 * (maxLat - minLat);
		const deltaLng = 1.1 * (maxLng - minLng);

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
						mode: 'transit',
						arrival_time: Math.round(arrivalTime.getTime() / 1000),
						key: GOOGLE_IOS_API_KEY,
					},
				})
				.then((response) => {
					if (response.data.status !== 'OK') {
						throw new Error('No route found');
					}

					// get polyline
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

					// get directions
					setDirections(getDirections(response.data?.routes));

					// get departure time
					if (response.data?.routes[0]?.legs[0]?.departure_time) {
						setDepartureTime(
							new Date(
								response.data?.routes[0]?.legs[0]?.departure_time.value * 1000
							)
						);
					} else {
						setDepartureTime(
							getDepartureTime(
								response.data?.routes[0]?.legs[0]?.duration.value
							)
						);
					}

					mapRef.current.animateToRegion(findZoomCoords(coords), 1000);
				});
		} catch (error) {
			console.log(error);
		}
	};

	const getDepartureTime = (length) => {
		return new Date(arrivalTime.getTime() - length * 1000);
	};

	const getDirections = (routes) => {
		let directions = [];
		const steps = routes[0].legs[0].steps;
		steps.forEach((step) => {
			if (step.travel_mode === 'WALKING') {
				directions.push({
					type: 'Walk',
					instructions: step.html_instructions,
					duration: step.duration,
					distance: step.distance,
					polyline: step.polyline,
				});
			} else if (step.travel_mode === 'TRANSIT') {
				let transitDetails = step.transit_details;
				let departureName = transitDetails.departure_stop.name;
				let arrivalName = transitDetails.arrival_stop.name;

				if (transitDetails.line.vehicle.type === 'BUS') {
					directions.push({
						type: 'Bus',
						instructions: `Take Bus ${transitDetails.line.name} for ${transitDetails.num_stops} stops to ${arrivalName}`,
						duration: step.duration,
						distance: step.distance,
						polyline: step.polyline,
					});
				} else if (transitDetails.line.vehicle.type === 'SUBWAY') {
					directions.push({
						type: 'MRT',
						instructions: `Take the ${transitDetails.line.name} for ${transitDetails.num_stops} stops to ${arrivalName}`,
						duration: step.duration,
						distance: step.distance,
						polyline: step.polyline,
					});
				}
			}
		});
		return directions;
	};

	// departure time display

	let resendTimerInterval;

	const triggerTimer = (time) => {
		setTimeLeft(null);
		resendTimerInterval = setInterval(() => calculateTimeLeft(time), 1000);
	};

	const calculateTimeLeft = (finalTime) => {
		const difference = finalTime - +new Date();
		if (difference <= 0) {
			clearInterval(resendTimerInterval);
			setTimeLeft('NOW!!!');
			return;
		}
		setTimeLeft(formatDate(Math.round(difference)));
	};

	useEffect(() => {
		if (departureTime) {
			triggerTimer(departureTime.getTime());
		} else {
			clearInterval(resendTimerInterval);
		}
		return () => {
			clearInterval(resendTimerInterval);
		};
	}, [departureTime]);

	function formatDate(difference) {
		if (difference <= 0) return 'NOW!!!';

		if (difference < 60000) return '< 1m';
		//Arrange the difference of date in days, hours, minutes, and seconds format
		let days = Math.floor(difference / (1000 * 60 * 60 * 24));
		let dayString = 'd';
		if (days === 0) {
			days = '';
			dayString = '';
		}

		let hours = Math.floor(
			(difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
		);
		let hourString = 'h';
		if (hours === 0) {
			hours = '';
			hourString = '';
		}

		let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
		let minuteString = 'm';

		return (
			days + dayString + ' ' + hours + hourString + ' ' + minutes + minuteString
		);
	}

	const panelHidden = (value) => {
		if (value === 0 && currentPlace && step !== 'travelling') {
			setStep('selecting');
			setArrivalTime(new Date());
			setCurrentPlace(null);
			setPanelMaxHeight(screenHeight / 3.1);
		}
	};

	const locationPanelContent = () => {
		return (
			<View style={styles.panelContainer}>
				<Text style={styles.locationName}>{currentPlace?.name}</Text>
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
							setArrivalTime(new Date());
							setPanelMaxHeight(screenHeight / 2.2);
							this._panel.show(screenHeight / 2.2);
						}}
					/>
				</View>
			</View>
		);
	};

	const setTimePanelContent = () => {
		return (
			<View style={styles.panelContainer}>
				<Text style={styles.locationName}>{currentPlace?.name}</Text>
				<Text style={styles.locationAddress}>
					{currentPlace?.formatted_address}
				</Text>
				<View style={styles.panelSeparator} />
				<Text
					style={[
						styles.locationName,
						{ paddingTop: 30, textAlign: 'center' },
					]}>
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
								{arrivalTime.toLocaleDateString('en-US', selectionOptions)}
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
						onPress={async () => {
							setStep('travelling');
							await getRoute(userLocation, currentPlace?.geometry?.location);
							setPanelMinHeight(screenHeight / 5);
							setPanelMaxHeight(screenHeight / 1.5);
							this._panel.show(screenHeight / 4);
						}}
					/>
				</View>
			</View>
		);
	};

	const setTravellingPanelContent = () => {
		return (
			<View style={styles.panelContainer}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<View>
						<Text style={styles.leaveIn}>Leave In</Text>
						<Text style={styles.timeRemaining}>{timeLeft}</Text>
					</View>
					<Button
						title="Cancel"
						filled={true}
						color={COLORS.exitRed}
						onPress={() => {
							setPanelMinHeight(0);
							setPanelMaxHeight(screenHeight / 3.1);
							setTimeout(() => {
								this._panel.hide();
							}, 10);
							setTimeout(() => {
								setStep('selecting');
								setRouteCoords(null);
								setArrivalTime(new Date());
								setCurrentPlace(null);
								setDepartureTime(null);
								setDirections(null);
								setTimeLeft(null);
							}, 500);
						}}
						style={{ paddingHorizontal: 30, marginTop: 10, height: 55 }}
					/>
				</View>
				<View
					style={[
						styles.panelSeparator,
						{ marginHorizontal: -20, marginTop: 25 },
					]}
				/>
				<View style={{ marginTop: 30 }}>
					<FlatList
						style={{ height: 320 }}
						data={directions}
						onTouchStart={() => setCanPanelDrag(false)}
						onTouchEnd={() => setCanPanelDrag(true)}
						onTouchCancel={() => setCanPanelDrag(true)}
						keyExtractor={(item, index) => index.toString()}
						ItemSeparatorComponent={() => {
							return <View style={styles.panelSeparator} />;
						}}
						renderItem={({ item }) => (
							<View>
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										paddingVertical: 10,
										paddingHorizontal: 10,
									}}>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<View
											style={{
												width: 20,
												height: 20,
												borderRadius: 10,
												backgroundColor: COLORS.primary,
												marginRight: 10,
											}}
										/>
										<Text style={{ fontWeight: 'bold', fontSize: 20 }}>
											{item.type}
										</Text>
									</View>
									<View style={{ flexDirection: 'row' }}>
										<Text style={{ textAlign: 'right', fontWeight: 'bold' }}>
											{item.duration.text}
										</Text>
										<Text style={{ textAlign: 'right' }}>
											{' '}
											({item.distance.text})
										</Text>
									</View>
								</View>
								<View>
									<Text style={{ paddingHorizontal: 10 }}>
										{item.instructions}
									</Text>
								</View>
							</View>
						)}
					/>
				</View>
			</View>
		);
	};

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
				<Animated.View style={searchBarAnimatedStyle}>
					{isSearchBarVisible && (
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
					)}
				</Animated.View>
				<Animated.View style={cardViewAnimatedStyle}>
					{isCardViewVisible && (
						<View style={styles.cardView}>
							<View
								style={[
									styles.shadow,
									{
										borderRadius: 5,
										backgroundColor: COLORS.white,
										paddingVertical: 10,
										paddingHorizontal: 20,
									},
								]}>
								<Text style={styles.cardTitle}>Arrive By</Text>
								<Text style={styles.cardTime}>
									{arrivalTime.toLocaleTimeString('en-US', displayOptions)}
								</Text>
							</View>
						</View>
					)}
				</Animated.View>
				<Animated.View style={locationAnimationStyle}>
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
						{step === 'travelling' && (
							<ActionButton
								iconType={Icons.Ionicons}
								iconName="ios-person-add-sharp"
								onPress={() => {}}
								buttonStyle={{
									backgroundColor: COLORS.white,
								}}
								iconColor={COLORS.black}
								fabSize={40}
								underlayColor={COLORS.gray}
								style={{ marginTop: 50 }}
								iconSize={23}
							/>
						)}
					</View>
				</Animated.View>
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
	locationName: {
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
	cardView: {
		top: 20,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		opacity: 0.9,
	},
	cardTitle: {
		fontSize: 20,
		paddingBottom: 3,
		color: COLORS.black,
		textAlign: 'center',
	},
	cardTime: {
		fontSize: 23,
		fontWeight: 'bold',
		color: COLORS.black,
		textAlign: 'center',
	},
	shadow: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 5,
		shadowOpacity: 0.3,
	},
	leaveIn: {
		fontSize: 25,
		paddingBottom: 3,
		color: COLORS.black,
		paddingTop: 10,
		textAlign: 'left',
	},
	timeRemaining: {
		paddingTop: 20,
		fontSize: 30,
		fontWeight: 'bold',
		color: COLORS.black,
		textAlign: 'left',
	},
});

export default Map;
