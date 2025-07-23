document.addEventListener('DOMContentLoaded', () => {
    let airports = {};
  
    async function carregarAeroportos() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json');
        if (!response.ok) throw new Error('Falha ao carregar airports.json');
        airports = await response.json();
      } catch (e) {
        console.error('Erro ao carregar arquivo de aeroportos:', e);
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
  
    function validarCampos() {
      const nome = document.getElementById("nome").value.trim();
      const ida = document.getElementById("ida").value.trim();
      const dataIda = document.getElementById("dataIda").value;
      const dataVolta = document.getElementById("dataVolta").value;
      const valorStr = document.getElementById("valor").value.trim();
  
      if (!nome) {
        alert("Por favor, preencha o nome do passageiro.");
        return false;
      }
      if (!ida) {
        alert("Por favor, preencha a origem/destino da ida.");
        return false;
      }
      if (!dataIda) {
        alert("Por favor, preencha a data e hora da ida.");
        return false;
      }
      if (valorStr) {
        const valor = parseFloat(valorStr);
        if (isNaN(valor) || valor < 0) {
          alert("Por favor, preencha um valor total válido e positivo.");
          return false;
        }
      }
      if (dataVolta && dataIda > dataVolta) {
        alert("A data/hora da ida não pode ser depois da volta.");
        return false;
      }
  
      return true;
    }
  
    async function gerarPDF() {
      if (!validarCampos()) {
        return;
      }
  
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
  
      const nome = document.getElementById("nome").value;
      const ida = document.getElementById("ida").value;
      const dataIda = document.getElementById("dataIda").value;
      const volta = document.getElementById("volta").value;
      const dataVolta = document.getElementById("dataVolta").value;
      const hotel = document.getElementById("hotel").value;
      const checkin = document.getElementById("checkin").value;
      const checkout = document.getElementById("checkout").value;
  
      const valorRaw = parseFloat(document.getElementById("valor").value);
      const valorFormatado = (!isNaN(valorRaw)) ? valorRaw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00";
  
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(66, 62, 139);
      doc.text("MC VIAGENS - VOUCHER DE RESERVA", 20, 20);
  
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      doc.text(`Passageiro: ${nome}`, 20, 35);
      doc.text(`Ida: ${ida}`, 20, 45);
      doc.text(`Data/Hora Ida: ${dataIda}`, 20, 52);
      doc.text(`Volta: ${volta}`, 20, 62);
      doc.text(`Data/Hora Volta: ${dataVolta}`, 20, 69);
      doc.text(`Hotel: ${hotel}`, 20, 79);
      doc.text(`Check-in: ${checkin}`, 20, 86);
      doc.text(`Check-out: ${checkout}`, 20, 93);
      doc.text(`Valor total: ${valorFormatado}`, 20, 103);
  
      doc.setTextColor(120);
      doc.setFontSize(10);
      doc.text("Contato: mcturismoviagens@gmail.com | (11) 9xxxx-xxxx", 20, 113);
  
      doc.save('voucher.pdf');
    }
  
    carregarAeroportos();
  
    autocomplete(document.getElementById("ida"), document.getElementById("ida-suggestions"));
    autocomplete(document.getElementById("volta"), document.getElementById("volta-suggestions"));
  
    document.getElementById("gerarBtn").addEventListener("click", gerarPDF);
  });  