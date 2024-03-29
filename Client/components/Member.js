import { Avatar } from '@rneui/themed';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import COLORS from '../constants/colors';
import Icon, { Icons } from './Icons';

const Member = ({ member, socket, partyID, moveCamera }) => {
	const shakeValue = useSharedValue(0);

	const bellAnimationStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ rotate: `${interpolate(shakeValue.value, [-1, 1], [-15, 15])}deg` },
			],
		};
	});

	const userOptions = {
		hour12: false,
		hour: 'numeric',
		minute: 'numeric',
	};

	const triggerBell = () => {
		socket.emit('notification', partyID, member.uid);
		shakeValue.value = withSequence(
			withTiming(-1, { duration: 100 }),
			withTiming(1, { duration: 100 }),
			withTiming(-1, { duration: 100 }),
			withTiming(1, { duration: 100 }),
			withTiming(0, { duration: 100 })
		);
	};

	return (
		<View
			style={{
				alignItems: 'center',
				paddingRight: 24,
			}}>
			<Image
				source={require('../assets/crown.png')}
				style={{ opacity: member.isLeader ? 1 : 0 }}
			/>
			<TouchableOpacity
				style={{
					justifyContent: 'center',
					alignItems: 'center',
				}}
				onPress={() => {
					moveCamera(
						parseFloat(member.currentLocation.lat),
						parseFloat(member.currentLocation.lng)
					);
				}}>
				<Avatar
					rounded
					source={{
						uri: member.avatar,
					}}
					containerStyle={{ backgroundColor: COLORS.gray }}
					size={65}
				/>
			</TouchableOpacity>
			<Text style={{ fontWeight: 'bold', fontSize: 17 }} numberOfLines={1}>
				{member.name}
			</Text>
			{member.departureTime > Date.now() ? (
				<Text style={{ fontSize: 15 }}>
					{new Date(member.departureTime)
						.toLocaleTimeString('en-US', userOptions)
						.replace(/AM|PM/, '')}
				</Text>
			) : (
				<Text style={{ fontSize: 15, color: COLORS.errorRed }}>LATE</Text>
			)}
			<Animated.View
				style={[
					bellAnimationStyle,
					{
						marginTop: 5,
						opacity: member.departureTime > Date.now() ? 0 : 1,
						pointerEvents: member.departureTime > Date.now() ? 'none' : 'auto',
					},
				]}>
				<TouchableOpacity onPress={triggerBell}>
					<Icon
						type={Icons.MaterialIcons}
						name="notifications-active"
						size={20}
						color={COLORS.black}
					/>
				</TouchableOpacity>
			</Animated.View>
		</View>
	);
};

export default Member;
