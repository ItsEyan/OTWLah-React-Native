import { useNavigation } from '@react-navigation/native';
import React, { useReducer } from 'react';
import {
	Dimensions,
	StyleSheet,
	TouchableHighlight,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import Animated, {
	Extrapolate,
	interpolate,
	interpolateColor,
	useAnimatedStyle,
	useDerivedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import COLORS from '../constants/colors';
import Icon, { Icons } from './Icons';

const { width } = Dimensions.get('window');

const FAB_SIZE = 54;
const circleScale = (width / FAB_SIZE).toFixed(1);
const circleSize = circleScale * FAB_SIZE;
const dist = circleSize / 2 - FAB_SIZE;
const middleDist = dist / 1.41;

const ActionButton = ({ icon, style, onPress = () => {} }) => {
	return (
		<Animated.View style={[styles.actionBtn, style]}>
			<TouchableHighlight
				underlayColor={COLORS.lightRed}
				style={styles.actionBtn}
				onPress={onPress}>
				<Icon
					type={Icons.EvilIcons}
					name={icon}
					size={34}
					color={COLORS.white}
				/>
			</TouchableHighlight>
		</Animated.View>
	);
};

export default function Fab() {
	const [open, toggle] = useReducer((s) => !s, false);

	const navigation = useNavigation();

	const rotation = useDerivedValue(() => {
		return withTiming(open ? '0deg' : '135deg');
	}, [open]);

	const progress = useDerivedValue(() => {
		return open ? withSpring(1) : withSpring(0);
	});

	const translation = useDerivedValue(() => {
		return open ? withSpring(1, { stiffness: 80, damping: 8 }) : withSpring(0);
	});

	const fabStyles = useAnimatedStyle(() => {
		const rotate = rotation.value;
		const backgroundColor = interpolateColor(
			progress.value,
			[0, 1],
			[COLORS.red, COLORS.darkRed]
		);
		return {
			transform: [{ rotate }],
			backgroundColor,
		};
	});

	const scalingStyles = useAnimatedStyle(() => {
		const scale = interpolate(progress.value, [0, 1], [0, circleScale]);
		return {
			transform: [{ scale }],
		};
	});

	const translationStyles = (x, y, value) =>
		useAnimatedStyle(() => {
			const translate = interpolate(translation.value, [0, 1], [0, -value], {
				extrapolateLeft: Extrapolate.CLAMP,
			});
			const scale = interpolate(progress.value, [0, 1], [0, 1], {
				extrapolateLeft: Extrapolate.CLAMP,
			});
			if (x && y) {
				return {
					transform: [
						{ translateX: translate },
						{ translateY: translate },
						{ scale },
					],
				};
			} else if (x) {
				return {
					transform: [{ translateX: translate }, { scale }],
				};
			} else {
				return {
					transform: [{ translateY: translate }, { scale }],
				};
			}
		});

	const openSettings = () => {
		toggle();
		navigation.navigate('Settings');
	};

	return (
		<View style={styles.container}>
			<View style={styles.fabContainer}>
				<Animated.View style={[styles.expandingCircle, scalingStyles]} />
				<TouchableWithoutFeedback onPress={toggle}>
					<Animated.View style={[styles.fab, fabStyles]}>
						<Icon
							type={Icons.EvilIcons}
							name="close"
							color={COLORS.white}
							size={34}
						/>
					</Animated.View>
				</TouchableWithoutFeedback>
				<ActionButton
					style={translationStyles(false, true, dist)}
					icon="calendar"
				/>
				<ActionButton
					style={translationStyles(true, true, middleDist)}
					icon="share-google"
				/>
				<ActionButton
					style={translationStyles(true, false, dist)}
					icon="gear"
					onPress={openSettings}
				/>
			</View>
		</View>
	);
}

const CircleStyle = {
	width: FAB_SIZE,
	height: FAB_SIZE,
	borderRadius: FAB_SIZE / 2,
	justifyContent: 'center',
	alignItems: 'center',
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.accent,
	},
	fabContainer: {
		position: 'absolute',
		bottom: 20,
		right: 20,
	},
	fab: {
		...CircleStyle,
		backgroundColor: COLORS.red,
		transform: [{ rotate: '135deg' }],
	},
	expandingCircle: {
		...CircleStyle,
		// transform: [{ scale: 8 }],
		backgroundColor: COLORS.red,
		position: 'absolute',
		zIndex: -1,
	},
	actionBtn: {
		...CircleStyle,
		backgroundColor: COLORS.darkRed,
		position: 'absolute',
		zIndex: -1,
	},
});
