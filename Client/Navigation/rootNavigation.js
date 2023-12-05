import { NavigationContainer } from '@react-navigation/native';
import React, { useContext } from 'react';
import { SignInContext } from '../contexts/authContext';
import { AppStack } from './appStack';
import { AuthStack } from './authStack';

export default function RootNavigator() {
	const { signedIn } = useContext(SignInContext);

	return (
		<NavigationContainer>
			{signedIn.userToken === null ? <AuthStack /> : <AppStack />}
		</NavigationContainer>
	);
}
