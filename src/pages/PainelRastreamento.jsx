// Painel de rastreamento Correios com Firebase Firestore import React, { useState, useEffect } from 'react'; import { initializeApp } from 'firebase/app'; import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = { apiKey: "AIzaSyAx4s2sQ-xFjpMwDy3Z3TFvLdp3xKhlf3M", authDomain: "painelrastreamento.firebaseapp.com", projectId: "painelrastreamento", storageBucket: "painelrastreamento.firebasestorage.app", messagingSenderId: "924456577637", appId: "1:924456577637:web:270b78fa9bfbe925ccf48c" };

const app = initializeApp(firebaseConfig); const db = getFirestore(app);

const PainelRastreamento = () => { const [dadosTexto, setDadosTexto] = useState(""); const [rastreios, setRastreios] = useState([]); const [carregando, setCarregando] = useState(false); const [filtroStatus, setFiltroStatus] = useState("todos");

useEffect(() => { carregarRastreios(); }, []);

const carregarRastreios = async () => { const querySnapshot = await getDocs(collection(db, "rastreios")); const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setRastreios(docs); atualizarTodos(docs); };

const consultarCorreios = async (codigo, usuario, senha) => { const xml = <?xml version="1.0" encoding="UTF-8"?> <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:res="http://resource.webservice.correios.com.br/"> <soapenv:Header/> <soapenv:Body> <res:buscaEventosLista> <usuario>${usuario}</usuario> <senha>${senha}</senha> <tipo>L</tipo> <resultado>T</resultado> <lingua>101</lingua> <objetos>${codigo}</objetos> </res:buscaEventosLista> </soapenv:Body> </soapenv:Envelope>;

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

const categorizarStatus = (descricao) => { if (!descricao) return "Desconhecido"; const desc = descricao.toLowerCase(); if (desc.includes("postado") || desc.includes("recebido na unidade")) return "Postado"; if (desc.includes("em trânsito") || desc.includes("saiu para entrega")) return "Em trânsito"; if (desc.includes("aguardando retirada")) return "Aguardando retirada"; if (desc.includes("entregue")) return "Entregue"; if (desc.includes("tentativa") || desc.includes("não entregue") || desc.includes("devolvido")) return "Alerta"; return "Outros"; };

const extrairStatus = (xml) => { const match = xml.match(/<descricao>(.*?)</descricao>/); return match ? match[1] : "Desconhecido"; };

const importarRastreios = async () => { const linhas = dadosTexto.trim().split("\n"); for (const linha of linhas) { const [nome, codigo] = linha.split(" "); await addDoc(collection(db, "rastreios"), { nome, codigo, status: "Aguardando atualização", tipo: "", xml: "", arquivado: false }); } setDadosTexto(""); carregarRastreios(); };

const atualizarTodos = async (lista) => { setCarregando(true); const atualizados = await Promise.all( lista.map(async (r) => { if (r.arquivado) return r; try { const xml = await consultarCorreios(r.codigo, "Contato@gbgroupbrasil.com", "TetaAmiga3030@"); const status = extrairStatus(xml); const tipo = categorizarStatus(status); await updateDoc(doc(db, "rastreios", r.id), { xml, status, tipo }); return { ...r, xml, status, tipo }; } catch { await updateDoc(doc(db, "rastreios", r.id), { status: "Erro", tipo: "Alerta" }); return { ...r, status: "Erro", tipo: "Alerta" }; } }) ); setRastreios(atualizados); setCarregando(false); };

const excluir = async (id) => { await deleteDoc(doc(db, "rastreios", id)); carregarRastreios(); };

const arquivar = async (id) => { await updateDoc(doc(db, "rastreios", id), { arquivado: true }); carregarRastreios(); };

const rastreiosFiltrados = rastreios.filter(r => { if (filtroStatus !== "todos" && r.tipo !== filtroStatus) return false; return !r.arquivado; });

const statusUnicos = [...new Set(rastreios.filter(r => !r.arquivado).map(r => r.tipo))];

return ( <div style={{ padding: '20px' }}> <h2>Importar Rastreios</h2> <textarea rows={6} style={{ width: '100%' }} placeholder="Exemplo:\nBlackviewBV9300PROB NM870750087BR" value={dadosTexto} onChange={(e) => setDadosTexto(e.target.value)} /> <br /> <button onClick={importarRastreios}>Importar (não consulta)</button> <button onClick={() => atualizarTodos(rastreios)} disabled={carregando}> {carregando ? "Consultando..." : "Atualizar todos"} </button> <br /><br /> <label>Status: </label> <select onChange={(e) => setFiltroStatus(e.target.value)}> <option value="todos">Todos</option> <option value="Postado">📦 Postado</option> <option value="Em trânsito">🚚 Em trânsito</option> <option value="Aguardando retirada">📬 Aguardando retirada</option> <option value="Entregue">✅ Entregue</option> <option value="Alerta">⚠️ Alerta</option> </select> <div> {rastreiosFiltrados.map((item, index) => ( <div key={item.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}> <strong>{item.nome}</strong> - {item.codigo} <em>[{item.tipo}]</em> <br /> <button onClick={() => arquivar(item.id)}>Arquivar</button> <button onClick={() => excluir(item.id)} style={{ marginLeft: '10px' }}>Excluir</button> <pre style={{ fontSize: '12px', overflowX: 'auto' }}>{item.xml}</pre> </div> ))} </div> </div> ); };

export default PainelRastreamento;
