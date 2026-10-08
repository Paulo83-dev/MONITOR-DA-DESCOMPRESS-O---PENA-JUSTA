"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { chamar, dataHora } from "./cliente";

type Sessao = { logado: boolean; usuario: string | null; papel: "admin" | "moderador" | null };
type Msg = {
  id: number; topico_id: number; titulo: string; corpo: string; apelido: string; da_moderacao: boolean;
  criado_em: string; status: string; motivo: string | null; denuncias: number; tem_origem: boolean;
};
type Fila = { filtro: string; mensagens: Msg[]; contagens: { pendentes: number; denunciadas: number; ocultas: number } };
type Moderador = { usuario: string; papel: string; ativo: boolean; criado_em: string };

type Aba = "pendentes" | "denunciadas" | "ocultas" | "recentes" | "moderadores" | "senha";

const ROTULO_STATUS: Record<string, string> = { visivel: "Visível", retida: "Retida", oculta: "Oculta", removida: "Removida" };

function Login({ aoEntrar }: { aoEntrar: () => void }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const r = await chamar("/api/mod/entrar", { corpo: { usuario, senha } });
    setEnviando(false);
    if (r.ok) aoEntrar();
    else setErro(r.erro);
  }

  return (
    <form className="form-forum" onSubmit={entrar} style={{ maxWidth: "26rem" }}>
      <div className="campo">
        <label htmlFor="m-usuario">Usuário</label>
        <input id="m-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" required />
      </div>
      <div className="campo">
        <label htmlFor="m-senha">Senha</label>
        <input id="m-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
      </div>
      {erro ? <p className="msg-erro" role="alert">{erro}</p> : null}
      <div><button type="submit" className="btn btn-primario" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button></div>
    </form>
  );
}

function CartaoMensagem({ m, aoAgir }: { m: Msg; aoAgir: (id: number, acao: string) => Promise<string | null> }) {
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function agir(acao: string) {
    setAviso(null);
    const erro = await aoAgir(m.id, acao);
    setConfirmar(null);
    if (erro) setAviso(erro);
  }

  const botao = (acao: string, rotulo: string, perigoso = false) =>
    confirmar === acao ? (
      <button key={acao} type="button" className="btn btn-sm btn-perigo" onClick={() => agir(acao)}>Confirmar: {rotulo.toLowerCase()}</button>
    ) : (
      <button key={acao} type="button" className={`btn btn-sm${perigoso ? " btn-perigo" : ""}`} onClick={() => (perigoso ? setConfirmar(acao) : agir(acao))}>{rotulo}</button>
    );

  return (
    <li className="mod-cartao">
      <div className="mensagem-topo">
        <strong>{m.apelido}</strong>
        {m.da_moderacao ? <span className="etiqueta aviso">Moderação</span> : null}
        <span className={`etiqueta${m.status === "retida" ? " aviso" : ""}`}>{ROTULO_STATUS[m.status] ?? m.status}</span>
        {m.motivo ? <span className="etiqueta">motivo: {m.motivo}</span> : null}
        {m.denuncias ? <span className="etiqueta aviso">{m.denuncias} {m.denuncias === 1 ? "denúncia" : "denúncias"}</span> : null}
        <time className="muted" dateTime={m.criado_em}>{dataHora(m.criado_em)}</time>
      </div>
      <p className="muted ui" style={{ fontSize: "0.8125rem" }}>
        Tópico: <Link href={`/forum/${m.topico_id}#m${m.id}`} target="_blank">{m.titulo}</Link>
      </p>
      <p className="mod-corpo">{m.corpo}</p>
      <div className="mensagem-acoes">
        {m.status === "retida" ? botao("aprovar", "Aprovar e publicar") : null}
        {m.status === "oculta" ? botao("restaurar", "Restaurar") : null}
        {m.status === "visivel" ? botao("ocultar", "Ocultar") : null}
        {botao("remover", "Remover", true)}
        {m.tem_origem ? botao("bloquear", "Remover e bloquear origem", true) : null}
        {aviso ? <span className="msg-erro ui" role="alert">{aviso}</span> : null}
      </div>
    </li>
  );
}

function Moderadores({ eu }: { eu: string }) {
  const [lista, setLista] = useState<Moderador[]>([]);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState("moderador");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    const r = await chamar<{ moderadores: Moderador[] }>("/api/mod/moderadores");
    if (r.ok) setLista(r.dados.moderadores);
  }, []);
  useEffect(() => { queueMicrotask(carregar); }, [carregar]);

  async function criar(e: FormEvent) {
    e.preventDefault();
    const r = await chamar("/api/mod/moderadores", { corpo: { usuario, senha, papel } });
    setAviso({ ok: r.ok, texto: r.ok ? `Moderador ${usuario} criado.` : r.erro });
    if (r.ok) { setUsuario(""); setSenha(""); carregar(); }
  }

  async function alternar(m: Moderador) {
    const r = await chamar("/api/mod/moderadores", { metodo: "PATCH", corpo: { usuario: m.usuario, ativo: !m.ativo } });
    setAviso({ ok: r.ok, texto: r.ok ? `${m.usuario} agora está ${m.ativo ? "desativado" : "ativo"}.` : r.erro });
    carregar();
  }

  function novaSenha(m: Moderador) {
    setAviso({ ok: true, texto: `Digite a nova senha de ${m.usuario} no formulário abaixo e use "Trocar senha deste usuário".` });
    setUsuario(m.usuario);
  }

  async function trocarSenhaDe() {
    const r = await chamar("/api/mod/moderadores", { metodo: "PATCH", corpo: { usuario, senha } });
    setAviso({ ok: r.ok, texto: r.ok ? `Senha de ${usuario} trocada.` : r.erro });
    if (r.ok) setSenha("");
  }

  return (
    <div className="stack">
      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Usuário</th><th>Papel</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {lista.map((m) => (
              <tr key={m.usuario}>
                <td className="codigo">{m.usuario}{m.usuario === eu ? " (você)" : ""}</td>
                <td>{m.papel === "admin" ? "Administrador" : "Moderador"}</td>
                <td>{m.ativo ? "Ativo" : "Desativado"}</td>
                <td className="d">
                  <button type="button" className="btn btn-sm" onClick={() => novaSenha(m)}>Trocar senha</button>{" "}
                  {m.usuario !== eu ? <button type="button" className="btn btn-sm" onClick={() => alternar(m)}>{m.ativo ? "Desativar" : "Ativar"}</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aviso ? <p className={aviso.ok ? "msg-aviso" : "msg-erro"} role="status">{aviso.texto}</p> : null}
      <form className="form-forum" onSubmit={criar} style={{ maxWidth: "26rem" }}>
        <h3>Criar moderador ou trocar senha</h3>
        <div className="campo">
          <label htmlFor="n-usuario">Usuário</label>
          <input id="n-usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="off" required />
          <p className="dica">De 3 a 32 letras minúsculas, números, ponto, hífen ou sublinhado.</p>
        </div>
        <div className="campo">
          <label htmlFor="n-senha">Senha (mínimo 10 caracteres)</label>
          <input id="n-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" required />
        </div>
        <div className="campo">
          <label htmlFor="n-papel">Papel (só para novo usuário)</label>
          <select id="n-papel" value={papel} onChange={(e) => setPapel(e.target.value)}>
            <option value="moderador">Moderador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="mensagem-acoes">
          <button type="submit" className="btn btn-primario">Criar usuário</button>
          <button type="button" className="btn" onClick={trocarSenhaDe}>Trocar senha deste usuário</button>
        </div>
      </form>
    </div>
  );
}

function MinhaSenha() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  async function trocar(e: FormEvent) {
    e.preventDefault();
    const r = await chamar("/api/mod/senha", { corpo: { atual, nova } });
    setAviso({ ok: r.ok, texto: r.ok ? "Senha trocada." : r.erro });
    if (r.ok) { setAtual(""); setNova(""); }
  }
  return (
    <form className="form-forum" onSubmit={trocar} style={{ maxWidth: "26rem" }}>
      <div className="campo">
        <label htmlFor="s-atual">Senha atual</label>
        <input id="s-atual" type="password" value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" required />
      </div>
      <div className="campo">
        <label htmlFor="s-nova">Nova senha (mínimo 10 caracteres)</label>
        <input id="s-nova" type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" required />
      </div>
      {aviso ? <p className={aviso.ok ? "msg-aviso" : "msg-erro"} role="status">{aviso.texto}</p> : null}
      <div><button type="submit" className="btn btn-primario">Trocar a minha senha</button></div>
    </form>
  );
}

export default function PainelModeracao() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("pendentes");
  const [fila, setFila] = useState<Fila | null>(null);
  const [carregando, setCarregando] = useState(false);

  const verSessao = useCallback(async () => {
    const r = await chamar<Sessao>("/api/mod/sessao");
    if (r.ok) { setSessao(r.dados); setErro(null); }
    else setErro(r.erro);
  }, []);
  useEffect(() => { queueMicrotask(verSessao); }, [verSessao]);

  const carregarFila = useCallback(async (filtro: string) => {
    setCarregando(true);
    const r = await chamar<Fila>(`/api/mod/mensagens?filtro=${filtro}`);
    setCarregando(false);
    if (r.ok) setFila(r.dados);
    else if (r.status === 401) setSessao({ logado: false, usuario: null, papel: null });
  }, []);

  useEffect(() => {
    if (sessao?.logado && ["pendentes", "denunciadas", "ocultas", "recentes"].includes(aba)) queueMicrotask(() => carregarFila(aba));
  }, [sessao?.logado, aba, carregarFila]);

  async function agir(id: number, acao: string) {
    const r = await chamar(`/api/mod/mensagens/${id}`, { corpo: { acao } });
    if (!r.ok) return r.erro;
    await carregarFila(aba);
    return null;
  }

  async function sair() {
    await chamar("/api/mod/sair", { corpo: {} });
    setSessao({ logado: false, usuario: null, papel: null });
    setFila(null);
  }

  if (erro) return <div className="aviso-caixa atencao" role="alert"><h3>Moderação indisponível</h3><p>{erro}</p></div>;
  if (!sessao) return <p className="muted ui" role="status">Carregando…</p>;
  if (!sessao.logado) return <Login aoEntrar={verSessao} />;

  const c = fila?.contagens;
  const abas: { id: Aba; rotulo: string }[] = [
    { id: "pendentes", rotulo: `Retidas${c ? ` (${c.pendentes})` : ""}` },
    { id: "denunciadas", rotulo: `Denunciadas${c ? ` (${c.denunciadas})` : ""}` },
    { id: "ocultas", rotulo: `Ocultas${c ? ` (${c.ocultas})` : ""}` },
    { id: "recentes", rotulo: "Recentes" },
    ...(sessao.papel === "admin" ? [{ id: "moderadores" as Aba, rotulo: "Moderadores" }] : []),
    { id: "senha", rotulo: "Minha senha" },
  ];

  return (
    <div className="stack">
      <div className="mensagem-acoes ui" style={{ justifyContent: "space-between" }}>
        <p>Você entrou como <strong>{sessao.usuario}</strong> ({sessao.papel === "admin" ? "administrador" : "moderador"}).</p>
        <button type="button" className="btn btn-sm" onClick={sair}>Sair</button>
      </div>
      <div className="sala-barra" role="group" aria-label="Seções da moderação">
        {abas.map((a) => (
          <button key={a.id} type="button" className="btn btn-sm" aria-pressed={aba === a.id} onClick={() => setAba(a.id)}>{a.rotulo}</button>
        ))}
      </div>

      {aba === "moderadores" ? <Moderadores eu={sessao.usuario ?? ""} /> : null}
      {aba === "senha" ? <MinhaSenha /> : null}
      {["pendentes", "denunciadas", "ocultas", "recentes"].includes(aba) ? (
        <div className="stack">
          {carregando && !fila ? <p className="muted ui" role="status">Carregando…</p> : null}
          {fila && !fila.mensagens.length ? <p className="muted ui">Nada por aqui.</p> : null}
          <ul className="mod-lista">
            {fila?.mensagens.map((m) => <CartaoMensagem key={`${m.id}-${m.status}`} m={m} aoAgir={agir} />)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
