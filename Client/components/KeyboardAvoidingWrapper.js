import React from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import COLORS from '../constants/colors';

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
