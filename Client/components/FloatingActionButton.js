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
			zIndex: -1,
		},
	});
	return (
		<Animated.View style={[style, styles.actionBtn]}>
			<TouchableHighlight
				underlayColor={underlayColor}
				style={[styles.actionBtn, buttonStyle]}
				onPress={onPress}>
				<Icon
					type={iconType}
					name={iconName}
					size={fabSize / 2 + 7}
					color={iconColor}
				/>
			</TouchableHighlight>
		</Animated.View>
	);
};

export default ActionButton;
