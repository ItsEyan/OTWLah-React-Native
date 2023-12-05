import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StatusBar, View } from 'react-native';
import { FIREBASE_APP } from './FirebaseConfig';
import COLORS from './constants/colors';
import {
	Login,
	Map,
	OTPVerification,
	Register,
	ResetPassword,
} from './screens';

const Stack = createNativeStackNavigator();

export default function App() {
	FIREBASE_APP;
	statusBarHeight = StatusBar.currentHeight;

	const MyStatusBar = ({ backgroundColor, ...props }) => (
		<View style={{ height: { statusBarHeight }, backgroundColor }}>
			<SafeAreaView>
				<StatusBar translucent backgroundColor={backgroundColor} {...props} />
			</SafeAreaView>
		</View>
	);

	return (
		<NavigationContainer>
			<MyStatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
			<Stack.Navigator initialRouteName="Login">
				<Stack.Screen
					name="Login"
					component={Login}
					options={{
						headerShown: false,
						headerBackTitleVisible: true,
						headerBackTitle: '',
					}}
				/>
				<Stack.Screen
					name="OTPVerification"
					component={OTPVerification}
					options={{
						headerShown: false,
						headerBackTitleVisible: true,
						headerBackTitle: '',
					}}
				/>
				<Stack.Screen
					name="Register"
					component={Register}
					options={{
						headerShown: false,
						headerBackTitleVisible: true,
						headerBackTitle: '',
					}}
				/>
				<Stack.Screen
					name="ResetPassword"
					component={ResetPassword}
					options={{
						headerShown: false,
						headerBackTitleVisible: true,
						headerBackTitle: '',
					}}
				/>
				<Stack.Screen
					name="Map"
					component={Map}
					options={{
						headerShown: false,
						headerBackTitleVisible: true,
						headerBackTitle: '',
					}}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
