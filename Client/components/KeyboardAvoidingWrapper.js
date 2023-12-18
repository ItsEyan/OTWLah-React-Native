import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import COLORS from '../constants/colors';

const KeyboardAvoidingWrapper = ({ children, flex = 1 }) => {
	return (
		<KeyboardAvoidingView
			style={{ flex: flex, backgroundColor: COLORS.white }}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<ScrollView
				automaticallyAdjustKeyboardInsets={true}
				scrollEnabled={false}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{ flexGrow: 1 }}>
				{children}
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default KeyboardAvoidingWrapper;
