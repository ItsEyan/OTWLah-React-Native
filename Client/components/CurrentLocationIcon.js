import { View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import COLORS from '../constants/colors';

const CurrentLocationIcon = () => {
	return (
		<View>
			<Svg
				height={20}
				width={20}
				style={{
					elevation: 2,
				}}>
				<Ellipse
					cx="9"
					cy="9"
					rx="9"
					ry="9"
					fill={COLORS.primary}
					stroke="#fff"
					strokeWidth="2"
					translateX={1}
					translateY={1}
				/>
			</Svg>
		</View>
	);
};

export default CurrentLocationIcon;
