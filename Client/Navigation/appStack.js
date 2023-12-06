import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Map from '../screens/appScreens/Map';
import Settings from '../screens/appScreens/Settings';

const App = createNativeStackNavigator();

export function AppStack() {
	return (
		<App.Navigator>
			<App.Screen
				name="Map"
				component={Map}
				options={{
					headerShown: false,
					headerBackTitleVisible: true,
					headerBackTitle: '',
				}}
			/>
			<App.Screen
				name="Settings"
				component={Settings}
				options={{
					headerShown: false,
					headerBackTitleVisible: true,
					headerBackTitle: '',
				}}
			/>
		</App.Navigator>
	);
}