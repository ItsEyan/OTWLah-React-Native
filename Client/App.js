import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FIREBASE_APP } from './FirebaseConfig';
import RootNavigator from './Navigation/rootNavigation';
import { SignInContextProvider } from './contexts/authContext';

export default function App() {
	FIREBASE_APP;

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SignInContextProvider>
				<RootNavigator />
			</SignInContextProvider>
		</GestureHandlerRootView>
	);
}
