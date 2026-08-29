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
  const alvo = `${API_BASE_PUBLICO}/auth/${destino}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=196x196&data=${encodeURIComponent(alvo)}`;
}

async function chamarApi(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE}${caminho}`, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
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

function LogoVMCortes({ size = 34 }) {
  return (
    <div
      className="relative rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden"
      style={{ width: size, height: size, backgroundColor: "#1B2224" }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1B2224 0%, #1B2224 46%, #E1432D 46%, #E1432D 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(135deg, transparent 0px, transparent 3px, rgba(238,241,239,0.55) 3px, rgba(238,241,239,0.55) 4px)",
          clipPath: "polygon(40% 0, 52% 0, 12% 100%, 0 100%)",
        }}
      />
      <span
        className="relative text-[13px] font-bold tracking-tight"
        style={{ color: "#EEF1EF", fontFamily: "'Space Grotesk', sans-serif" }}
      >
        VM
      </span>
    </div>
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

export default function VMCortes() {
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
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("youtube") || params.has("tiktok")) {
      carregarStatusContas();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [carregarStatusContas]);

  // ---------- Contas ----------

  function conectarYoutube() {
    window.location.href = `${API_BASE}/auth/youtube`;
  }
  async function desconectarYoutube() {
    await chamarApi("/auth/youtube/desconectar", { method: "POST" });
    setContaYoutube(null);
  }
  function conectarTiktok() {
    window.location.href = `${API_BASE}/auth/tiktok`;
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
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "#1B2224", color: "#EEF1EF", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {canaisAutorizados.length} autorizados
          </span>
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
