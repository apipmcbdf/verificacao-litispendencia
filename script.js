// script.js (com validação e responsável)

// Inicialização do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBar0Am_kiilFZt6RqCn0gk4IyUFH9D8Is",
  authDomain: "verificacao-litispendencia.firebaseapp.com",
  projectId: "verificacao-litispendencia",
  storageBucket: "verificacao-litispendencia.appspot.com",
  messagingSenderId: "508917425774",
  appId: "1:508917425774:web:172b91565d4167ddfba87f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loginScreen = document.getElementById("login-screen");
const mainPanel = document.getElementById("main-panel");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const cpfList = document.getElementById("cpf-list");
const cpfTitle = document.getElementById("cpf-title");
const nomeSpan = document.getElementById("nome");
const cpfSpan = document.getElementById("cpf");
const detailsContainer = document.getElementById("details-container");
const enviarBtn = document.getElementById("enviar-btn");
const formMsg = document.getElementById("form-msg");

const vpeSelect = document.getElementById("vpe-litis");
const vpeDetalhes = document.getElementById("vpe-detalhes");
const auxSelect = document.getElementById("aux-litis");
const auxDetalhes = document.getElementById("aux-detalhes");

let currentDocId = null;

vpeSelect.addEventListener("change", () => {
  vpeDetalhes.classList.toggle("hidden", vpeSelect.value !== "sim");
});
auxSelect.addEventListener("change", () => {
  auxDetalhes.classList.toggle("hidden", auxSelect.value !== "sim");
});

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginScreen.classList.add("hidden");
    mainPanel.classList.remove("hidden");
    loadCpfs();
  } catch (err) {
    loginError.textContent = "Usuário ou senha inválidos.";
  }
});

async function loadCpfs() {
  cpfList.innerHTML = "";
  const snapshot = await db.collection("cpfsPendentes").where("verificado", "!=", true).get();
  console.log("Documentos encontrados:", snapshot.size);
  snapshot.forEach((doc) => {
    console.log("CPF encontrado:", doc.data().cpf);
    const li = document.createElement("li");
    li.textContent = doc.data().cpf;
    li.addEventListener("click", () => loadDetails(doc.id));
    cpfList.appendChild(li);
  });
}

async function loadDetails(docId) {
  const docRef = db.collection("cpfsPendentes").doc(docId);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    const data = docSnap.data();
    cpfTitle.textContent = `Análise de: ${data.nome}`;
    nomeSpan.textContent = data.nome;
    cpfSpan.textContent = data.cpf;
    currentDocId = docId;
    formMsg.textContent = "";
    formMsg.style.color = "green";
    vpeSelect.value = "";
    auxSelect.value = "";
    vpeDetalhes.classList.add("hidden");
    auxDetalhes.classList.add("hidden");
    detailsContainer.classList.remove("hidden");
  }
}

enviarBtn.addEventListener("click", async () => {
  if (!currentDocId) return;

  const vpeLitis = vpeSelect.value;
  const auxLitis = auxSelect.value;

  if (!vpeLitis || !auxLitis) {
    formMsg.textContent = "⚠️ Por favor, selecione SIM, NÃO ou N/A para VPE e Auxílio Moradia.";
    formMsg.style.color = "red";
    return;
  }

  const dataToUpdate = {
    verificado: true,
    vpe: {
      litispendencia: vpeLitis,
      processo: vpeLitis === "sim" ? document.getElementById("vpe-processo").value : "",
      advogado: vpeLitis === "sim" ? document.getElementById("vpe-advogado").value : "",
      observacoes: vpeLitis === "sim" ? document.getElementById("vpe-observacoes").value : ""
    },
    auxilio: {
      litispendencia: auxLitis,
      processo: auxLitis === "sim" ? document.getElementById("aux-processo").value : "",
      advogado: auxLitis === "sim" ? document.getElementById("aux-advogado").value : "",
      observacoes: auxLitis === "sim" ? document.getElementById("aux-observacoes").value : ""
    },
    responsavel: firebase.auth().currentUser ? firebase.auth().currentUser.email : "desconhecido"
  };

  await db.collection("cpfsPendentes").doc(currentDocId).update(dataToUpdate);
  formMsg.textContent = "✅ Informações salvas com sucesso.";
  formMsg.style.color = "green";
  detailsContainer.classList.add("hidden");
  loadCpfs();
});
