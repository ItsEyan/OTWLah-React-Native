import { BlurView } from 'expo-blur';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgressBar from './ProgressBar';

const Uploading = ({ image, progress, setCanceled }) => {
	return (
		<View
			style={[
				StyleSheet.absoluteFill,
				{ alignItems: 'center', justifyContent: 'center', zIndex: 1 },
			]}>
			<BlurView tint="dark" style={StyleSheet.absoluteFill}></BlurView>
			<BlurView
				style={{
					width: '70%',
					alignItems: 'center',
					paddingVertical: 16,
					rowGap: 12,
					overflow: 'hidden',
					borderRadius: 14,
				}}
				tint="light">
				{image && (
					<Image
						source={{ uri: image }}
						style={{
							width: 100,
							height: 100,
							resizeMode: 'contain',
							borderRadius: 6,
						}}
					/>
				)}
				<Text style={{ fontSize: 16 }}>Uploading...</Text>
				<ProgressBar progress={progress} />
				<View
					style={{
						height: 1,
						borderWidth: StyleSheet.hairlineWidth,
						width: '100%',
						borderColor: '#00000020',
					}}
				/>
				<TouchableOpacity
					style={{ width: '100%' }}
					onPress={() => setCanceled(true)}>
					<Text
						style={{
							fontWeight: '500',
							color: '#3478F6',
							fontSize: 17,
							textAlign: 'center',
						}}>
						Cancel
					</Text>
				</TouchableOpacity>
			</BlurView>
		</View>
	);
};

const styles = StyleSheet.create({});

export default Uploading;
