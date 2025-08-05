// Novo app.js com suporte a idioma (Português/Inglês)
document.addEventListener('DOMContentLoaded', () => {
  let airports = {};

  lucide.createIcons(); // <- chama aqui para garantir que os ícones serão aplicados

  const traducoes = {
    pt: {
      passageiros: "Passageiros",
      viagem: "Dados da Viagem",
      ida: "Ida",
      volta: "Volta",
      dataIda: "Data/Hora Ida",
      dataVolta: "Data/Hora Volta",
      hospedagem: "Hospedagem",
      hotel: "Hotel",
      checkin: "Check-in",
      checkout: "Check-out",
      pagamento: "Pagamento",
      valor: "Valor Total",
      contato: "Contato",
      emitido: "Emitido em"
    },
    en: {
      passageiros: "Passengers",
      viagem: "Trip Details",
      ida: "Departure",
      volta: "Return",
      dataIda: "Departure Date/Time",
      dataVolta: "Return Date/Time",
      hospedagem: "Accommodation",
      hotel: "Hotel",
      checkin: "Check-in",
      checkout: "Check-out",
      pagamento: "Payment",
      valor: "Total Amount",
      contato: "Contact",
      emitido: "Issued on"
    }
  };
  

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

  function formatarData(dataISO) {
    if (!dataISO) return "";
    const [ano, mes, diaHora] = dataISO.split("-");
    const [dia, hora] = diaHora.split("T");
    return `${dia}/${mes}/${ano}${hora ? ` ${hora}` : ''}`;
  }

  function gerarDataHoraAtual() {
    const agora = new Date();
    return agora.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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
  
    const idioma = document.getElementById("idioma").value;
    const t = traducoes[idioma] || traducoes.pt;
  
    const nomes = [...document.querySelectorAll(".nome")].map(el => el.value.trim());
    const ida = document.getElementById("ida").value;
    const dataIda = formatarData(document.getElementById("dataIda").value);
    const volta = document.getElementById("volta").value;
    const dataVolta = formatarData(document.getElementById("dataVolta").value);
    const hotel = document.getElementById("hotel").value;
    const checkin = formatarData(document.getElementById("checkin").value);
    const checkout = formatarData(document.getElementById("checkout").value);
    const valor = document.getElementById("valor").value;
    const emissao = gerarDataHoraAtual();
  
    // Preenche o conteúdo do layout oculto
    document.getElementById("emissaoData").innerText = emissao;
    document.getElementById("voucherContent").innerHTML = `
      <h3>🧍 Passageiros</h3>
      <ul>${nomes.map(n => `<li>${n}</li>`).join('')}</ul>
  
      <h3>✈️ Dados da Viagem</h3>
      <p><strong>Ida:</strong> ${ida}</p>
      <p><strong>Data/Hora Ida:</strong> ${dataIda}</p>
      ${volta ? `<p><strong>Volta:</strong> ${volta}</p>` : ""}
      ${dataVolta ? `<p><strong>Data/Hora Volta:</strong> ${dataVolta}</p>` : ""}
  
      <h3>🏨 Hospedagem</h3>
      ${hotel ? `<p><strong>Hotel:</strong> ${hotel}</p>` : ""}
      ${checkin ? `<p><strong>Check-in:</strong> ${checkin}</p>` : ""}
      ${checkout ? `<p><strong>Check-out:</strong> ${checkout}</p>` : ""}
  
      <h3>💰 Pagamento</h3>
      <p><strong>Valor total:</strong> ${valor}</p>
    `;
  
    // Renderiza o layout invisível
    const layout = document.getElementById("voucherLayout");
    layout.style.display = "block";
  
    // Gera imagem do conteúdo
    const canvas = await html2canvas(layout, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
  
    // Aqui está a CORREÇÃO FINAL: importar jsPDF corretamente
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");
  
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;
  
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);
    pdf.save("voucher.pdf");
  
    layout.style.display = "none";
  }  

  const valorInput = document.getElementById("valor");
  valorInput.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length === 0) valor = "000";
    if (valor.length === 1) valor = "00" + valor;
    if (valor.length === 2) valor = "0" + valor;
    const valorNumerico = parseFloat(valor) / 100;
    const valorFormatado = valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    e.target.value = valorFormatado;
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

  const primeiro = document.querySelector(".passageiro");
  const corrigido = criarCampoPassageiro();
  primeiro.replaceWith(corrigido);

  carregarAeroportos();
  autocomplete(document.getElementById("ida"), document.getElementById("ida-suggestions"));
  autocomplete(document.getElementById("volta"), document.getElementById("volta-suggestions"));
  document.getElementById("gerarBtn").addEventListener("click", gerarPDF);
});