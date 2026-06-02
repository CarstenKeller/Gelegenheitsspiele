import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import SpaceInvadersScreen from './screens/SpaceInvadersScreen';
import DonkeyKongScreen from './screens/DonkeyKongScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SpaceInvaders" component={SpaceInvadersScreen} />
        <Stack.Screen name="DonkeyKong" component={DonkeyKongScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
