import React from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';

const AppStatusBar = ({ backgroundColor, ...props }) => {
	const statusBarHeight = StatusBar.currentHeight;
	return (
		<View style={{ height: { statusBarHeight }, backgroundColor }}>
			<SafeAreaView>
				<StatusBar translucent backgroundColor={backgroundColor} {...props} />
			</SafeAreaView>
		</View>
	);
};

export default AppStatusBar;
