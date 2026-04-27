import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen'; // Asigură-te că drumul e corect către fișierul creat de tine

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <LoginScreen />
      <StatusBar style="light" />
    </View>
  );
}