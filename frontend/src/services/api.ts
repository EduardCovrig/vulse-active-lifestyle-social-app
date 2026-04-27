import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ IMPORTANT: Când testați local pe telefon fizic, pune IP-ul laptopului unde rulează backend-ul.
// Nu folosi "localhost" pentru că telefonul va crede că te referi la el însuși.
const API_URL = 'http://192.168.X.X:8080/api'; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// "Magia" care interceptează orice request și adaugă JWT-ul automat
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('vulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);  