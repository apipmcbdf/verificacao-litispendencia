/* script.js */
// Configuração do Firebase
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

// Elementos do DOM
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

// Exibir ou ocultar detalhes de VPE conforme a seleção
vpeSelect.addEventListener("change", () => {
  vpeDetalhes.classList.toggle("hidden", vpeSelect.value !== "sim");
});

// Exibir ou ocultar detalhes do Auxílio Moradia conforme a seleção
auxSelect.addEventListener("change", () => {
  auxDetalhes.classList.toggle("hidden", auxSelect.value !== "sim");
});

// Função de login
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

// Carregar lista de CPFs pendentes
async function loadCpfs() {
  cpfList.innerHTML = "";
  const snapshot = await db.collection("cpfsPendentes").get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    const vpePendente = !data.vpe?.litispendencia;
    const auxPendente = !data.auxilio?.litispendencia;
    if (vpePendente || auxPendente) {
      const li = document.createElement("li");
      li.textContent = data.cpf;
      li.addEventListener("click", () => loadDetails(doc.id));
      cpfList.appendChild(li);
    }
  });
}

// Carregar detalhes de um CPF selecionado
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

    // Exibir a seção VPE se ainda não tiver sido verificada
    if (!data.vpe?.litispendencia) {
      vpeSelect.value = "";
      vpeDetalhes.classList.add("hidden");
      document.getElementById("vpe-litis").parentElement.classList.remove("hidden");
    } else {
      document.getElementById("vpe-litis").parentElement.classList.add("hidden");
    }

    // Exibir a seção Auxílio Moradia se ainda não tiver sido verificada
    if (!data.auxilio?.litispendencia) {
      auxSelect.value = "";
      auxDetalhes.classList.add("hidden");
      document.getElementById("aux-litis").parentElement.classList.remove("hidden");
    } else {
      document.getElementById("aux-litis").parentElement.classList.add("hidden");
    }

    detailsContainer.classList.remove("hidden");
  }
}

// Enviar dados verificados
enviarBtn.addEventListener("click", async () => {
  if (!currentDocId) return;

  const vpeLitis = vpeSelect.value;
  const auxLitis = auxSelect.value;

  if (!vpeSelect.parentElement.classList.contains("hidden") && !vpeLitis) {
    formMsg.textContent = "⚠️ Selecione SIM, NÃO ou N/A para VPE.";
    formMsg.style.color = "red";
    return;
  }

  if (!auxSelect.parentElement.classList.contains("hidden") && !auxLitis) {
    formMsg.textContent = "⚠️ Selecione SIM, NÃO ou N/A para Auxílio Moradia.";
    formMsg.style.color = "red";
    return;
  }

  const updateData = {
    responsavel: firebase.auth().currentUser ? firebase.auth().currentUser.email : "desconhecido"
  };

  if (!vpeSelect.parentElement.classList.contains("hidden")) {
    updateData.vpe = {
      litispendencia: vpeLitis,
      processo: vpeLitis === "sim" ? document.getElementById("vpe-processo").value : "",
      advogado: vpeLitis === "sim" ? document.getElementById("vpe-advogado").value : "",
      observacoes: vpeLitis === "sim" ? document.getElementById("vpe-observacoes").value : ""
    };
  }

  if (!auxSelect.parentElement.classList.contains("hidden")) {
    updateData.auxilio = {
      litispendencia: auxLitis,
      processo: auxLitis === "sim" ? document.getElementById("aux-processo").value : "",
      advogado: auxLitis === "sim" ? document.getElementById("aux-advogado").value : "",
      observacoes: auxLitis === "sim" ? document.getElementById("aux-observacoes").value : ""
    };
  }

  // Marcar como verificado se ambos já estiverem preenchidos ou forem preenchidos agora
  const doc = await db.collection("cpfsPendentes").doc(currentDocId).get();
  const existing = doc.data();
  const vpeChecked = vpeLitis || existing.vpe?.litispendencia;
  const auxChecked = auxLitis || existing.auxilio?.litispendencia;
  if (vpeChecked && auxChecked) {
    updateData.verificado = true;
  }

  await db.collection("cpfsPendentes").doc(currentDocId).update(updateData);

  formMsg.textContent = "✅ Informações salvas com sucesso.";
  formMsg.style.color = "green";
  detailsContainer.classList.add("hidden");
  loadCpfs();
});
