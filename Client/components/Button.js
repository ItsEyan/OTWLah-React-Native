import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import COLORS from '../constants/colors';
import Icon from './Icons';

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
			<View style={{ flexDirection: 'row' }}>
				{props.icon && (
					<Icon
						type={props.icon.iconType}
						name={props.icon.iconName}
						size={props.icon.iconSize}
						color={props.icon.iconColor}
						style={props.icon.iconStyle}
					/>
				)}
				<Text style={[{ fontSize: 18, color: textColor }]}>{props.title}</Text>
			</View>
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
