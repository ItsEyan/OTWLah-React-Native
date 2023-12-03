import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import COLORS from '../constants/colors';

const CodeInputField = ({ setPinReady, code, setCode, maxLength }) => {
	const {
		codeInputSection,
		hiddenTextInput,
		codeInputsContainer,
		codeInput,
		codeInputText,
		codeInputFocused,
	} = styles;

	const codeDigitsArray = new Array(maxLength).fill(0);
	const textInputRef = useRef(null);

	const [inputContainerIsFocused, setInputContainerIsFocused] = useState(false);

	const handleOnBlur = () => {
		setInputContainerIsFocused(false);
	};

	const handleOnPress = () => {
		setInputContainerIsFocused(true);
		textInputRef?.current?.focus();
	};

	useEffect(() => {
		setPinReady(code.length === maxLength);
		return () => setPinReady(false);
	}, [code]);

	const toCodeDigitInput = (_value, index) => {
		const emptyInputChar = ' ';
		const digit = code[index] || emptyInputChar;

		const isCurrentDigit = index === code.length;
		const isLastDigit = index === maxLength - 1;
		const isCodeFull = code.length === maxLength;

		const isDigitFocused = isCurrentDigit || (isLastDigit && isCodeFull);

		const styledCodeInput =
			inputContainerIsFocused && isDigitFocused ? codeInputFocused : codeInput;

		return (
			<View style={styledCodeInput} key={index}>
				<Text style={codeInputText}>{digit}</Text>
			</View>
		);
	};

	return (
		<View style={codeInputSection}>
			<Pressable style={codeInputsContainer} onPress={handleOnPress}>
				{codeDigitsArray.map(toCodeDigitInput)}
			</Pressable>
			<TextInput
				style={hiddenTextInput}
				ref={textInputRef}
				value={code}
				onChangeText={setCode}
				onSubmitEditing={handleOnBlur}
				inputMode="numeric"
				enterKeyHint="done"
				textContentType="oneTimeCode"
				maxLength={maxLength}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	codeInputSection: {
		justifyContent: 'center',
		alignItems: 'center',
		marginVertical: 30,
	},
	hiddenTextInput: {
		position: 'absolute',
		height: 0,
		width: 0,
		opacity: 0,
	},
	codeInputsContainer: {
		width: '70%',
		flexDirection: 'row',
		justifyContent: 'space-evenly',
	},
	codeInput: {
		borderColor: COLORS.lightPurple,
		minWidth: 44,
		borderWidth: 2,
		borderRadius: 5,
		padding: 12,
	},
	codeInputText: {
		fontWeight: 'bold',
		fontSize: 22,
		textAlign: 'center',
		color: COLORS.darkPurple,
	},
	codeInputFocused: {
		borderColor: COLORS.secondary,
		minWidth: 44,
		borderWidth: 2,
		borderRadius: 5,
		padding: 12,
	},
});

export default CodeInputField;
