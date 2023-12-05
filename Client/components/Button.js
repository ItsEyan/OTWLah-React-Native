import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import COLORS from '../constants/colors';

const Button = (props) => {
	const filledBgColor = props.color || COLORS.primary;
	const outlinedColor = COLORS.white;
	const bgColor = props.filled ? filledBgColor : outlinedColor;
	const textColor = props.filled ? COLORS.white : COLORS.primary;

	return (
		<TouchableOpacity
			style={[
				styles.button,
				{ backgroundColor: bgColor, borderColor: bgColor },
				props.style,
			]}
			disabled={props.disabled}
			onPress={props.onPress}>
			<Text style={[{ fontSize: 18 }, { color: textColor }]}>
				{props.title}
			</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		paddingVertical: 13,
		borderWidth: 2,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default Button;
