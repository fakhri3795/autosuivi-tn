import { Stack } from 'expo-router';
import { Colors } from '../../src/core/constants';

export default function VehiclesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
