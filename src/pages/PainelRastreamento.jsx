
import React, { useState } from 'react';
const PainelRastreamento = () => {
  const [dadosTexto, setDadosTexto] = useState("");
  const [rastreios, setRastreios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const consultarCorreios = async (codigo, usuario, senha) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:res="http://resource.webservice.correios.com.br/">
        <soapenv:Header/>
        <soapenv:Body>
          <res:buscaEventosLista>
            <usuario>${usuario}</usuario>
            <senha>${senha}</senha>
            <tipo>L</tipo>
            <resultado>T</resultado>
            <lingua>101</lingua>
            <objetos>${codigo}</objetos>
          </res:buscaEventosLista>
        </soapenv:Body>
      </soapenv:Envelope>`;

    const response = await fetch("https://webservice.correios.com.br/service/rastro", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": ""
      },
      body: xml
    });

    const text = await response.text();
    return text;
  };

  const extrairStatus = (xml) => {
    const match = xml.match(/<descricao>(.*?)<\/descricao>/);
    return match ? match[1] : "Desconhecido";
  };

  const processarImportacao = async () => {
    setCarregando(true);
    const linhas = dadosTexto.trim().split("\n");
    const resultadoFinal = [];

    for (const linha of linhas) {
      const [nome, codigo] = linha.split(" ");
      try {
        const xml = await consultarCorreios(codigo, "Contato@gbgroupbrasil.com", "TetaAmiga3030@");
        const statusFiltrado = extrairStatus(xml);
        resultadoFinal.push({ nome, codigo, xml, status: statusFiltrado });
      } catch (e) {
        resultadoFinal.push({ nome, codigo, xml: "Erro ao consultar", status: "Erro" });
      }
    }
    setRastreios(resultadoFinal);
    setCarregando(false);
  };

  const rastreiosFiltrados = filtroStatus === "todos" ? rastreios : rastreios.filter(r => r.status === filtroStatus);
  const statusUnicos = [...new Set(rastreios.map(r => r.status))];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Importar Rastreios</h2>
      <textarea
        rows={6}
        style={{ width: '100%' }}
        placeholder="Exemplo:\nBlackviewBV9300PROB NM870750087BR"
        value={dadosTexto}
        onChange={(e) => setDadosTexto(e.target.value)}
      />
      <br />
      <button onClick={processarImportacao} disabled={carregando}>
        {carregando ? "Consultando..." : "Consultar Rastreios"}
      </button>
      <br /><br />
      <label>Status: </label>
      <select onChange={(e) => setFiltroStatus(e.target.value)}>
        <option value="todos">Todos</option>
        {statusUnicos.map((s, i) => (
          <option key={i} value={s}>{s}</option>
        ))}
      </select>
      <div>
        {rastreiosFiltrados.map((item, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <strong>{item.nome}</strong> - {item.codigo} <em>[{item.status}]</em>
            <pre style={{ fontSize: '12px', overflowX: 'auto' }}>{item.xml}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PainelRastreamento;
