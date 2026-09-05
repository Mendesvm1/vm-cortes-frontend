import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Check,
  X,
  Calendar,
  Clock,
  TrendingUp,
  Radio,
  ShieldCheck,
  ShieldOff,
  ChevronDown,
  Youtube,
  ArrowRight,
  Link2,
  Unlink,
  RefreshCw,
  AlertCircle,
  QrCode,
  Smartphone,
} from "lucide-react";

// Endereco do backend. Ajuste se voce rodar em outra porta/host.
const API_BASE = "https://vm-cortes-backend.onrender.com/api";

// Endereco que o CELULAR precisa conseguir alcançar para o QR code funcionar.
// "localhost" só existe para a própria máquina que está rodando o backend —
// um celular escaneando o QR não consegue abrir "localhost" e chegar no seu
// computador. Troque isso pelo IP da sua rede local (ex: http://192.168.0.12:4000/api)
// ou por uma URL de túnel (ngrok, Cloudflare Tunnel) antes de usar o QR de verdade.
const API_BASE_PUBLICO = API_BASE.includes("localhost")
  ? null
  : API_BASE;

function urlQrCode(destino) {
  const alvo = `${API_BASE_PUBLICO}/auth/${destino}?token=${encodeURIComponent(obterToken())}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=196x196&data=${encodeURIComponent(alvo)}`;
}

// ---------- Login (token guardado no navegador) ----------
// Guardamos o token no localStorage do navegador para a pessoa continuar
// logada ao voltar no site depois - isso é seguro aqui porque o app roda
// como site publicado de verdade (não dentro do preview do chat).

const CHAVE_TOKEN = "vmcortes_token";

function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN) || "";
}

function definirToken(token) {
  if (token) localStorage.setItem(CHAVE_TOKEN, token);
  else localStorage.removeItem(CHAVE_TOKEN);
}

async function chamarApi(caminho, opcoes = {}) {
  const token = obterToken();
  const resposta = await fetch(`${API_BASE}${caminho}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opcoes,
  });
  if (resposta.status === 401) {
    // Sessão expirou ou é inválida - manda a pessoa pra tela de login de novo.
    definirToken(null);
    window.location.reload();
    throw new Error("Sessão expirada.");
  }
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro || `Erro ${resposta.status} ao chamar ${caminho}`);
  }
  return resposta.json();
}

// ---------- Helpers visuais ----------

function TikTokIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.6 5.82c-.9-.6-1.53-1.55-1.72-2.65h-3.1v13.3c0 1.5-1.22 2.72-2.72 2.72a2.72 2.72 0 0 1-2.72-2.72 2.72 2.72 0 0 1 2.72-2.72c.28 0 .55.04.8.12v-3.14a5.8 5.8 0 0 0-.8-.06A5.86 5.86 0 0 0 3.1 18.5a5.86 5.86 0 0 0 5.86 5.86 5.86 5.86 0 0 0 5.86-5.86v-6.7a8.2 8.2 0 0 0 4.68 1.46v-3.1c-1.05 0-2.03-.34-2.9-.94v.6Z"
        fill={color}
      />
    </svg>
  );
}

// Logo oficial do VM CORTES (fornecido pelo usuário via Canva).
const LOGO_VM_CORTES_SRC = "data:image/png;base64,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";

function LogoVMCortes({ size = 34 }) {
  return (
    <img
      src={LOGO_VM_CORTES_SRC}
      alt="VM CORTES"
      width={size}
      height={size}
      className="rounded-[10px] shrink-0 object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function velocidadeCor(v) {
  if (v >= 70) return "#E1432D";
  if (v >= 40) return "#E8A33D";
  return "#4FA89E";
}

function PulseBar({ valor }) {
  const cor = velocidadeCor(valor);
  return (
    <div className="flex items-end gap-[2px] h-6" aria-hidden="true">
      {[0.3, 0.55, 0.4, 0.8, 0.6, 1, 0.7].map((mult, i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            height: `${Math.max(4, (valor / 100) * 24 * mult)}px`,
            backgroundColor: cor,
            opacity: 0.55 + mult * 0.45,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Componente principal ----------

function Painel({ aoSair }) {
  const [contaYoutube, setContaYoutube] = useState(null);
  const [contaTiktok, setContaTiktok] = useState(null);

  const [query, setQuery] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [canaisAutorizados, setCanaisAutorizados] = useState([]);
  const [fila, setFila] = useState([]);
  const [expandido, setExpandido] = useState(new Set());
  const [atualizandoFila, setAtualizandoFila] = useState(false);
  const [erro, setErro] = useState("");
  const [qrAberto, setQrAberto] = useState(null); // null | "youtube" | "tiktok"
  const intervalRef = useRef(null);

  // ---------- Carregamento inicial ----------

  const carregarStatusContas = useCallback(async () => {
    try {
      const { youtube, tiktok } = await chamarApi("/auth/status");
      setContaYoutube(youtube.conectado ? youtube : null);
      setContaTiktok(tiktok.conectado ? tiktok : null);
    } catch (e) {
      setErro("Nao foi possivel falar com o backend. Ele esta rodando em " + API_BASE + "?");
    }
  }, []);

  const carregarCanaisAutorizados = useCallback(async () => {
    try {
      const { canais } = await chamarApi("/channels/authorized");
      setCanaisAutorizados(canais);
      setExpandido((prev) => {
        const next = new Set(prev);
        canais.forEach((c) => next.add(c.id));
        return next;
      });
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  const carregarFila = useCallback(async () => {
    try {
      const { fila } = await chamarApi("/queue");
      setFila(fila);
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => {
    carregarStatusContas();
    carregarCanaisAutorizados();
    carregarFila();
  }, [carregarStatusContas, carregarCanaisAutorizados, carregarFila]);

  // Enquanto o QR estiver aberto, fica checando se a conexão já foi concluída
  // no celular, e fecha o painel sozinho assim que detectar.
  useEffect(() => {
    if (!qrAberto) return;
    intervalRef.current = setInterval(async () => {
      await carregarStatusContas();
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [qrAberto, carregarStatusContas]);

  useEffect(() => {
    if (qrAberto === "youtube" && contaYoutube) setQrAberto(null);
    if (qrAberto === "tiktok" && contaTiktok) setQrAberto(null);
  }, [contaYoutube, contaTiktok, qrAberto]);

  // Enquanto algum item estiver em processamento (transcrevendo, cortando,
  // etc.), fica atualizando a fila a cada 4s para acompanhar o progresso
  // sem precisar a pessoa ficar recarregando a página na mão.
  const emProcessamento = fila.some((v) =>
    ["transcrevendo", "escolhendo_trecho", "cortando", "salvando"].includes(v.statusProcessamento)
  );
  useEffect(() => {
    if (!emProcessamento) return;
    const id = setInterval(carregarFila, 4000);
    return () => clearInterval(id);
  }, [emProcessamento, carregarFila]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("youtube") || params.has("tiktok")) {
      carregarStatusContas();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [carregarStatusContas]);

  // ---------- Contas ----------

  function conectarYoutube() {
    window.location.href = `${API_BASE}/auth/youtube?token=${encodeURIComponent(obterToken())}`;
  }
  async function desconectarYoutube() {
    await chamarApi("/auth/youtube/desconectar", { method: "POST" });
    setContaYoutube(null);
  }
  function conectarTiktok() {
    window.location.href = `${API_BASE}/auth/tiktok?token=${encodeURIComponent(obterToken())}`;
  }
  async function desconectarTiktok() {
    await chamarApi("/auth/tiktok/desconectar", { method: "POST" });
    setContaTiktok(null);
  }

  // ---------- Busca de canais ----------

  useEffect(() => {
    if (query.trim().length < 2) {
      setResultadosBusca([]);
      return;
    }
    setBuscando(true);
    const timeoutId = setTimeout(async () => {
      try {
        const { resultados } = await chamarApi(`/channels/search?q=${encodeURIComponent(query.trim())}`);
        setResultadosBusca(resultados);
      } catch (e) {
        setErro(e.message);
      } finally {
        setBuscando(false);
      }
    }, 450);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const idsAutorizados = new Set(canaisAutorizados.map((c) => c.id));

  async function autorizarCanal(canal) {
    if (idsAutorizados.has(canal.id)) return;
    try {
      await chamarApi("/channels/authorize", {
        method: "POST",
        body: JSON.stringify({
          id: canal.id,
          nome: canal.nome,
          handle: canal.handle,
          plataforma: canal.plataforma,
        }),
      });
      await carregarCanaisAutorizados();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function revogarCanal(id) {
    try {
      await chamarApi(`/channels/authorize/${id}`, { method: "DELETE" });
      await carregarCanaisAutorizados();
      await carregarFila();
    } catch (e) {
      setErro(e.message);
    }
  }

  function toggleExpandido(id) {
    setExpandido((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ---------- Fila de candidatos ----------

  async function atualizarAgendamento(itemId, patch) {
    setFila((prev) => prev.map((v) => (v.id === itemId ? { ...v, ...patch } : v)));
    try {
      await chamarApi(`/queue/${itemId}`, { method: "PATCH", body: JSON.stringify(patch) });
    } catch (e) {
      setErro(e.message);
    }
  }

  async function aprovarItem(itemId) {
    try {
      await chamarApi(`/queue/${itemId}/approve`, { method: "POST" });
      await carregarFila();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function rejeitarItem(itemId) {
    try {
      await chamarApi(`/queue/${itemId}/reject`, { method: "POST" });
      await carregarFila();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function enviarVideoOriginal(itemId, arquivo) {
    setFila((prev) => prev.map((v) => (v.id === itemId ? { ...v, statusProcessamento: "enviando" } : v)));
    try {
      const formData = new FormData();
      formData.append("video", arquivo);
      const resposta = await fetch(`${API_BASE}/queue/${itemId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${obterToken()}` },
        body: formData,
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Falha ao enviar o vídeo.");
      await carregarFila();
    } catch (e) {
      setErro(e.message);
      await carregarFila();
    }
  }

  async function gerarCorte(itemId) {
    try {
      await chamarApi(`/queue/${itemId}/processar`, { method: "POST" });
      await carregarFila();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function buscarVideosNovos() {
    setAtualizandoFila(true);
    try {
      await chamarApi("/queue/refresh", { method: "POST" });
      await carregarFila();
    } catch (e) {
      setErro(e.message);
    } finally {
      setAtualizandoFila(false);
    }
  }

  const contasProntas = Boolean(contaYoutube && contaTiktok);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#EEF1EF", color: "#1B2224", fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      <div className="max-w-3xl mx-auto px-5 py-8 sm:px-8 sm:py-10">
        {/* Header / marca */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LogoVMCortes />
            <div>
              <div
                className="text-[17px] font-bold leading-none"
                style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}
              >
                VM <span style={{ color: "#E1432D" }}>CORTES</span>
              </div>
              <div
                className="text-[11px] uppercase tracking-[0.16em] mt-1"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#9AA3A0" }}
              >
                YouTube → TikTok, sob sua aprovação
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#1B2224", color: "#EEF1EF", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {canaisAutorizados.length} autorizados
            </span>
            <button
              onClick={aoSair}
              className="text-xs px-2.5 py-1 rounded-full border"
              style={{ borderColor: "#D8DEDB", color: "#57615F", fontFamily: "'JetBrains Mono', monospace" }}
            >
              Sair
            </button>
          </div>
        </header>

        {erro && (
          <div
            className="flex items-start gap-2 rounded-lg px-3.5 py-3 mb-6 text-[13px]"
            style={{ backgroundColor: "#FBEEEC", color: "#B5453A" }}
          >
            <AlertCircle size={15} className="mt-[1px] shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Painel de conexoes: YouTube (origem) -> TikTok (destino) */}
        <div
          className="rounded-xl border p-4 sm:p-5 mb-8"
          style={{ borderColor: "#D8DEDB", backgroundColor: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={15} color="#57615F" />
            <h2 className="text-[13px] uppercase tracking-[0.14em] font-semibold" style={{ color: "#57615F" }}>
              Contas conectadas
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Origem: YouTube */}
            <div
              className="flex-1 flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5"
              style={{ borderColor: "#D8DEDB" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#FBEEEC" }}
                >
                  <Youtube size={18} color="#C4392E" />
                </div>
                <div>
                  <div className="text-[11.5px] uppercase tracking-[0.1em] font-semibold" style={{ color: "#9AA3A0" }}>
                    Origem dos vídeos
                  </div>
                  <div className="text-[14px] font-semibold">
                    {contaYoutube ? contaYoutube.nome : "YouTube não conectado"}
                  </div>
                </div>
              </div>
              {contaYoutube ? (
                <button
                  onClick={desconectarYoutube}
                  className="flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-md shrink-0"
                  style={{ color: "#B5453A", backgroundColor: "#FBEEEC" }}
                >
                  <Unlink size={11} /> Desconectar
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={conectarYoutube}
                    className="flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-md"
                    style={{ color: "#EEF1EF", backgroundColor: "#C4392E" }}
                  >
                    <Link2 size={11} /> Conectar YouTube
                  </button>
                  <button
                    onClick={() => setQrAberto(qrAberto === "youtube" ? null : "youtube")}
                    title="Conectar via QR Code"
                    className="flex items-center justify-center w-[26px] h-[26px] rounded-md"
                    style={{
                      color: qrAberto === "youtube" ? "#EEF1EF" : "#57615F",
                      backgroundColor: qrAberto === "youtube" ? "#1B2224" : "#EDEFEE",
                    }}
                  >
                    <QrCode size={13} />
                  </button>
                </div>
              )}
            </div>

            <ArrowRight size={18} color="#9AA3A0" className="hidden sm:block shrink-0" />

            {/* Destino: TikTok */}
            <div
              className="flex-1 flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5"
              style={{ borderColor: "#D8DEDB" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#1B2224" }}
                >
                  <TikTokIcon size={17} color="#EEF1EF" />
                </div>
                <div>
                  <div className="text-[11.5px] uppercase tracking-[0.1em] font-semibold" style={{ color: "#9AA3A0" }}>
                    Destino da postagem
                  </div>
                  <div className="text-[14px] font-semibold">
                    {contaTiktok ? contaTiktok.nome : "TikTok não conectado"}
                  </div>
                </div>
              </div>
              {contaTiktok ? (
                <button
                  onClick={desconectarTiktok}
                  className="flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-md shrink-0"
                  style={{ color: "#B5453A", backgroundColor: "#FBEEEC" }}
                >
                  <Unlink size={11} /> Desconectar
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={conectarTiktok}
                    className="flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-md"
                    style={{ color: "#EEF1EF", backgroundColor: "#1B2224" }}
                  >
                    <Link2 size={11} /> Conectar TikTok
                  </button>
                  <button
                    onClick={() => setQrAberto(qrAberto === "tiktok" ? null : "tiktok")}
                    title="Conectar via QR Code"
                    className="flex items-center justify-center w-[26px] h-[26px] rounded-md"
                    style={{
                      color: qrAberto === "tiktok" ? "#EEF1EF" : "#57615F",
                      backgroundColor: qrAberto === "tiktok" ? "#1B2224" : "#EDEFEE",
                    }}
                  >
                    <QrCode size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {qrAberto && (
            <div
              className="flex items-center gap-4 rounded-lg border mt-3.5 px-4 py-3.5"
              style={{ borderColor: "#D8DEDB", backgroundColor: "#FAFBFA" }}
            >
              {API_BASE_PUBLICO ? (
                <img
                  src={urlQrCode(qrAberto)}
                  alt={`QR code para conectar ${qrAberto === "youtube" ? "YouTube" : "TikTok"}`}
                  width={98}
                  height={98}
                  className="rounded-md shrink-0"
                  style={{ border: "1px solid #D8DEDB" }}
                />
              ) : (
                <div
                  className="w-[98px] h-[98px] rounded-md flex items-center justify-center shrink-0 text-center px-2"
                  style={{ backgroundColor: "#FBEEEC", color: "#B5453A", fontSize: "11px" }}
                >
                  API_BASE ainda é localhost
                </div>
              )}
              <div className="text-[13px]" style={{ color: "#57615F" }}>
                <div className="flex items-center gap-1.5 font-semibold mb-1" style={{ color: "#1B2224" }}>
                  <Smartphone size={14} />
                  Escaneie com o celular para conectar
                </div>
                {API_BASE_PUBLICO ? (
                  <p>
                    Abra a câmera do celular, aponte para o QR e finalize o login. Esta tela
                    atualiza sozinha assim que a conexão for concluída.
                  </p>
                ) : (
                  <p>
                    O QR só funciona se o backend estiver acessível pelo celular — troque{" "}
                    <code className="text-[12px]">API_BASE</code> no topo do arquivo pelo IP da
                    sua rede local (ex: <code className="text-[12px]">http://192.168.0.12:4000/api</code>)
                    ou por uma URL de túnel (ngrok, Cloudflare Tunnel). "localhost" só existe para
                    este computador.
                  </p>
                )}
              </div>
            </div>
          )}

          {!contasProntas && (
            <p className="text-[12.5px] mt-3.5" style={{ color: "#9AA3A0" }}>
              Conecte as duas contas para liberar a busca de canais e a fila de postagem abaixo.
            </p>
          )}
        </div>

        <h1
          className="text-[28px] sm:text-[34px] leading-tight font-bold mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Buscar e autorizar canais
        </h1>
        <p className="text-[15px] mb-7" style={{ color: "#57615F" }}>
          Só canais autorizados aqui entram na busca por cortes e na fila de postagem.
        </p>

        {/* Busca */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-3 border"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#D8DEDB" }}
        >
          <Search size={18} color="#6B7573" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar canal por nome..."
            disabled={!contasProntas}
            className="w-full bg-transparent outline-none text-[15px] placeholder:text-[#9AA3A0] disabled:cursor-not-allowed"
          />
          {buscando && <RefreshCw size={15} color="#9AA3A0" className="animate-spin shrink-0" />}
        </div>

        {resultadosBusca.length > 0 && (
          <div className="mb-8 rounded-xl overflow-hidden border" style={{ borderColor: "#D8DEDB" }}>
            {resultadosBusca.map((canal, i) => {
              const jaAutorizado = idsAutorizados.has(canal.id);
              return (
                <div
                  key={canal.id}
                  className="flex items-center justify-between px-4 py-3.5 bg-white"
                  style={{ borderTop: i > 0 ? "1px solid #E7EBE9" : "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold shrink-0"
                      style={{ backgroundColor: "#1B2224", color: "#EEF1EF", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {canal.avatar}
                    </div>
                    <div>
                      <div className="text-[14.5px] font-semibold">{canal.nome}</div>
                      <div className="text-[13px]" style={{ color: "#7A827F", fontFamily: "'JetBrains Mono', monospace" }}>
                        {canal.handle} · {canal.plataforma} · {canal.inscritos} inscritos
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => autorizarCanal(canal)}
                    disabled={jaAutorizado}
                    className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={
                      jaAutorizado
                        ? { color: "#4FA89E", backgroundColor: "#EAF5F3" }
                        : { color: "#EEF1EF", backgroundColor: "#1B2224" }
                    }
                  >
                    {jaAutorizado ? (
                      <>
                        <ShieldCheck size={14} /> Autorizado
                      </>
                    ) : (
                      "Autorizar"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Canais autorizados + candidatos */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Radio size={16} color="#57615F" />
            <h2 className="text-[13px] uppercase tracking-[0.14em] font-semibold" style={{ color: "#57615F" }}>
              Canais autorizados
            </h2>
          </div>
          <button
            onClick={buscarVideosNovos}
            disabled={!contasProntas || atualizandoFila || canaisAutorizados.length === 0}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
            style={{ color: "#1B2224", backgroundColor: "#E7EBE9" }}
          >
            <RefreshCw size={13} className={atualizandoFila ? "animate-spin" : ""} />
            {atualizandoFila ? "Buscando..." : "Buscar vídeos novos"}
          </button>
        </div>

        <div className="space-y-4">
          {canaisAutorizados.map((canal) => {
            const aberto = expandido.has(canal.id);
            const candidatos = fila.filter((v) => v.canalId === canal.id);
            return (
              <div key={canal.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "#D8DEDB", backgroundColor: "#FFFFFF" }}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <button onClick={() => toggleExpandido(canal.id)} className="flex items-center gap-3 flex-1 text-left">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold shrink-0"
                      style={{ backgroundColor: "#EAF5F3", color: "#2E6B62", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {(canal.nome || "??").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[14.5px] font-semibold">{canal.nome}</div>
                      <div className="text-[13px]" style={{ color: "#7A827F", fontFamily: "'JetBrains Mono', monospace" }}>
                        {canal.handle} · {candidatos.length} candidato(s)
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      color="#9AA3A0"
                      className="ml-auto transition-transform"
                      style={{ transform: aberto ? "rotate(180deg)" : "none" }}
                    />
                  </button>
                  <button
                    onClick={() => revogarCanal(canal.id)}
                    className="ml-3 flex items-center gap-1.5 text-[12.5px] font-medium px-2.5 py-1.5 rounded-lg"
                    style={{ color: "#B5453A", backgroundColor: "#FBEEEC" }}
                  >
                    <ShieldOff size={13} /> Revogar
                  </button>
                </div>

                {aberto && (
                  <div style={{ borderTop: "1px solid #E7EBE9" }}>
                    {candidatos.length === 0 && (
                      <div className="px-4 py-5 text-[13.5px]" style={{ color: "#9AA3A0" }}>
                        Nenhum candidato ainda. Clique em "Buscar vídeos novos" acima.
                      </div>
                    )}
                    {candidatos.map((v, i) => (
                      <div key={v.id} className="px-4 py-4" style={{ borderTop: i > 0 ? "1px solid #F0F3F1" : "none" }}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="text-[14.5px] font-semibold leading-snug">{v.titulo}</div>
                          <div className="flex items-center gap-2 shrink-0">
                            <PulseBar valor={v.velocidade} />
                            <span
                              className="text-[12px] font-semibold"
                              style={{ color: velocidadeCor(v.velocidade), fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {v.velocidade}
                            </span>
                          </div>
                        </div>
                        <p className="text-[13.5px] leading-relaxed mb-3.5 flex items-start gap-1.5" style={{ color: "#57615F" }}>
                          <TrendingUp size={14} className="mt-[3px] shrink-0" color="#9AA3A0" />
                          {v.motivo}
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                          <label className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5" style={{ borderColor: "#D8DEDB" }}>
                            <Calendar size={14} color="#7A827F" />
                            <input
                              type="date"
                              value={v.data}
                              onChange={(e) => atualizarAgendamento(v.id, { data: e.target.value })}
                              className="bg-transparent outline-none text-[13px]"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            />
                          </label>
                          <label className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5" style={{ borderColor: "#D8DEDB" }}>
                            <Clock size={14} color="#7A827F" />
                            <input
                              type="time"
                              value={v.hora}
                              onChange={(e) => atualizarAgendamento(v.id, { hora: e.target.value })}
                              className="bg-transparent outline-none text-[13px]"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            />
                          </label>

                          {v.status !== "pendente" && (
                            <span
                              className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                              style={
                                v.status === "aprovado"
                                  ? { color: "#2E6B62", backgroundColor: "#EAF5F3" }
                                  : { color: "#B5453A", backgroundColor: "#FBEEEC" }
                              }
                            >
                              {v.status === "aprovado" ? "Agendado" : "Rejeitado"}
                            </span>
                          )}
                        </div>

                        {v.status === "pendente" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => aprovarItem(v.id)}
                              className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg"
                              style={{ backgroundColor: "#1B2224", color: "#EEF1EF" }}
                            >
                              <Check size={14} /> Aprovar e agendar
                            </button>
                            <button
                              onClick={() => rejeitarItem(v.id)}
                              className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border"
                              style={{ borderColor: "#D8DEDB", color: "#57615F" }}
                            >
                              <X size={14} /> Rejeitar
                            </button>
                          </div>
                        )}

                        {v.status === "aprovado" && (
                          <BlocoCorte item={v} aoEnviarVideo={enviarVideoOriginal} aoGerarCorte={gerarCorte} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {canaisAutorizados.length === 0 && (
            <div
              className="rounded-xl border border-dashed px-5 py-8 text-center text-[13.5px]"
              style={{ borderColor: "#D8DEDB", color: "#9AA3A0" }}
            >
              Nenhum canal autorizado ainda. Busque um canal acima para começar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Upload do vídeo original + acompanhamento do corte ----------

const ROTULOS_STATUS = {
  enviando: "Enviando vídeo...",
  transcrevendo: "Transcrevendo o áudio...",
  escolhendo_trecho: "Escolhendo o melhor trecho...",
  cortando: "Cortando e gerando a legenda...",
  salvando: "Salvando o corte final...",
};

function BlocoCorte({ item, aoEnviarVideo, aoGerarCorte }) {
  const status = item.statusProcessamento;
  const emAndamento = Boolean(ROTULOS_STATUS[status]);

  if (status === "pronto" && item.corteUrl) {
    return (
      <div className="mt-1 rounded-xl border p-3.5" style={{ borderColor: "#D8DEDB", backgroundColor: "#F0F3F1" }}>
        <div className="text-[13.5px] font-semibold mb-1">{item.tituloCorte || "Corte pronto"}</div>
        {item.motivoCorte && (
          <p className="text-[12.5px] mb-2.5" style={{ color: "#57615F" }}>
            {item.motivoCorte}
          </p>
        )}
        <video src={item.corteUrl} controls className="w-full max-w-[220px] rounded-lg" style={{ aspectRatio: "9/16" }} />
      </div>
    );
  }

  if (emAndamento) {
    return (
      <div
        className="flex items-center gap-2 text-[13px] font-medium rounded-lg px-3 py-2.5"
        style={{ backgroundColor: "#F0F3F1", color: "#57615F" }}
      >
        <RefreshCw size={14} className="animate-spin" />
        {ROTULOS_STATUS[status]}
      </div>
    );
  }

  if (status === "erro") {
    return (
      <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "#FBEEEC" }}>
        <div className="text-[13px] font-medium mb-2" style={{ color: "#B5453A" }}>
          {item.erroProcessamento || "Algo deu errado ao gerar o corte."}
        </div>
        <button
          onClick={() => aoGerarCorte(item.id)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: "#1B2224", color: "#EEF1EF" }}
        >
          <RefreshCw size={13} /> Tentar de novo
        </button>
      </div>
    );
  }

  if (item.videoOriginalUrl) {
    return (
      <button
        onClick={() => aoGerarCorte(item.id)}
        className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: "#1B2224", color: "#EEF1EF" }}
      >
        <TrendingUp size={14} /> Gerar corte
      </button>
    );
  }

  return (
    <label
      className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border cursor-pointer w-fit"
      style={{ borderColor: "#D8DEDB", color: "#57615F" }}
    >
      <RefreshCw size={14} />
      Enviar vídeo original
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) aoEnviarVideo(item.id, arquivo);
        }}
      />
    </label>
  );
}

// ---------- Tela de login / cadastro ----------

function TelaLogin({ aoLogar }) {
  const [modo, setModo] = useState("login"); // "login" | "cadastro"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const caminho = modo === "login" ? "/conta/login" : "/conta/cadastro";
      const resposta = await fetch(`${API_BASE}${caminho}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível entrar.");
      definirToken(dados.token);
      aoLogar();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5"
      style={{ background: "#EEF1EF", color: "#1B2224", fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <LogoVMCortes size={36} />
          <div
            className="text-[19px] font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}
          >
            VM <span style={{ color: "#E1432D" }}>CORTES</span>
          </div>
        </div>

        <div className="rounded-xl border p-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#D8DEDB" }}>
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setModo("login")}
              className="flex-1 text-[13.5px] font-semibold py-2 rounded-lg"
              style={
                modo === "login"
                  ? { backgroundColor: "#1B2224", color: "#EEF1EF" }
                  : { backgroundColor: "#F0F3F1", color: "#57615F" }
              }
            >
              Entrar
            </button>
            <button
              onClick={() => setModo("cadastro")}
              className="flex-1 text-[13.5px] font-semibold py-2 rounded-lg"
              style={
                modo === "cadastro"
                  ? { backgroundColor: "#1B2224", color: "#EEF1EF" }
                  : { backgroundColor: "#F0F3F1", color: "#57615F" }
              }
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={enviar} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "#D8DEDB" }}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder={modo === "cadastro" ? "Crie uma senha (mín. 6 caracteres)" : "Sua senha"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-[14px] outline-none"
              style={{ borderColor: "#D8DEDB" }}
            />

            {erro && (
              <div className="text-[13px]" style={{ color: "#B5453A" }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full text-[14px] font-semibold py-2.5 rounded-lg mt-1 disabled:opacity-50"
              style={{ backgroundColor: "#1B2224", color: "#EEF1EF" }}
            >
              {carregando ? "Um instante..." : modo === "login" ? "Entrar" : "Criar minha conta"}
            </button>
          </form>
        </div>

        {modo === "cadastro" && (
          <p className="text-[12.5px] text-center mt-4" style={{ color: "#9AA3A0" }}>
            Use o mesmo e-mail que você usou para assinar um plano, se já tiver assinado.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- Componente raiz: decide entre login e painel ----------

export default function App() {
  const [logado, setLogado] = useState(Boolean(obterToken()));

  if (!logado) {
    return <TelaLogin aoLogar={() => setLogado(true)} />;
  }

  return (
    <Painel
      aoSair={() => {
        definirToken(null);
        setLogado(false);
      }}
    />
  );
}
