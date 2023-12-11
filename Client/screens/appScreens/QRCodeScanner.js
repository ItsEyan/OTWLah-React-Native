import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { BarCodeScanner } from 'expo-barcode-scanner';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import QRCodeReticle from '../../components/QRCodeReticle';
import COLORS from '../../constants/colors';
import { baseAPIUrl } from '../../constants/sharedVariables';
import { SignInContext } from '../../contexts/authContext';

const QRCodeScanner = () => {
	const [hasPermission, setHasPermission] = useState(null);
	const [x, setX] = useState(0);
	const [y, setY] = useState(0);
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const navigation = useNavigation();
	const route = useRoute();
	const userLocation = route.params.userLocation;

	const { signedIn } = useContext(SignInContext);

	useEffect(() => {
		const getBarCodeScannerPermissions = async () => {
			const { status } = await BarCodeScanner.requestPermissionsAsync();
			setHasPermission(status === 'granted');
		};

		getBarCodeScannerPermissions();
	}, []);

	const [fetching, setFetching] = useState(false);
	const [error, setError] = useState(false);
	const [scan, setScan] = useState(false);

	useEffect(() => {
		if (error) {
			Alert.alert('Invalid QR Code', 'Please provide a valid QR code.', [
				{
					onPress: () => {
						setError(false);
						setScan(false);
					},
				},
			]);
		}
	}, [error]);

	const submitPartyID = async (code) => {
		setFetching(true);
		try {
			const response = await axios.get(`${baseAPIUrl}/joinParty`, {
				params: {
					partyID: parseInt(code),
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
					partyID: parseInt(code),
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

	const handleBarCodeScanned = async ({ bounds, data }) => {
		setScan(true);
		if (fetching) return;
		if (!scan) {
			submitPartyID(data);
		}
		const { origin, size } = bounds;
		setX(origin.x);
		setY(origin.y);
		setWidth(size.width);
		setHeight(size.height);
	};

	if (hasPermission === null) {
		return <Text>Requesting for camera permission</Text>;
	}
	if (hasPermission === false) {
		return <Text>No access to camera</Text>;
	}

	return (
		<View style={styles.container}>
			<BarCodeScanner
				onBarCodeScanned={handleBarCodeScanned}
				style={StyleSheet.absoluteFillObject}
			/>

			<View
				style={{
					position: 'absolute',
					top: y,
					left: x,
					width: width,
					height: height,
				}}>
				<QRCodeReticle
					color={COLORS.white}
					size={width}
					borderLength={width / 4}
					thickness={8}
					borderRadius={30}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignContent: 'center',
	},
	scanOverlay: {
		position: 'absolute',
		backgroundColor: 'rgba(255,0,0,0.5)',
	},
});

export default QRCodeScanner;
