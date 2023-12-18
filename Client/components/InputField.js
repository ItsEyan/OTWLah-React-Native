import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import COLORS from '../constants/colors';

const InputField = ({
	description,
	hint,
	keyboardType,
	setValue,
	error,
	submit = () => {},
	isPassword = false,
}) => {
	const [isPasswordShown, setIsPasswordShown] = isPassword
		? useState(true)
		: useState(false);
	const { inputDescription, inputContainer, errorMessageStyle } = styles;
	return (
		<View>
			<Text style={inputDescription}>{description}</Text>
			<View style={inputContainer}>
				<TextInput
					placeholder={hint}
					placeholderTextColor={COLORS.grey}
					secureTextEntry={isPasswordShown}
					keyboardType={keyboardType}
					onChangeText={(text) => setValue(text)}
					style={{ width: '100%', height: '100%' }}
					onSubmitEditing={submit}
				/>
				{isPassword && (
					<TouchableOpacity
						style={{ position: 'absolute', right: 12 }}
						onPress={() => setIsPasswordShown(!isPasswordShown)}>
						{isPasswordShown ? (
							<Ionicons name="eye" size={24} color={COLORS.black} />
						) : (
							<Ionicons name="eye-off" size={24} color={COLORS.black} />
						)}
					</TouchableOpacity>
				)}
			</View>
			<Text style={errorMessageStyle}>{error}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	inputDescription: {
		fontSize: 16,
		fontWeight: 400,
		marginVertical: 8,
	},
	inputContainer: {
		width: '100%',
		height: 48,
		borderColor: COLORS.black,
		borderWidth: 1,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		paddingLeft: 22,
	},
	errorMessageStyle: {
		fontSize: 14,
		color: COLORS.errorRed,
		marginTop: 4,
	},
});

export default InputField;
