import React from 'react';
import { StyleSheet, TouchableHighlight } from 'react-native';
import Animated from 'react-native-reanimated';
import COLORS from '../constants/colors';
import Icon from './Icons';

const ActionButton = ({
	iconName,
	iconType,
	style,
	buttonStyle,
	iconColor = COLORS.white,
	fabSize = 54,
	iconSize = fabSize / 2 + 7,
	underlayColor = COLORS.pink,
	onPress = () => {},
}) => {
	const styles = StyleSheet.create({
		actionBtn: {
			width: fabSize,
			height: fabSize,
			borderRadius: fabSize / 2,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: COLORS.fabDarkPurple,
			position: 'absolute',
			opacity: 0.95,
			zIndex: -1,
		},
		shadow: {
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowRadius: 5,
			shadowOpacity: 0.4,
		},
	});
	return (
		<Animated.View style={[style, styles.actionBtn]}>
			<TouchableHighlight
				underlayColor={underlayColor}
				style={[styles.actionBtn, buttonStyle, styles.shadow]}
				onPress={onPress}>
				<Icon
					type={iconType}
					name={iconName}
					size={iconSize}
					color={iconColor}
				/>
			</TouchableHighlight>
		</Animated.View>
	);
};

export default ActionButton;
