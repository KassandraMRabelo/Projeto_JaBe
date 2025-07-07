const form = document.getElementById('adm-login-form');
const passwordInput = document.getElementById('admin-password');
const message = document.getElementById('login-message');

const senhaCorreta = "delegacia123";

form.addEventListener('submit', function (e) {
  e.preventDefault();

  if (passwordInput.value === senhaCorreta) {
    message.style.color = 'green';
    message.textContent = 'Acesso autorizado!';
    setTimeout(() => {
      window.location.href = "index.html"; 
    }, 1000);
  } else {
    message.style.color = 'red';
    message.textContent = 'Senha incorreta.';
    passwordInput.value = '';
  }
});