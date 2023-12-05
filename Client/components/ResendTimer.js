import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import COLORS from '../constants/colors';
import {
	EmphasiseText,
	InLineGroup,
	InfoText,
	TextLink,
	TextLinkContent,
} from './styles';

const ResendTimer = ({
	activeResend,
	resendEmail,
	resendingEmail,
	resendStatus,
	timeLeft,
	targetTime,
}) => {
	return (
		<View>
			<InLineGroup>
				<InfoText>Didn't receive the email? </InfoText>

				{!resendingEmail && (
					<TextLink
						style={{ opacity: !activeResend && 0.5 }}
						disabled={!activeResend}
						onPress={resendEmail}>
						<TextLinkContent
							resendStatus={resendStatus}
							style={{ textDecorationLine: 'underline' }}>
							{resendStatus}
						</TextLinkContent>
					</TextLink>
				)}

				{resendingEmail && (
					<TextLink disabled>
						<TextLinkContent>
							<ActivityIndicator color={COLORS.primary} />
						</TextLinkContent>
					</TextLink>
				)}
			</InLineGroup>

			{!activeResend && (
				<InfoText>
					in
					<EmphasiseText> {`${timeLeft || targetTime}`} </EmphasiseText>
					seconds
				</InfoText>
			)}
		</View>
	);
};

export default ResendTimer;
