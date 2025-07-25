document.addEventListener('DOMContentLoaded', () => {
  let airports = {};

  async function carregarAeroportos() {
    try {
      const response = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json');
      airports = await response.json();
    } catch (e) {
      mostrarErro('Erro ao carregar dados de aeroportos.');
    }
  }

  function autocomplete(inputElem, suggestionsElem) {
    inputElem.addEventListener('input', () => {
      const val = inputElem.value.trim().toLowerCase();
      suggestionsElem.innerHTML = '';
      if (!val || Object.keys(airports).length === 0) {
        suggestionsElem.style.display = 'none';
        return;
      }

      const resultados = Object.entries(airports).filter(([code, info]) => {
        const searchable = [code, info.name, info.city, info.country].join(' ').toLowerCase();
        return searchable.includes(val);
      }).slice(0, 10);

      if (resultados.length === 0) {
        suggestionsElem.style.display = 'none';
        return;
      }

      resultados.forEach(([code, info]) => {
        const div = document.createElement('div');
        div.classList.add('autocomplete-suggestion');
        div.textContent = `${code} - ${info.name} (${info.city}, ${info.country})`;
        div.onclick = () => {
          inputElem.value = `${code} - ${info.name}`;
          suggestionsElem.innerHTML = '';
          suggestionsElem.style.display = 'none';
        };
        suggestionsElem.appendChild(div);
      });

      suggestionsElem.style.display = 'block';
    });

    document.addEventListener('click', e => {
      if (!suggestionsElem.contains(e.target) && e.target !== inputElem) {
        suggestionsElem.style.display = 'none';
      }
    });
  }

  function mostrarErro(msg) {
    const erro = document.getElementById("erro");
    erro.innerText = msg;
    erro.style.display = "block";
  }

  function limparErro() {
    const erro = document.getElementById("erro");
    erro.innerText = "";
    erro.style.display = "none";
  }

  function validarCampos() {
    const nomes = document.querySelectorAll(".nome");
    const ida = document.getElementById("ida").value.trim();
    const dataIda = document.getElementById("dataIda").value;
    const dataVolta = document.getElementById("dataVolta").value;
    const valorStr = document.getElementById("valor").value.trim().replace('R$', '').replace(',', '.');

    for (const nomeInput of nomes) {
      if (!nomeInput.value.trim()) {
        mostrarErro("Por favor, preencha o nome de todos os passageiros.");
        return false;
      }
    }
    if (!ida) {
      mostrarErro("Por favor, preencha a origem/destino da ida.");
      return false;
    }
    if (!dataIda) {
      mostrarErro("Por favor, preencha a data e hora da ida.");
      return false;
    }
    if (valorStr) {
      const valor = parseFloat(valorStr);
      if (isNaN(valor) || valor < 0) {
        mostrarErro("Por favor, preencha um valor total válido e positivo.");
        return false;
      }
    }
    if (dataVolta && dataIda > dataVolta) {
      mostrarErro("A data/hora da ida não pode ser depois da volta.");
      return false;
    }

    limparErro();
    return true;
  }

  async function gerarPDF() {
    if (!validarCampos()) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const nomes = [...document.querySelectorAll(".nome")].map(el => el.value.trim());
    const ida = document.getElementById("ida").value;
    const dataIda = document.getElementById("dataIda").value;
    const volta = document.getElementById("volta").value;
    const dataVolta = document.getElementById("dataVolta").value;
    const hotel = document.getElementById("hotel").value;
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;

    const valorRaw = parseFloat(document.getElementById("valor").value.replace('R$', '').replace(',', '.'));
    const valorFormatado = (!isNaN(valorRaw)) ? valorRaw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(66, 62, 139);
    doc.text("MC VIAGENS - VOUCHER DE RESERVA", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    nomes.forEach((n, i) => {
      doc.text(`Passageiro ${i + 1}: ${n}`, 20, 35 + i * 7);
    });

    const offset = 35 + nomes.length * 7 + 5;
    doc.text(`Ida: ${ida}`, 20, offset);
    doc.text(`Data/Hora Ida: ${dataIda}`, 20, offset + 7);
    doc.text(`Volta: ${volta}`, 20, offset + 14);
    doc.text(`Data/Hora Volta: ${dataVolta}`, 20, offset + 21);
    doc.text(`Hotel: ${hotel}`, 20, offset + 31);
    doc.text(`Check-in: ${checkin}`, 20, offset + 38);
    doc.text(`Check-out: ${checkout}`, 20, offset + 45);
    doc.text(`Valor total: ${valorFormatado}`, 20, offset + 55);

    doc.setTextColor(120);
    doc.setFontSize(10);
    doc.text("Contato: mcturismoviagens@gmail.com | (11) 9xxxx-xxxx", 20, offset + 65);

    doc.save('voucher.pdf');
  }

  function formatarMoeda(valor) {
    const numero = parseFloat(valor.replace(/[^0-9]/g, "")) / 100;
    if (isNaN(numero)) return "";
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const valorInput = document.getElementById("valor");
  valorInput.addEventListener("input", (e) => {
    const cursor = e.target.selectionStart;
    const formatado = formatarMoeda(e.target.value);
    e.target.value = formatado;
    e.target.setSelectionRange(cursor, cursor);
  });

  function criarCampoPassageiro() {
    const div = document.createElement("div");
    div.className = "passageiro";
    div.innerHTML = `
      <label>Nome do Passageiro</label>
      <input type="text" class="nome" />
      <button type="button" class="remover">🗑️ Remover</button>
    `;
    div.querySelector(".remover").addEventListener("click", () => {
      const todos = document.querySelectorAll(".passageiro");
      if (todos.length > 1) {
        div.remove();
      } else {
        mostrarErro("Pelo menos um passageiro deve ser informado.");
      }
    });
    return div;
  }

  document.getElementById("addPassageiro").addEventListener("click", () => {
    const novo = criarCampoPassageiro();
    document.getElementById("passageiros").appendChild(novo);
  });

  // Substitui o primeiro passageiro para já ter botão de remover também
  const primeiro = document.querySelector(".passageiro");
  const corrigido = criarCampoPassageiro();
  primeiro.replaceWith(corrigido);


  carregarAeroportos();
  autocomplete(document.getElementById("ida"), document.getElementById("ida-suggestions"));
  autocomplete(document.getElementById("volta"), document.getElementById("volta-suggestions"));
  document.getElementById("gerarBtn").addEventListener("click", gerarPDF);
});
