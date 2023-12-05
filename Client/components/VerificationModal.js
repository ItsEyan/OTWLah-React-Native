import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Keyboard, Modal } from 'react-native';
import { StatusBar } from 'react-native-web';
import COLORS from '../constants/colors';
import {
	ButtonText,
	InfoText,
	ModalContainer,
	ModalView,
	PageTitle,
	StyledButton,
} from './styles';

const VerificationModal = ({
	modalVisible,
	setModalVisible,
	successful,
	requestMessage,
	handler,
}) => {
	const buttonHandler = () => {
		Keyboard.dismiss();
		if (successful) {
			handler();
		}
		setModalVisible(false);
	};

	return (
		<>
			<Modal animationType="slide" visible={modalVisible} transparent={true}>
				<ModalContainer>
					{!successful && (
						<FailContent
							errorMsg={requestMessage}
							buttonHandler={buttonHandler}
						/>
					)}
					{successful && <SuccessContent buttonHandler={buttonHandler} />}
				</ModalContainer>
			</Modal>
		</>
	);
};

const SuccessContent = ({ buttonHandler }) => {
	return (
		<ModalView>
			<StatusBar style="dark" />
			<Ionicons
				name="checkmark-circle"
				size={100}
				color={COLORS.emeraldGreen}
			/>

			<PageTitle
				style={{ fontSize: 25, color: COLORS.darkGrey, marginBottom: 10 }}>
				Verified!
			</PageTitle>

			<InfoText style={{ marginBottom: 15 }}>
				Your account has been successfully verified.
			</InfoText>

			<StyledButton
				style={{ backgroundColor: COLORS.emeraldGreen, flexDirection: 'row' }}
				onPress={buttonHandler}>
				<ButtonText>Continue</ButtonText>
			</StyledButton>
		</ModalView>
	);
};

const FailContent = ({ errorMsg, buttonHandler }) => {
	return (
		<ModalView>
			<StatusBar style="dark" />
			<Ionicons name="close-circle" size={100} color={COLORS.errorRed} />

			<PageTitle
				style={{ fontSize: 25, color: COLORS.darkGrey, marginBottom: 10 }}>
				Failed!
			</PageTitle>

			<InfoText style={{ marginBottom: 15 }}>
				{`Oops! Account verification failed. ${errorMsg}`}
			</InfoText>

			<StyledButton
				style={{ backgroundColor: COLORS.errorRed, flexDirection: 'row' }}
				onPress={buttonHandler}>
				<ButtonText>Try Again</ButtonText>
			</StyledButton>
		</ModalView>
	);
};

export default VerificationModal;
