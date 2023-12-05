import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/authScreens/Login';
import OTPVerification from '../screens/authScreens/OTPVerification';
import Register from '../screens/authScreens/Register';
import ResetPassword from '../screens/authScreens/ResetPassword';

const Auth = createNativeStackNavigator();

export function AuthStack() {
	return (
		<Auth.Navigator initialRouteName="Login">
			<Auth.Screen
				name="Login"
				component={Login}
				options={{
					headerShown: false,
					headerBackTitleVisible: true,
					headerBackTitle: '',
				}}
			/>
			<Auth.Screen
				name="OTPVerification"
				component={OTPVerification}
				options={{
					headerShown: false,
					headerBackTitleVisible: true,
					headerBackTitle: '',
				}}
			/>
			<Auth.Screen
				name="Register"
				component={Register}
				options={{
					headerShown: false,
					headerBackTitleVisible: true,
					headerBackTitle: '',
				}}
			/>
			<Auth.Screen
				name="ResetPassword"
				component={ResetPassword}
				options={{
					headerShown: false,
					headerBackTitleVisible: true,
					headerBackTitle: '',
				}}
			/>
		</Auth.Navigator>
	);
}
