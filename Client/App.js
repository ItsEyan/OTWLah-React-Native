import { FIREBASE_APP } from './FirebaseConfig';
import RootNavigator from './Navigation/rootNavigation';
import { SignInContextProvider } from './contexts/authContext';

export default function App() {
	FIREBASE_APP;

	return (
		<SignInContextProvider>
			<RootNavigator />
		</SignInContextProvider>
	);
}
