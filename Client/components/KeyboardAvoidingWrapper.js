import React from 'react';
import { Keyboard, KeyboardAvoidingView, ScrollView } from 'react-native';
import COLORS from '../constants/colors';

function dismissKeyboard() {
	if (Platform.OS != 'web') {
		Keyboard.dismiss();
	}
}

const KeyboardAvoidingWrapper = ({ children }) => {
	return (
		<KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.white }}>
			<ScrollView
				automaticallyAdjustKeyboardInsets={true}
				scrollEnabled={false}
				keyboardShouldPersistTaps="handled">
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default KeyboardAvoidingWrapper;
