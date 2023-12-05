import { StatusBar } from 'react-native';
import styled from 'styled-components';
import COLORS from '../constants/colors';

const StatusBarHeight = StatusBar.currentHeight;

export const StyledContainer = styled.View`
	flex: 1;
	padding: 25px;
	padding-top: ${StatusBarHeight + 30}px;
	background-color: ${COLORS.white};
`;

export const PageTitle = styled.Text`
	font-size: 30px;
	font-weight: bold;
	color: ${COLORS.primary};
	padding: 10px;
	text-align: center;

	${(props) =>
		props.welcome &&
		`
        font-size: 35px;
        `}
`;

export const InfoText = styled.Text`
	color: ${COLORS.grey};
	font-size: 15px;
	text-align: center;
`;

export const EmphasiseText = styled.Text`
	font-weight: bold;
	font-style: italic;
`;

export const InLineGroup = styled.View`
	flex-direction: row;
	padding: 10px;
	justify-content: center;
	align-items: center;
`;

export const TextLink = styled.TouchableOpacity`
	justify-content: center;
	align-items: center;
`;

export const TextLinkContent = styled.Text`
	color: ${COLORS.primary};
	font-size: 15px;

	${(props) => {
		const { resendStatus } = props;
		if (resendStatus === 'Failed!') {
			return `color: ${COLORS.errorRed};`;
		} else if (resendStatus === 'Sent!') {
			return `color: ${COLORS.emeraldGreen};`;
		}
	}}
`;

//modal styles
export const ModalContainer = styled(StyledContainer)`
	justify-content: center;
	align-items: center;
	background-color: rgba(0, 0, 0, 0.7);
`;

export const ModalView = styled.View`
	margin: 20px;
	background-color: ${COLORS.white};
	elevation: 5;
	border-radius: 20px;
	padding: 35px;
	align-items: center;
	shadow-color: #000;
	shadow-offset: 0px 2px;
	shadow-opacity: 0.25;
	shadow-radius: 4px;
	width: 100%;
`;

//button styles

export const StyledButton = styled.TouchableOpacity`
	padding: 15px;
	background-color: ${COLORS.primary};
	justify-content: center;
	align-items: center;
	border-radius: 5px;
	margin-vertical: 5px;
	height: 50px;

	${(props) =>
		props.google == true &&
		`
        background-color: ${COLORS.lightPurple};
        flex-direction: row;
        justify-content: center;
        `}
`;

export const ButtonText = styled.Text`
	font-size: 18px;
	color: ${COLORS.white};

	${(props) =>
		props.google == true &&
		`
        padding-left: 25px;
        `}
`;
