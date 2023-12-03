import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FIREBASE_APP } from './FirebaseConfig';
import { Login, OTPVerification, Register } from './screens';

const Stack = createNativeStackNavigator();

export default function App() {
	FIREBASE_APP;
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="OTPVerification">
				<Stack.Screen
					name="OTPVerification"
					component={OTPVerification}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="Register"
					component={Register}
					options={{ headerShown: false }}
				/>
				<Stack.Screen
					name="Login"
					component={Login}
					options={{ headerShown: false }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
