import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBm2tNNTSxkxZ8XglEMKON_fjziVv0P7bA",
  authDomain: "login-com-903a8.firebaseapp.com",
  projectId: "login-com-903a8",
  storageBucket: "login-com-903a8.firebasestorage.app",
  messagingSenderId: "277723018737",
  appId: "1:277723018737:web:86042da8e5712361e58050",
  measurementId: "G-RY9XL6WHKF"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Evento de clique no botão do Google
document.querySelector(".btn-login.google").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      alert(`Login com Google bem-sucedido! Bem-vinda, ${user.displayName}`);
    })
    .catch((error) => {
      alert("Erro ao fazer login com o Google.\n" + error.message);
      console.error(error);
    });
});
