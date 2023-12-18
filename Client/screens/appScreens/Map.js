import { GOOGLE_IOS_API_KEY } from '@env';
import {
	useIsFocused,
	useNavigation,
	useRoute,
} from '@react-navigation/native';
import { Avatar } from '@rneui/themed';
import axios from 'axios';
import * as Location from 'expo-location';
import {
	collection,
	collectionGroup,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
} from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
	Dimensions,
	FlatList,
	Keyboard,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	Vibration,
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
import { io } from 'socket.io-client';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Button from '../../components/Button';
import CurrentLocationIcon from '../../components/CurrentLocationIcon';
import ActionButton from '../../components/FloatingActionButton';
import FloatingActionMenu from '../../components/FloatingActionMenu';
import Icon, { Icons } from '../../components/Icons';
import Member from '../../components/Member';
import COLORS from '../../constants/colors';
import { baseAPIUrl } from '../../constants/sharedVariables';
import { SignInContext } from '../../contexts/authContext';
import { User } from '../../entity/User';

const Map = () => {
	const mapRef = useRef(null);
	const latDelta = 0.008;
	const longDelta = 0.008;
	const polyline = require('@mapbox/polyline');
	const navigation = useNavigation();
	const route = useRoute();
	const famRef = useRef();
	const { signedIn } = useContext(SignInContext);
	const [currentSocket, setCurrentSocket] = useState(null);

	// party
	const [partyID, setPartyID] = useState(null);
	const [members, setMembers] = useState([]);

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
	const [isEditing, setIsEditing] = useState(false);
	const [tmpLocation, setTmpLocation] = useState(null);
	const isFocused = useIsFocused();

	const [canPanelDrag, setCanPanelDrag] = useState(true);

	// db
	const db = FIREBASE_DB;

	// socket
	const socket = io(baseAPIUrl, {
		query: {
			userId: signedIn.userUID,
		},
	});
	socket.on('notification', async (partyID) => {
		console.log('notification from ' + partyID);
		Vibration.vibrate(100);
	});

	let tmpSocket;
	useEffect(() => {
		if (currentSocket) {
			tmpSocket = currentSocket;
			socket.on(currentSocket, partySocket);
		} else {
			socket.off(tmpSocket, partySocket);
		}
	}, [currentSocket]);

	let newMembers;

	// animations
	const [isCardViewVisible, setCardViewVisible] = useState(false);

	const searchBarFadeInOpacity = useSharedValue(0);
	const cardViewFadeInOpacity = useSharedValue(1);
	const translationYValue = useSharedValue(0);

	const translateDown = () => {
		translationYValue.value = withTiming(0, {
			duration: 500,
			easing: Easing.linear,
			useNativeDriver: true,
			isInteraction: false,
		});
	};

	const translateUp = () => {
		translationYValue.value = withTiming(-50, {
			duration: 300,
			easing: Easing.linear,
			useNativeDriver: true,
			isInteraction: false,
		});
	};

	const searchBarFadeIn = () => {
		searchBarFadeInOpacity.value = withTiming(1, {
			duration: 500,
			easing: Easing.linear,
			useNativeDriver: true,
			isInteraction: false,
		});
	};

	const searchBarFadeOut = () => {
		searchBarFadeInOpacity.value = withTiming(0, {
			duration: 200,
			easing: Easing.linear,
			useNativeDriver: true,
			isInteraction: false,
		});
	};

	const cardViewFadeIn = () => {
		setCardViewVisible(true);
		cardViewFadeInOpacity.value = withTiming(1, {
			duration: 500,
			easing: Easing.linear,
			useNativeDriver: true,
			isInteraction: false,
		});
	};

	const cardViewFadeOut = () => {
		cardViewFadeInOpacity.value = withTiming(
			0,
			{
				duration: 200,
				easing: Easing.linear,
				useNativeDriver: true,
				isInteraction: false,
			},
			(isFinished) => {
				if (isFinished) runOnJS(setCardViewVisible)(false);
			}
		);
	};

	const searchBarAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: searchBarFadeInOpacity.value, // Use the value directly
		};
	});

	const cardViewAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: cardViewFadeInOpacity.value, // Use the value directly
		};
	});

	const translationAnimationStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateY: translationYValue.value }],
		};
	});

	useEffect(() => {
		if (step === 'travelling') {
			searchBarFadeOut();
			translateUp();
			cardViewFadeIn();
		} else if (!isCardViewVisible && step === 'party') {
			searchBarFadeOut();
			translateUp();
			cardViewFadeIn();
		} else if (step === 'selecting') {
			translateDown();
			cardViewFadeOut();
			searchBarFadeIn();
		}

		if (isFocused) {
			if (route.params?.partyID && step !== 'party') {
				joinParty();
			}
		}
	}, [step, isFocused]);

	useEffect(() => {
		Keyboard.addListener('keyboardDidShow', () => {
			if (famRef !== null) {
				famRef?.current?.close();
			}
		});
	}, []);

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

	// location

	const BACKGROUND_TRACKER = 'background-location-tracker';

	useEffect(() => {
		let subscription;
		const startLocationTracking = async () => {
			const { status: foregroundStatus } =
				await Location.requestForegroundPermissionsAsync();
			if (foregroundStatus === 'granted') {
				// const { status: backgroundStatus } =
				// 	await Location.requestBackgroundPermissionsAsync();
				// if (backgroundStatus === 'granted') {
				// 	console.log('Starting location updates...');
				// 	await Location.startLocationUpdatesAsync(BACKGROUND_TRACKER, {
				// 		accuracy: Location.Accuracy.Balanced,
				// 		timeInterval: 1000,
				// 		distanceInterval: 0,
				// 	});
				// }
				subscription = await Location.watchPositionAsync(
					{
						accuracy: isAndroid
							? Location.Accuracy.Low
							: Location.Accuracy.Lowest,
						timeInterval: 1000,
						distanceInterval: 5,
					},
					async (location) => {
						setUserLocation(location);
						moveToLocation(location.coords.latitude, location.coords.longitude);
						if (partyID) {
							socket.emit('locationUpdated', partyID, {
								uid: signedIn.userUID,
								lat: location.coords.latitude,
								lng: location.coords.longitude,
							});
							await setDoc(
								doc(
									db,
									'parties',
									partyID.toString(),
									'members',
									signedIn.userUID
								),
								{
									currentLocation: {
										lat: location.coords.latitude,
										lng: location.coords.longitude,
									},
								},
								{ merge: true }
							);
						}
					}
				);
			}
		};

		startLocationTracking();

		return () => {
			if (subscription) {
				subscription.remove();
			}
		};
	}, []);

	// TaskManager.defineTask(
	// 	BACKGROUND_TRACKER,
	// 	({ data: { locations }, error }) => {
	// 		if (error) {
	// 			console.log(error);
	// 			return;
	// 		}
	// 		console.log('Received new locations', locations);
	// 		setUserLocation(locations[0]);
	// 		socket.emit('locationUpdated', partyID, {
	// 			uid: signedIn.userUID,
	// 			lat: locations[0].coords.latitude,
	// 			lng: locations[0].coords.longitude,
	// 		});
	// 	}
	// );

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
		famRef.current.close();
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

	const getRoute = async (
		originLoc,
		destinationLoc,
		arrival_time = arrivalTime
	) => {
		const url = 'https://maps.googleapis.com/maps/api/directions/json?';
		let newDepartureTime;
		try {
			await axios
				.get(url, {
					params: {
						destination: `${destinationLoc.lat},${destinationLoc.lng}`,
						origin: `${originLoc.coords.latitude},${originLoc.coords.longitude}`,
						mode: 'transit',
						arrival_time: Math.round(arrival_time.getTime() / 1000),
						key: GOOGLE_IOS_API_KEY,
					},
				})
				.then(async (response) => {
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
						newDepartureTime = new Date(
							response.data?.routes[0]?.legs[0]?.departure_time.value * 1000
						);
					} else {
						newDepartureTime = getDepartureTime(
							response.data?.routes[0]?.legs[0]?.duration.value
						);
					}
					setDepartureTime(newDepartureTime);
					mapRef.current.animateToRegion(findZoomCoords(coords), 1000);

					if (isEditing) {
						await setDoc(
							doc(db, 'parties', partyID.toString()),
							{
								arrivalTime: arrivalTime.getTime(),
								destination: {
									name: currentPlace?.name,
									address: currentPlace?.formatted_address,
									lat: currentPlace?.geometry?.location?.lat,
									lng: currentPlace?.geometry?.location?.lng,
								},
							},
							{ merge: true }
						);
						await setDoc(
							doc(
								db,
								'parties',
								partyID.toString(),
								'members',
								signedIn.userUID
							),
							{
								arrivalTime: arrivalTime.getTime(),
								destination: {
									name: currentPlace?.name,
									address: currentPlace?.formatted_address,
									lat: currentPlace?.geometry?.location?.lat,
									lng: currentPlace?.geometry?.location?.lng,
								},
								currentLocation: {
									lat: userLocation?.coords?.latitude,
									lng: userLocation?.coords?.longitude,
								},
								departureTime: newDepartureTime.getTime(),
							},
							{ merge: true }
						);
					}
				});
		} catch (error) {
			console.log(error);
		}
		return newDepartureTime;
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
		calculateTimeLeft(time);
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
		if (value === 0 && isEditing) {
			setIsEditing(false);
			setCurrentPlace(tmpLocation);
			setPin({
				latitude: tmpLocation?.geometry?.location?.lat,
				latitudeDelta: latDelta,
				longitude: tmpLocation?.geometry?.location?.lng,
				longitudeDelta: longDelta,
			});
			setPanelMinHeight(screenHeight / 4);
			setPanelMaxHeight(screenHeight / 1.3);
			this._panel.show(screenHeight / 4);
			mapRef.current.animateToRegion(findZoomCoords(routeCoords), 1000);
			setStep('party');
		} else if (
			value === 0 &&
			currentPlace &&
			(step === 'selecting' || step === 'settime')
		) {
			setStep('selecting');
			setArrivalTime(new Date());
			setCurrentPlace(null);
			setPanelMaxHeight(screenHeight / 3.1);
		}
	};

	// panel contents

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
							setArrivalTime(
								isEditing
									? arrivalTime.getTime() > Date.now()
										? new Date(arrivalTime.getTime())
										: new Date()
									: new Date()
							);
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
								{arrivalTime.toLocaleDateString('en-GB', selectionOptions)}
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
							if (isEditing) {
								await getRoute(userLocation, currentPlace?.geometry?.location);
								setPanelMinHeight(screenHeight / 4);
								setPanelMaxHeight(screenHeight / 1.3);
								this._panel.show(screenHeight / 4);
								socket.emit('partyEdited', partyID);
								setIsEditing(false);
								setStep('party');
							} else {
								setStep('travelling');
								famRef.current.close();
								await getRoute(userLocation, currentPlace?.geometry?.location);
								setPanelMinHeight(screenHeight / 5);
								setPanelMaxHeight(screenHeight / 1.5);
								this._panel.show(screenHeight / 5);
							}
						}}
					/>
				</View>
			</View>
		);
	};

	const directionsComponent = (height) => {
		return (
			<View style={{ marginTop: 30 }}>
				<FlatList
					style={{ height: height }}
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
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
									}}>
									{item.type === 'Walk' ? (
										<Icon
											type={Icons.MaterialIcons}
											name="directions-walk"
											color={COLORS.primary}
										/>
									) : item.type === 'Bus' ? (
										<Icon
											type={Icons.FontAwesome5}
											name="bus-alt"
											color={COLORS.yellow}
										/>
									) : item.type === 'MRT' ? (
										<Icon
											type={Icons.Ionicons}
											name="subway"
											color={COLORS.emeraldGreen}
										/>
									) : null}
									<Text
										style={{
											fontWeight: 'bold',
											fontSize: 20,
											marginLeft: 10,
										}}>
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
		);
	};

	const returnToDestinationSelection = () => {
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
			setPartyID(null);
			setMembers([]);
		}, 500);
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
						onPress={returnToDestinationSelection}
						style={{ paddingHorizontal: 30, marginTop: 10, height: 55 }}
					/>
				</View>
				<View
					style={[
						styles.panelSeparator,
						{ marginHorizontal: -20, marginTop: 25 },
					]}
				/>
				{directionsComponent(320)}
			</View>
		);
	};

	const clearParams = () => {
		navigation.setParams({
			partyID: null,
			destination: null,
			arrivalTime: null,
		});
	};

	const joinParty = async () => {
		try {
			famRef.current.close();
			searchBarFadeOut();
			translateUp();
			cardViewFadeIn();
			setCurrentPlace({
				name: route.params.destination.name,
				formatted_address: route.params.destination.address,
				geometry: {
					location: {
						lat: route.params.destination.lat,
						lng: route.params.destination.lng,
					},
				},
			});
			setPin({
				latitude: route.params.destination.lat,
				latitudeDelta: latDelta,
				longitude: route.params.destination.lng,
				longitudeDelta: longDelta,
			});
			setArrivalTime(new Date(route.params.arrivalTime));
			setPartyID(route.params.partyID);

			let newDepartureTime = await getRoute(
				userLocation,
				{
					lat: route.params.destination.lat,
					lng: route.params.destination.lng,
				},
				new Date(route.params.arrivalTime)
			);

			await setDoc(
				doc(
					db,
					'parties',
					route.params.partyID.toString(),
					'members',
					signedIn.userUID
				),
				{ departureTime: newDepartureTime.getTime() },
				{ merge: true }
			);

			const q = query(collectionGroup(db, 'members'));
			const querySnapshot = await getDocs(q);
			newMembers = [];
			querySnapshot.forEach((doc) => {
				if (doc.data().partyID == route.params.partyID) {
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
				}
			});
			setMembers(newMembers, setStep('party'));
			socket.emit('joinParty', route.params.partyID, {
				uid: signedIn.userUID,
				username: signedIn.userDisplayName,
				avatar: signedIn.userPhotoURL,
				lat: userLocation?.coords?.latitude,
				lng: userLocation?.coords?.longitude,
				departureTime: newDepartureTime.getTime(),
			});

			setCurrentSocket(route.params.partyID);

			clearParams();

			setPanelMinHeight(screenHeight / 4);
			setPanelMaxHeight(screenHeight / 1.3);
			this._panel.show(screenHeight / 4);
		} catch (error) {
			console.log(error);
		}
	};

	const editPartySocket = (action) => {
		if (action === 'partyEdited') {
			(async () => {
				try {
					const q = doc(db, 'parties', partyID.toString());
					const querySnapshot = await getDoc(q);
					setArrivalTime(new Date(querySnapshot.data().arrivalTime));
					setCurrentPlace({
						name: querySnapshot.data().destination.name,
						formatted_address: querySnapshot.data().destination.address,
						geometry: {
							location: {
								lat: querySnapshot.data().destination.lat,
								lng: querySnapshot.data().destination.lng,
							},
						},
					});
					setPin({
						latitude: querySnapshot.data().destination.lat,
						latitudeDelta: latDelta,
						longitude: querySnapshot.data().destination.lng,
						longitudeDelta: longDelta,
					});

					let newDepartureTime = await getRoute(
						userLocation,
						{
							lat: querySnapshot.data().destination.lat,
							lng: querySnapshot.data().destination.lng,
						},
						new Date(querySnapshot.data().arrivalTime)
					);

					await setDoc(
						doc(db, 'parties', partyID.toString(), 'members', signedIn.userUID),
						{
							arrivalTime: arrivalTime.getTime(),
							destination: {
								name: querySnapshot.data().destination.name,
								address: querySnapshot.data().destination.address,
								lat: querySnapshot.data().destination.lat,
								lng: querySnapshot.data().destination.lat,
							},
							currentLocation: {
								lat: userLocation?.coords?.latitude,
								lng: userLocation?.coords?.longitude,
							},
							departureTime: newDepartureTime.getTime(),
						},
						{ merge: true }
					);
				} catch (error) {
					console.log(error);
				}
			})();
		}
	};

	const partySocket = (user, action, lat, lng) => {
		if (action === 'locationUpdate') {
			let newMembers = [];
			members.forEach((member) => {
				if (member.uid === user) {
					let newMember = new User(
						member.uid,
						member.name,
						member.avatar,
						member.departureTime,
						{
							lat: lat,
							lng: lng,
						},
						member.isLeader
					);
					newMembers.push(newMember);
					return;
				}
				newMembers.push(member);
			});
			setMembers(newMembers);
			return;
		}
		if (user === 'partyEdited' && action === undefined) {
			editPartySocket(user);
			return;
		}
		if (action === 'joined') {
			let isInside = false;
			let currentMembers = members.length > 0 ? members : newMembers;
			currentMembers?.forEach((member) => {
				if (user.username === member.name) {
					isInside = true;
				}
			});
			if (!isInside) {
				setMembers((currentMembers) => [
					...currentMembers,
					new User(
						user.uid,
						user.username,
						user.avatar,
						new Date(user.departureTime),
						user.userLocation,
						false
					),
				]);
			}
		} else if (action === 'left') {
			let currentMembers = members;
			currentMembers = currentMembers.filter((member) => member.uid != user);
			setMembers(currentMembers);
		} else if (action === 'locationUpdate') {
			members.forEach((member) => {
				if (member.uid === uid) {
					member.currentLocation = {
						lat: lat,
						lng: lng,
					};
					return;
				}
			});
		}
	};

	const openJoinParty = () => {
		navigation.navigate('JoinParty', {
			userLocation: userLocation,
		});
	};

	const openPartyHistory = () => {
		navigation.navigate('PartyHistory', {
			userLocation: userLocation,
		});
	};

	const createParty = async () => {
		let newPartyID;
		famRef.current.close();
		if (partyID === null) {
			try {
				const q = query(collection(db, 'parties'));
				const querySnapshot = await getDocs(q);
				setPartyID(querySnapshot.size + 1);
				newPartyID = querySnapshot.size + 1;
				await setDoc(doc(db, 'parties', (querySnapshot.size + 1).toString()), {
					arrivalTime: arrivalTime.getTime(),
					destination: {
						name: currentPlace?.name,
						address: currentPlace?.formatted_address,
						lat: currentPlace?.geometry?.location?.lat,
						lng: currentPlace?.geometry?.location?.lng,
					},
					createdAt: Date.now(),
				});
				await setDoc(
					doc(
						db,
						'parties',
						(querySnapshot.size + 1).toString(),
						'members',
						signedIn.userUID
					),
					{
						joinedAt: Date.now(),
						departureTime: departureTime.getTime(),
						username: signedIn.userDisplayName,
						avatar: signedIn.userPhotoURL,
						isLeader: true,
						arrivalTime: arrivalTime.getTime(),
						destination: {
							name: currentPlace?.name,
							address: currentPlace?.formatted_address,
							lat: currentPlace?.geometry?.location?.lat,
							lng: currentPlace?.geometry?.location?.lng,
						},
						createdAt: Date.now(),
						currentLocation: {
							lat: userLocation?.coords?.latitude,
							lng: userLocation?.coords?.longitude,
						},
						partyID: newPartyID,
						uid: signedIn.userUID,
					}
				);
				setMembers(
					(members) => [
						...members,
						new User(
							signedIn.userUID,
							signedIn.userDisplayName,
							signedIn.userPhotoURL,
							departureTime,
							userLocation?.coords,
							true
						),
					],
					setStep('party')
				);
				setPanelMinHeight(screenHeight / 4);
				setPanelMaxHeight(screenHeight / 1.3);
				this._panel.show(screenHeight / 4);
			} catch (error) {
				console.log(error);
			}
		}

		let currentPartyID = partyID ? partyID : newPartyID;

		setCurrentSocket(currentPartyID);

		navigation.navigate('PartyInfo', {
			partyID: partyID ? partyID : newPartyID,
			destination: {
				name: currentPlace?.name,
				address: currentPlace?.formatted_address,
				lat: currentPlace?.geometry?.location?.lat,
				lng: currentPlace?.geometry?.location?.lng,
			},
		});
	};

	const setPartyPanelContent = () => {
		let isLeader = false;
		members.forEach((member) => {
			if (member.name === signedIn.userDisplayName && member.isLeader) {
				isLeader = true;
			}
		});
		return (
			<View style={styles.panelContainer}>
				<FlatList
					data={members}
					keyExtractor={(item) => item.name}
					renderItem={(item) => (
						<Member
							member={item.item}
							socket={socket}
							partyID={partyID}
							moveCamera={moveToLocation}
						/>
					)}
					horizontal={true}
				/>
				{directionsComponent(320)}
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						marginTop: 20,
						marginHorizontal: 10,
					}}>
					<Button
						title="Close Party"
						filled={true}
						color={COLORS.exitRed}
						onPress={returnToDestinationSelection}
						style={{ paddingHorizontal: 30, marginTop: 10, height: 55 }}
					/>
					{isLeader && (
						<Button
							title="Edit Party"
							filled={true}
							color={COLORS.primary}
							onPress={editParty}
							style={{ paddingHorizontal: 30, marginTop: 10, height: 55 }}
						/>
					)}
				</View>
			</View>
		);
	};

	const editParty = () => {
		setStep('selecting');
		moveToLocation(
			currentPlace?.geometry?.location?.lat,
			currentPlace?.geometry?.location?.lng
		);
		setIsEditing(true);
		setTmpLocation(currentPlace);
		setPanelMinHeight(0);
		setPanelMaxHeight(screenHeight / 3.1);
		this._panel.show(screenHeight / 3.1);
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
				{routeCoords && !isEditing && (
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
				{step === 'party' &&
					members.map((member, index) => {
						if (member.uid === signedIn.userUID) return null;
						return (
							<MarkerAnimated
								key={index}
								coordinate={{
									latitude: parseFloat(member.currentLocation.lat),
									longitude: parseFloat(member.currentLocation.lng),
								}}
								onCalloutPress={() => {
									Keyboard.dismiss();
								}}>
								<Avatar
									rounded
									source={{
										uri: member.avatar,
									}}
									containerStyle={{ backgroundColor: COLORS.gray }}
									size={20}
								/>
								<MapCallout style={{ flex: 1, position: 'relative' }}>
									<Text>{member.name}</Text>
								</MapCallout>
							</MarkerAnimated>
						);
					})}
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
			<SafeAreaView style={[styles.searchContainer]}>
				<Animated.View style={[translationAnimationStyle]}>
					<Animated.View style={[searchBarAnimatedStyle]}>
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
					</Animated.View>
					<View
						style={{
							alignItems: 'flex-end',
							marginVertical: 10,
							pointerEvents: 'auto',
						}}>
						<ActionButton
							iconType={Icons.MaterialIcons}
							iconName="my-location"
							onPress={getUserLocation}
							buttonStyle={{ backgroundColor: COLORS.white }}
							iconColor={COLORS.black}
							fabSize={40}
							underlayColor={COLORS.gray}
						/>
						{(step === 'travelling' || step === 'party') && (
							<ActionButton
								iconType={Icons.Ionicons}
								iconName="ios-person-add-sharp"
								onPress={createParty}
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
									{arrivalTime.toLocaleTimeString('en-GB', displayOptions)}
								</Text>
							</View>
						</View>
					)}
				</Animated.View>
			</SafeAreaView>
			<FloatingActionMenu
				openJoinParty={openJoinParty}
				openPartyHistory={openPartyHistory}
				ref={famRef}
			/>
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
					{step === 'party' && setPartyPanelContent()}
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
		top: -50,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		opacity: 0.9,
		pointerEvents: 'none',
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
		paddingTop: 10,
		fontSize: 30,
		fontWeight: 'bold',
		color: COLORS.black,
		textAlign: 'left',
	},
});

export default Map;
