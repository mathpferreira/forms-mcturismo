document.addEventListener('DOMContentLoaded', () => {
  let airports = {};

  // --- Carregar aeroportos ---
  async function carregarAeroportos() {
    try {
      const response = await fetch('https://raw.githubusercontent.com/mwgg/Airports/master/airports.json');
      if (!response.ok) throw new Error('Falha ao carregar airports.json');
      airports = await response.json();
    } catch (e) {
      console.error('Erro ao carregar arquivo de aeroportos:', e);
    }
  }

  // --- Autocomplete ---
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

  // --- Passageiros ---
  const passageirosContainer = document.getElementById('passageiros-container');
  const addPassageiroBtn = document.getElementById('add-passageiro-btn');

  function criarPassageiroInput(valor = '') {
    const div = document.createElement('div');
    div.className = 'passageiro-input';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nome do passageiro';
    input.value = valor;

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.textContent = 'x';
    btnRemover.title = 'Remover passageiro';
    btnRemover.onclick = () => {
      passageirosContainer.removeChild(div);
    };

    div.appendChild(input);
    div.appendChild(btnRemover);
    return div;
  }

  function inicializarPassageiros() {
    passageirosContainer.innerHTML = '';
    passageirosContainer.appendChild(criarPassageiroInput());
  }

  addPassageiroBtn.addEventListener('click', () => {
    passageirosContainer.appendChild(criarPassageiroInput());
  });

  // --- Validação básica ---
  function validarCampos() {
    const passageiros = Array.from(passageirosContainer.querySelectorAll('input'))
      .map(i => i.value.trim())
      .filter(Boolean);

    if (passageiros.length === 0) {
      alert('Adicione pelo menos um passageiro.');
      return false;
    }

    const valorStr = document.getElementById('valor').value.trim();
    const valor = valorStr ? parseFloat(valorStr) : NaN;

    if (isNaN(valor) || valor < 0) {
      alert('Valor total inválido.');
      return false;
    }

    return true;
  }

  // --- Traduções para PDF ---
  const textos = {
    pt: {
      titulo: 'Voucher - MC Viagens',
      passageiros: 'Passageiros',
      origemDestino: 'Origem / Destino',
      dataHora: 'Data e Hora',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      valorTotal: 'Valor total (R$)',
      hospedagemEVoo: 'Hospedagem e voo juntos',
      vooIda: 'Voo Ida',
      vooVolta: 'Voo Volta',
      voucherCriadoEm: 'Voucher criado em',
      btnBaixarPdf: 'Baixar PDF'
    },
    en: {
      titulo: 'Voucher - MC Travel',
      passageiros: 'Passengers',
      origemDestino: 'Origin / Destination',
      dataHora: 'Date and Time',
      hotel: 'Hotel',
      checkin: 'Check-in',
      checkout: 'Check-out',
      valorTotal: 'Total Value (R$)',
      hospedagemEVoo: 'Hotel and flight together',
      vooIda: 'Departure Flight',
      vooVolta: 'Return Flight',
      voucherCriadoEm: 'Voucher created on',
      btnBaixarPdf: 'Download PDF'
    }
  };

  // --- Formatar data local ---
  function formatarDataLocal(dateStr, locale) {
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false
    }).format(date);
  }

  // --- Salvar histórico no localStorage ---
  function salvarHistorico(voucher) {
    let historico = JSON.parse(localStorage.getItem('historicoVouchers') || '[]');
    historico.push(voucher);
    localStorage.setItem('historicoVouchers', JSON.stringify(historico));
  }

  // --- Carregar histórico ---
  function carregarHistorico() {
    const historicoDiv = document.getElementById('historico-vouchers');
    historicoDiv.innerHTML = '';

    let historico = JSON.parse(localStorage.getItem('historicoVouchers') || '[]');
    if (historico.length === 0) {
      historicoDiv.textContent = 'Nenhum voucher criado ainda.';
      return;
    }

    historico.slice().reverse().forEach((v, i) => {
      const div = document.createElement('div');
      div.className = 'voucher-entry';

      const dataCriado = new Date(v.criadoEm).toLocaleString();

      div.innerHTML = `
        <strong>${textos[v.idioma].titulo}</strong><br/>
        <small>${textos[v.idioma].voucherCriadoEm}: ${dataCriado}</small><br/>
        Passageiros: ${v.passageiros.join(', ')}<br/>
        Valor: R$ ${v.valor.toFixed(2)}<br/>
      `;

      const btnPdf = document.createElement('button');
      btnPdf.textContent = textos[v.idioma].btnBaixarPdf;
      btnPdf.onclick = () => {
        gerarPdf(v);
      };

      div.appendChild(btnPdf);
      historicoDiv.appendChild(div);
    });
  }

  // --- Gerar PDF ---
  async function gerarPdf(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const t = textos[data.idioma];
    const locale = data.idioma === 'pt' ? 'pt-BR' : 'en-US';

    doc.setFontSize(20);
    doc.text(t.titulo, 20, 20);

    doc.setFontSize(12);
    let y = 40;

    doc.text(`${t.passageiros}:`, 20, y);
    y += 8;
    data.passageiros.forEach((p) => {
      doc.text(`- ${p}`, 25, y);
      y += 7;
    });

    y += 5;
    doc.text(`${t.origemDestino} (Ida): ${data.ida}`, 20, y);
    y += 8;
    doc.text(`${t.dataHora} (Ida): ${formatarDataLocal(data.dataIda, locale)}`, 20, y);
    y += 10;

    if (data.volta) {
      doc.text(`${t.origemDestino} (Volta): ${data.volta}`, 20, y);
      y += 8;
      doc.text(`${t.dataHora} (Volta): ${formatarDataLocal(data.dataVolta, locale)}`, 20, y);
      y += 10;
    }

    if (data.hotel) {
      doc.text(`${t.hotel}: ${data.hotel}`, 20, y);
      y += 8;
      doc.text(`${t.checkin}: ${data.checkin}`, 20, y);
      y += 8;
      doc.text(`${t.checkout}: ${data.checkout}`, 20, y);
      y += 10;
    }

    doc.text(`${t.valorTotal}: R$ ${data.valor.toFixed(2)}`, 20, y);
    y += 15;

    const criadoEmStr = new Date(data.criadoEm).toLocaleString(locale);
    doc.setFontSize(10);
    doc.text(`${t.voucherCriadoEm}: ${criadoEmStr}`, 20, y);

    // Gerar e baixar PDF
    doc.save(`voucher-${Date.now()}.pdf`);
  }

  // --- Geração dos dados do voucher e download ---
  function gerarVoucher() {
    if (!validarCampos()) return;

    const passageiros = Array.from(passageirosContainer.querySelectorAll('input'))
      .map(i => i.value.trim())
      .filter(Boolean);

    const idioma = document.getElementById('idioma').value;
    const ida = document.getElementById('ida').value.trim();
    const dataIda = document.getElementById('dataIda').value;
    const volta = document.getElementById('volta').value.trim();
    const dataVolta = document.getElementById('dataVolta').value;
    const hotel = document.getElementById('hotel').value.trim();
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const valorStr = document.getElementById('valor').value.trim();
    const valor = valorStr ? parseFloat(valorStr) : 0;

    const voucherData = {
      passageiros,
      idioma,
      ida,
      dataIda,
      volta,
      dataVolta,
      hotel,
      checkin,
      checkout,
      valor,
      criadoEm: new Date().toISOString()
    };

    salvarHistorico(voucherData);
    carregarHistorico();

    gerarPdf(voucherData);
  }

  // --- Inicialização ---
  async function init() {
    await carregarAeroportos();

    autocomplete(document.getElementById('ida'), document.getElementById('ida-suggestions'));
    autocomplete(document.getElementById('volta'), document.getElementById('volta-suggestions'));

    inicializarPassageiros();
    carregarHistorico();

    document.getElementById('gerarBtn').addEventListener('click', gerarVoucher);
  }

  init();
});
