import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import COLORS from '../constants/colors';

const FloatingActionMenu = () => {
	const [icon_1] = useState(new Animated.Value(40));
	const [icon_2] = useState(new Animated.Value(40));
	const [icon_3] = useState(new Animated.Value(40));

	const [pop, setPop] = useState(false);

	const popIn = () => {
		setPop(true);
		Animated.timing(icon_1, {
			toValue: 130,
			duration: 500,
			useNativeDriver: false,
		}).start();

		Animated.timing(icon_2, {
			toValue: 110,
			duration: 500,
			useNativeDriver: false,
		}).start();

		Animated.timing(icon_3, {
			toValue: 130,
			duration: 500,
			useNativeDriver: false,
		}).start();
	};

	const popOut = () => {
		setPop(false);
		Animated.timing(icon_1, {
			toValue: 40,
			duration: 500,
			useNativeDriver: false,
		}).start();

		Animated.timing(icon_2, {
			toValue: 40,
			duration: 500,
			useNativeDriver: false,
		}).start();

		Animated.timing(icon_3, {
			toValue: 40,
			duration: 500,
			useNativeDriver: false,
		}).start();
	};

	return (
		<View style={{ flex: 1 }}>
			<Animated.View style={[styles.circle, { bottom: icon_1 }]}>
				<TouchableOpacity>
					<Ionicons name="settings-sharp" size={25} color={COLORS.white} />
				</TouchableOpacity>
			</Animated.View>
			<Animated.View style={[styles.circle, { bottom: icon_2, right: icon_2 }]}>
				<TouchableOpacity>
					<FontAwesome5 name="user-plus" size={25} color={COLORS.white} />
				</TouchableOpacity>
			</Animated.View>
			<Animated.View style={[styles.circle, { right: icon_3 }]}>
				<TouchableOpacity>
					<FontAwesome5 name="user-plus" size={25} color={COLORS.white} />
				</TouchableOpacity>
			</Animated.View>
			<TouchableOpacity
				style={styles.circle}
				onPress={() => {
					pop === false ? popIn() : popOut();
				}}>
				<Icon name="plus" size={25} color={COLORS.white} />
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	circle: {
		backgroundColor: COLORS.primary,
		width: 60,
		height: 60,
		position: 'absolute',
		bottom: 40,
		right: 40,
		borderRadius: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default FloatingActionMenu;
