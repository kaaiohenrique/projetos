import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* =========================================================
   CONFIGURAÇÃO DO FIREBASE (COLE SUAS CHAVES AQUI)
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyBhxNltvjxlnWmNOvcvlWT6sKBKfw9tILM",
  authDomain: "sigescc.firebaseapp.com",
  databaseURL: "https://sigescc-default-rtdb.firebaseio.com",
  projectId: "sigescc",
  storageBucket: "sigescc.firebasestorage.app",
  messagingSenderId: "921839383517",
  appId: "1:921839383517:web:85902da7bb9be0526f7c34",
  measurementId: "G-V4DT8YWDL6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const state = {
  user: null,
  profile: null,
  eye: false,
  currentRoute: "dashboard",
  cache: {},
  initialized: false
};

const routes = {
  dashboard: {title:"Dashboard", group:"Início", icon:"🏠"},
  "cartao/lancamento": {title:"Lançamento Avulso", group:"Cartão de Crédito", icon:"💳"},
  "cartao/lote": {title:"Lançamento em Lote / PDF", group:"Cartão de Crédito", icon:"📄"},
  "cartao/divergentes": {title:"Dados Divergentes", group:"Cartão de Crédito", icon:"⚠️"},
  "cartao/consulta": {title:"Consulta de Fatura", group:"Cartão de Crédito", icon:"🔍"},
  "cartao/parametros": {title:"Parâmetros do Cartão", group:"Cartão de Crédito", icon:"⚙️"},
  "financeiro/lancamento": {title:"Lançamento e Consulta", group:"Financeiro", icon:"💰"},
  "financeiro/lote": {title:"Extrato Bancário / PDF", group:"Financeiro", icon:"📄"},
  "financeiro/auditoria": {title:"Auditoria Financeira", group:"Financeiro", icon:"📊"},
  "financeiro/parametros": {title:"Parâmetros Financeiros", group:"Financeiro", icon:"⚙️"},
  "sistema/acessos": {title:"Concessão de Acesso", group:"Gestão do Sistema", icon:"🔑"},
  "sistema/usuarios": {title:"Gestão de Usuários", group:"Gestão do Sistema", icon:"👥"},
  "sistema/logs": {title:"Logs de Auditoria", group:"Gestão do Sistema", icon:"📜"},
  "sistema/ids": {title:"Gestão de IDs", group:"Gestão do Sistema", icon:"🆔"},
  "sistema/avisos": {title:"Gestão de Avisos / Banners", group:"Gestão do Sistema", icon:"📢"}
};

const groups = {
  "Início": ["dashboard"],
  "Cartão de Crédito": [
    "cartao/lancamento",
    "cartao/lote",
    "cartao/divergentes",
    "cartao/consulta",
    "cartao/parametros"
  ],
  "Financeiro": [
    "financeiro/lancamento",
    "financeiro/lote",
    "financeiro/auditoria",
    "financeiro/parametros"
  ],
  "Gestão do Sistema": [
    "sistema/acessos",
    "sistema/usuarios",
    "sistema/logs",
    "sistema/ids",
    "sistema/avisos"
  ]
};

const $ = id => document.getElementById(id);

const money = n =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(n) || 0);

const dateBR = value => {
  if (!value) return "—";

  const d = value?.toDate
    ? value.toDate()
    : new Date(value);

  return isNaN(d)
    ? "—"
    : d.toLocaleDateString("pt-BR");
};

const dateTimeBR = value => {
  if (!value) return "—";

  const d = value?.toDate
    ? value.toDate()
    : new Date(value);

  return isNaN(d)
    ? "—"
    : d.toLocaleString("pt-BR");
};

const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    m => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );

const uid = () => state.user?.uid || "";

const isCoordinator = () =>
  [
    "Coordenador-Geral de Sistemas",
    "COORDENADOR-GERAL DE SISTEMAS"
  ].includes(state.profile?.perfil);

const currentId = () => state.profile?.id || "";

function notify(message, type = "success") {
  const root = $("toastRoot");

  const el = document.createElement("div");

  el.className = `toast ${type}`;
  el.textContent = message;

  root.appendChild(el);

  setTimeout(() => el.remove(), 3500);
}

function modal({
  title,
  body,
  footer = "",
  close = true
}) {
  const root = $("modalRoot");

  root.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <h3>${title}</h3>

          ${
            close
              ? '<button class="close-modal" data-close-modal>✕</button>'
              : ""
          }
        </div>

        <div class="modal-body">
          ${body}
        </div>

        ${
          footer
            ? `<div class="modal-footer">${footer}</div>`
            : ""
        }
      </div>
    </div>
  `;

  root
    .querySelector("[data-close-modal]")
    ?.addEventListener("click", closeModal);

  root
    .querySelector("#modalBackdrop")
    ?.addEventListener("click", e => {
      if (e.target.id === "modalBackdrop") {
        closeModal();
      }
    });
}

function closeModal() {
  $("modalRoot").innerHTML = "";
}

async function audit(
  action,
  collectionName,
  documentId,
  description = ""
) {
  try {
    await addDoc(
      collection(db, "logs_sistema"),
      {
        timestamp: serverTimestamp(),
        usuarioUid: uid(),
        usuario:
          state.profile?.nome ||
          state.user?.email ||
          "",
        perfil: state.profile?.perfil || "",
        id: currentId(),
        acao: action,
        modulo: state.currentRoute,
        colecao: collectionName,
        documentoId: documentId || "",
        descricao
      }
    );
  } catch (e) {
    console.error("Falha no log:", e);
  }
}

async function addRecord(
  collectionName,
  data,
  description = ""
) {
  const ref = await addDoc(
    collection(db, collectionName),
    {
      ...data,

      id:
        data.id ??
        currentId(),

      usuarioUid: uid(),

      criadoEm: serverTimestamp(),

      atualizadoEm:
        serverTimestamp(),

      ativo: true
    }
  );

  await audit(
    "INSERT",
    collectionName,
    ref.id,
    description
  );

  return ref;
}

async function updateRecord(
  collectionName,
  id,
  data,
  description = ""
) {
  await updateDoc(
    doc(db, collectionName, id),
    {
      ...data,
      atualizadoEm:
        serverTimestamp()
    }
  );

  await audit(
    "UPDATE",
    collectionName,
    id,
    description
  );
}

async function deleteRecord(
  collectionName,
  id,
  description = ""
) {
  await deleteDoc(
    doc(db, collectionName, id)
  );

  await audit(
    "DELETE",
    collectionName,
    id,
    description
  );
}

async function scopedDocs(
  collectionName,
  extra = [],
  sortField = "criadoEm"
) {
  const clauses = [];

  if (!isCoordinator()) {
    clauses.push(
      where(
        "id",
        "==",
        currentId()
      )
    );
  }

  clauses.push(...extra);

  let q;

  try {
    q = query(
      collection(db, collectionName),
      ...clauses,
      orderBy(sortField, "desc")
    );

    return (
      await getDocs(q)
    ).docs;

  } catch (e) {

    try {
      q = query(
        collection(db, collectionName),
        ...clauses
      );

      const docs =
        (await getDocs(q)).docs;

      return docs.sort(
        (a, b) => {
          const av =
            a.data()[sortField]?.seconds || 0;

          const bv =
            b.data()[sortField]?.seconds || 0;

          return bv - av;
        }
      );

    } catch (err) {
      throw err;
    }
  }
}

function value(n) {
  return state.eye
    ? money(n)
    : "R$ ••••••";
}

function profileName() {
  return (
    state.profile?.nome ||
    state.user?.email ||
    "Usuário"
  );
}

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function renderNav() {
  const nav = $("mainNav");

  nav.innerHTML = "";

  Object.entries(groups)
    .forEach(([group, items]) => {

      const wrap =
        document.createElement("div");

      wrap.className =
        "nav-group";

      wrap.innerHTML = `
        <div class="nav-group-title">
          ${group}
        </div>
      `;

      items.forEach(route => {

        if (!canView(route)) return;

        const r =
          routes[route];

        const btn =
          document.createElement("button");

        btn.className =
          `nav-item w-full ${
            state.currentRoute === route
              ? "active"
              : ""
          }`;

        btn.innerHTML = `
          <span>${r.icon}</span>
          <span class="nav-label">
            ${r.title}
          </span>
        `;

        btn.addEventListener(
          "click",
          () => navigate(route)
        );

        wrap.appendChild(btn);
      });

      nav.appendChild(wrap);
    });
}

function canView(route) {

  if (
    route === "sistema/ids" ||
    route === "sistema/avisos"
  ) {
    return isCoordinator();
  }

  if (
    route === "sistema/logs" ||
    route === "sistema/usuarios" ||
    route === "sistema/acessos"
  ) {
    return true;
  }

  const access =
    state.profile?.acessos;

  if (!access) return true;

  const p =
    access[route];

  if (p === undefined) {
    return true;
  }

  return (
    p === true ||
    p?.visualizar === true ||
    p?.view === true
  );
}

function canEdit(route) {

  if (isCoordinator()) {
    return true;
  }

  const access =
    state.profile?.acessos?.[route];

  if (access === undefined) {
    return true;
  }

  return (
    access === true ||
    access?.editar === true ||
    access?.edit === true
  );
}

async function navigate(route) {

  if (!routes[route]) {
    route = "dashboard";
  }

  if (!canView(route)) {

    notify(
      "Você não possui permissão para acessar esta página.",
      "error"
    );

    return navigate("dashboard");
  }

  state.currentRoute = route;

  const r =
    routes[route];

  $("pageTitle").textContent =
    r.title;

  $("breadcrumb").textContent =
    `${r.group} / ${r.title}`;

  $("headerIdBadge").textContent =
    isCoordinator()
      ? "COORDENADOR-GERAL"
      : `ID ${currentId() || "—"}`;

  renderNav();

  $("sidebar")
    .classList
    .remove("mobile-open");

  await renderPage(route);
}

async function renderPage(route) {

  const content =
    $("pageContent");

  content.innerHTML = `
    <div class="card">
      <div
        class="spinner"
        style="margin:auto"
      ></div>
    </div>
  `;

  try {

    const pages = {

      dashboard:
        renderDashboard,

      "cartao/lancamento":
        renderCardLaunch,

      "cartao/lote":
        () =>
          renderPdfImport("cartao"),

      "cartao/divergentes":
        renderDivergentes,

      "cartao/consulta":
        renderCardConsult,

      "cartao/parametros":
        renderCardParams,

      "financeiro/lancamento":
        renderFinanceLaunch,

      "financeiro/lote":
        () =>
          renderPdfImport("financeiro"),

      "financeiro/auditoria":
        renderAuditFinance,

      "financeiro/parametros":
        renderFinanceParams,

      "sistema/acessos":
        renderAccess,

      "sistema/usuarios":
        renderUsers,

      "sistema/logs":
        renderLogs,

      "sistema/ids":
        renderIds,

      "sistema/avisos":
        renderNotices
    };

    await pages[route]();

  } catch (e) {

    console.error(e);

    content.innerHTML = `
      <div class="card">

        <strong>
          Não foi possível carregar a página.
        </strong>

        <p class="muted">
          ${esc(e.message)}
        </p>

      </div>
    `;
  }
}

function setContent(html) {
  $("pageContent").innerHTML = html;
}

/* =========================================================
   AVISOS
   ========================================================= */

async function getActiveNotices() {

  const docs =
    await scopedDocs(
      "avisos",
      [
        where(
          "ativo",
          "==",
          true
        )
      ],
      "criadoEm"
    );

  return docs.filter(d => {

    const x = d.data();

    if (!x.expiraEm) {
      return true;
    }

    return (
      new Date(x.expiraEm) >=
      new Date()
    );
  });
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function renderDashboard() {

  const notices =
    await getActiveNotices();

  const finance =
    await scopedDocs(
      "transacoes_financeiras",
      [],
      "data"
    );

  const cards =
    await scopedDocs(
      "transacoes_cartao",
      [],
      "data"
    );

  const rec =
    finance
      .filter(
        d =>
          d.data().tipo ===
          "Receita"
      )
      .reduce(
        (s, d) =>
          s +
          (Number(
            d.data().valor
          ) || 0),
        0
      );

  const exp =
    finance
      .filter(
        d =>
          d.data().tipo ===
          "Despesa"
      )
      .reduce(
        (s, d) =>
          s +
          (Number(
            d.data().valor
          ) || 0),
        0
      );

  const cardTotal =
    cards.reduce(
      (s, d) =>
        s +
        (Number(
          d.data().valor
        ) || 0),
      0
    );

  const flow =
    rec - exp;

  const month =
    new Date().getMonth();

  const year =
    new Date().getFullYear();

  const monthly =
    Array.from(
      { length: 6 },
      (_, i) => {

        const d =
          new Date(
            year,
            month - 5 + i,
            1
          );

        const y =
          d.getFullYear();

        const m =
          d.getMonth();

        const total =
          finance
            .filter(x => {

              const raw =
                x.data().data;

              if (!raw) {
                return false;
              }

              const dt =
                raw?.toDate
                  ? raw.toDate()
                  : new Date(raw);

              return (
                dt.getFullYear() === y &&
                dt.getMonth() === m
              );
            })
            .reduce(
              (s, x) =>
                s +
                (
                  x.data().tipo ===
                  "Receita"
                    ? 1
                    : -1
                ) *
                (
                  Number(
                    x.data().valor
                  ) || 0
                ),
              0
            );

        return {
          label:
            d
              .toLocaleDateString(
                "pt-BR",
                {
                  month: "short"
                }
              )
              .replace(".", ""),

          total
        };
      }
    );

  const max =
    Math.max(
      ...monthly.map(
        x =>
          Math.abs(x.total)
      ),
      1
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          Olá, ${esc(profileName())}! 👋
        </h3>

        <p>
          Resumo financeiro e avisos do sistema.
        </p>

      </div>

    </div>

    ${
      notices.length
        ? `
          <div class="dashboard-notices">

            ${notices
              .map(
                d => `
                  <div class="notice-banner">

                    <strong>
                      📢
                      ${esc(
                        d.data().titulo ||
                        "Aviso"
                      )}
                    </strong>

                    <p>
                      ${esc(
                        d.data().mensagem ||
                        ""
                      )}
                    </p>

                  </div>
                `
              )
              .join("")}

          </div>
        `
        : ""
    }

    <div class="grid grid-4">

      ${metric(
        "Receitas",
        rec,
        "💰",
        "text-green"
      )}

      ${metric(
        "Despesas",
        exp,
        "📉",
        "text-red"
      )}

      ${metric(
        "Cartões",
        cardTotal,
        "💳",
        "text-purple"
      )}

      ${metric(
        "Fluxo de Caixa",
        flow,
        "📊",
        flow >= 0
          ? "text-green"
          : "text-red"
      )}

    </div>

    <div
      class="grid grid-2"
      style="margin-top:16px"
    >

      <div class="card chart-box">

        <h4 class="section-title">
          Fluxo dos últimos 6 meses
        </h4>

        <div class="bars">

          ${monthly
            .map(
              x => `
                <div
                  class="bar"
                  style="
                    height:
                    ${Math.max(
                      8,
                      Math.round(
                        Math.abs(
                          x.total
                        ) /
                        max *
                        175
                      )
                    )}px
                  "
                >

                  <span>
                    ${value(x.total)}
                  </span>

                  <small>
                    ${esc(x.label)}
                  </small>

                </div>
              `
            )
            .join("")}

        </div>

      </div>

      <div class="card">

        <h4 class="section-title">
          Resumo operacional
        </h4>

        <div class="grid grid-2">

          ${miniStat(
            "Lançamentos financeiros",
            finance.length
          )}

          ${miniStat(
            "Lançamentos de cartão",
            cards.length
          )}

          ${miniStat(
            "Avisos ativos",
            notices.length
          )}

          ${miniStat(
            "Seu ID",
            currentId() || "Todos"
          )}

        </div>

        <div
          class="notice"
          style="margin-top:16px"
        >

          <strong>
            🔒 Proteção de valores
          </strong>

          <p>
            Os indicadores monetários
            permanecem ocultos até
            você clicar no botão 👁️.
          </p>

        </div>

      </div>

    </div>
  `);
}

function metric(
  label,
  val,
  icon,
  cls
) {
  return `
    <div class="card metric-card">

      <div class="metric-icon">
        ${icon}
      </div>

      <div class="metric-label">
        ${label}
      </div>

      <div
        class="metric-value ${cls} money"
      >
        ${value(val)}
      </div>

    </div>
  `;
}

function miniStat(
  label,
  val
) {
  return `
    <div
      class="card"
      style="padding:13px"
    >

      <div class="small muted">
        ${label}
      </div>

      <strong
        style="font-size:18px"
      >
        ${esc(val)}
      </strong>

    </div>
  `;
}

/* =========================================================
   FORMULÁRIOS
   ========================================================= */

function formLayout(
  inner,
  buttons = ""
) {
  return `
    <div class="card form-card">

      <div class="form-grid">
        ${inner}
      </div>

      ${
        buttons
          ? `
            <div class="form-actions">
              ${buttons}
            </div>
          `
          : ""
      }

    </div>
  `;
}

function field(
  label,
  name,
  type = "text",
  extra = ""
) {
  return `
    <div class="field">

      <label>
        ${label}
      </label>

      <input
        name="${name}"
        type="${type}"
        ${extra}
      >

    </div>
  `;
}

function selectField(
  label,
  name,
  options,
  extra = ""
) {
  return `
    <div class="field">

      <label>
        ${label}
      </label>

      <select
        name="${name}"
        ${extra}
      >

        ${options
          .map(
            o => `
              <option
                value="${esc(o)}"
              >
                ${esc(o)}
              </option>
            `
          )
          .join("")}

      </select>

    </div>
  `;
}

function actions(
  editId = ""
) {
  return `
    <button
      type="submit"
      class="btn btn-primary"
    >
      💾
      ${
        editId
          ? "Salvar alterações"
          : "Salvar lançamento"
      }
    </button>
  `;
}

/* =========================================================
   CARTÃO — LANÇAMENTO
   ========================================================= */

async function renderCardLaunch() {

  const users =
    await scopedDocs(
      "usuarios",
      [
        where(
          "status",
          "==",
          "Ativo"
        )
      ],
      "nome"
    );

  const categories =
    await scopedDocs(
      "categorias",
      [
        where(
          "tipo",
          "in",
          [
            "Despesa",
            "Receita",
            "Cartão"
          ]
        )
      ],
      "nome"
    ).catch(
      () => []
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          💳 Lançamento Avulso
        </h3>

        <p>
          Cadastre uma transação de
          cartão compartilhado.
        </p>

      </div>

    </div>

    <form id="cardLaunchForm">

      ${formLayout(`

        ${field(
          "Data",
          "data",
          "date",
          "required"
        )}

        ${field(
          "Descrição",
          "descricao",
          "text",
          'required placeholder="Descrição do lançamento"'
        )}

        ${field(
          "Valor",
          "valor",
          "number",
          'required min="0" step="0.01" placeholder="0,00"'
        )}

        ${selectField(
          "Portador",
          "portadorUid",
          [
            "",
            ...users.map(
              d => d.id
            ),
            ...(
              !users.length
                ? ["Não cadastrado"]
                : []
            )
          ]
        )}

        ${field(
          "ID",
          "id",
          "text",
          `value="${esc(
            currentId()
          )}" ${
            !isCoordinator()
              ? "readonly"
              : ""
          }`
        )}

        ${selectField(
          "Categoria",
          "categoria",
          [
            "",
            ...categories.map(
              d =>
                d.data().nome
            )
          ]
        )}

        ${field(
          "Observação",
          "observacao",
          "text",
          'placeholder="Opcional"'
        )}

      `, actions())}

    </form>

    <div class="card table-card">

      <div class="table-toolbar">

        <strong>
          Últimos lançamentos
        </strong>

        <button
          id="refreshCardLaunch"
          class="btn btn-soft"
        >
          🔄 Atualizar
        </button>

      </div>

      <div id="cardLaunchTable"></div>

    </div>
  `);

  $("cardLaunchForm")
    .addEventListener(
      "submit",
      async e => {

        e.preventDefault();

        if (
          !canEdit(
            "cartao/lancamento"
          )
        ) {
          return notify(
            "Sem permissão para editar.",
            "error"
          );
        }

        const f =
          new FormData(e.target);

        const data =
          Object.fromEntries(
            f.entries()
          );

        data.valor =
          Number(data.valor);

        data.portadorUid =
          data.portadorUid ||
          null;

        await addRecord(
          "transacoes_cartao",
          data,
          "Novo lançamento de cartão"
        );

        e.target.reset();

        e.target.id.value =
          currentId();

        notify(
          "Lançamento salvo com sucesso."
        );

        await loadCardLaunchTable();
      }
    );

  $("refreshCardLaunch")
    .onclick =
      loadCardLaunchTable;

  await loadCardLaunchTable();
}

async function loadCardLaunchTable() {

  const docs =
    await scopedDocs(
      "transacoes_cartao",
      [],
      "data"
    );

  $("cardLaunchTable")
    .innerHTML =
      table(
        [
          "Data",
          "Descrição",
          "Portador",
          "Categoria",
          "Valor",
          "Ações"
        ],
        docs.map(d => {

          const x =
            d.data();

          return [
            dateBR(x.data),
            esc(x.descricao),
            esc(
              x.portadorUid ||
              "—"
            ),
            esc(
              x.categoria ||
              "—"
            ),
            `
              <strong class="money">
                ${value(x.valor)}
              </strong>
            `,
            rowActions(
              "transacoes_cartao",
              d.id
            )
          ];
        })
      );
}

/* =========================================================
   TABELAS / AÇÕES
   ========================================================= */

function rowActions(
  col,
  id
) {
  return `
    <div class="actions">

      <button
        class="btn btn-soft btn-edit"
        data-col="${col}"
        data-id="${id}"
      >
        ✏️
      </button>

      <button
        class="btn btn-danger btn-delete"
        data-col="${col}"
        data-id="${id}"
      >
        🗑️
      </button>

    </div>
  `;
}

function table(
  headers,
  rows
) {

  if (!rows.length) {
    return `
      <div class="empty">
        Nenhum registro encontrado.
      </div>
    `;
  }

  const h =
    headers
      .map(
        x =>
          `<th>${x}</th>`
      )
      .join("");

  const b =
    rows
      .map(
        r =>
          `
            <tr>
              ${
                r
                  .map(
                    c =>
                      `<td>${c ?? "—"}</td>`
                  )
                  .join("")
              }
            </tr>
          `
      )
      .join("");

  setTimeout(
    bindTableActions,
    0
  );

  return `
    <div class="table-wrap">

      <table class="data-table">

        <thead>
          <tr>
            ${h}
          </tr>
        </thead>

        <tbody>
          ${b}
        </tbody>

      </table>

    </div>
  `;
}

function bindTableActions() {

  document
    .querySelectorAll(
      ".btn-delete"
    )
    .forEach(
      b =>
        b.onclick =
          () =>
            confirmDelete(
              b.dataset.col,
              b.dataset.id
            )
    );

  document
    .querySelectorAll(
      ".btn-edit"
    )
    .forEach(
      b =>
        b.onclick =
          () =>
            openEdit(
              b.dataset.col,
              b.dataset.id
            )
    );
}

function confirmDelete(
  col,
  id
) {

  modal({

    title:
      "Confirmar exclusão",

    body:
      "<p>Deseja realmente excluir este registro? Esta operação será registrada nos logs de auditoria.</p>",

    footer: `
      <button
        class="btn btn-outline"
        data-close-modal
      >
        Cancelar
      </button>

      <button
        class="btn btn-danger"
        id="confirmDeleteBtn"
      >
        🗑️ Excluir
      </button>
    `
  });

  $("confirmDeleteBtn")
    .onclick =
      async () => {

        try {

          await deleteRecord(
            col,
            id,
            "Exclusão de registro"
          );

          closeModal();

          notify(
            "Registro excluído."
          );

          await renderPage(
            state.currentRoute
          );

        } catch (e) {

          notify(
            e.message,
            "error"
          );
        }
      };

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      x =>
        x.onclick =
          closeModal
    );
}

async function openEdit(
  col,
  id
) {

  const snap =
    await getDoc(
      doc(db, col, id)
    );

  if (!snap.exists()) {
    return;
  }

  const x =
    snap.data();

  const fields =
    Object.entries(x)
      .filter(
        ([k]) =>
          ![
            "criadoEm",
            "atualizadoEm",
            "usuarioUid",
            "ativo"
          ].includes(k)
      );

  modal({

    title:
      "Editar registro",

    body: `
      <form id="genericEditForm">

        <div class="form-grid">

          ${fields
            .map(
              ([k, v]) => {

                if (
                  k === "tipo"
                ) {
                  return selectField(
                    k,
                    k,
                    [
                      "Receita",
                      "Despesa",
                      "Cartão"
                    ],
                    `value="${esc(v)}"`
                  );
                }

                return field(
                  k,
                  k,
                  typeof v ===
                    "number"
                    ? "number"
                    : "text",
                  `value="${esc(v)}"`
                );
              }
            )
            .join("")}

        </div>

        <div class="form-actions">

          <button
            class="btn btn-primary"
            type="submit"
          >
            💾 Salvar
          </button>

        </div>

      </form>
    `
  });

  $("genericEditForm")
    .onsubmit =
      async e => {

        e.preventDefault();

        const data =
          Object.fromEntries(
            new FormData(
              e.target
            ).entries()
          );

        if ("valor" in data) {
          data.valor =
            Number(data.valor);
        }

        await updateRecord(
          col,
          id,
          data,
          "Alteração de registro"
        );

        closeModal();

        notify(
          "Alterações salvas."
        );

        await renderPage(
          state.currentRoute
        );
      };
}

/* =========================================================
   IMPORTAÇÃO DE PDF
   ========================================================= */

async function renderPdfImport(
  type
) {

  const title =
    type === "cartao"
      ? "💳 Importação de Fatura de Cartão"
      : "💰 Importação de Extrato Bancário";

  const col =
    type === "cartao"
      ? "transacoes_cartao"
      : "transacoes_financeiras";

  setContent(`

    <div class="page-header">

      <div>

        <h3>${title}</h3>

        <p>
          Envie o PDF, confira os
          lançamentos extraídos e
          grave somente após sua
          conferência.
        </p>

      </div>

    </div>

    <div class="card">

      <label
        class="pdf-drop"
        for="pdfFile"
      >

        <div class="upload-icon">
          📄
        </div>

        <strong>
          Selecionar PDF
        </strong>

        <div class="responsive-note">
          A extração ocorre no
          navegador. PDFs digitalizados
          como imagem podem exigir OCR
          externo.
        </div>

        <input
          id="pdfFile"
          type="file"
          accept="application/pdf"
        >

      </label>

      <div
        id="pdfStatus"
        class="responsive-note"
      ></div>

    </div>

    <div
      class="card table-card"
    >

      <div class="table-toolbar">

        <strong>
          Conferência dos lançamentos
        </strong>

        <div class="actions">

          <button
            id="clearImport"
            class="btn btn-soft"
          >
            Limpar
          </button>

          <button
            id="saveImport"
            class="btn btn-primary"
          >
            💾 Gravar em massa
          </button>

        </div>

      </div>

      <div id="pdfTable">

        <div class="empty">
          Nenhum PDF processado.
        </div>

      </div>

    </div>
  `);

  let imported = [];

  $("pdfFile")
    .onchange =
      async e => {

        const file =
          e.target.files[0];

        if (!file) return;

        $("pdfStatus")
          .textContent =
            "Processando PDF...";

        try {

          imported =
            await extractPdf(
              file,
              type
            );

          renderImportTable(
            imported,
            type
          );

          $("pdfStatus")
            .textContent =
              `${imported.length} lançamento(s) identificado(s). Confira antes de gravar.`;

        } catch (err) {

          console.error(err);

          $("pdfStatus")
            .textContent =
              `Erro: ${err.message}`;
        }
      };

  $("clearImport")
    .onclick =
      () => {

        imported = [];

        $("pdfTable")
          .innerHTML =
            `
              <div class="empty">
                Nenhum lançamento na conferência.
              </div>
            `;
      };

  $("saveImport")
    .onclick =
      async () => {

        if (!imported.length) {

          return notify(
            "Não há lançamentos para gravar.",
            "error"
          );
        }

        try {

          const batch =
            writeBatch(
              db
            );

          imported.forEach(
            item => {

              const ref =
                doc(
                  collection(
                    db,
                    col
                  )
                );

              batch.set(
                ref,
                {
                  ...item,
                  id:
                    item.id ||
                    currentId(),

                  usuarioUid:
                    uid(),

                  criadoEm:
                    serverTimestamp(),

                  atualizadoEm:
                    serverTimestamp(),

                  ativo: true,

                  origem: "PDF"
                }
              );
            }
          );

          await batch.commit();

          await audit(
            "INSERT_BATCH",
            col,
            "",
            "Importação em lote via PDF"
          );

          notify(
            `${imported.length} lançamento(s) gravado(s).`
          );

          imported = [];

          $("pdfTable")
            .innerHTML =
              `
                <div class="empty">
                  Importação concluída.
                </div>
              `;

        } catch (err) {

          notify(
            err.message,
            "error"
          );
        }
      };
}

async function extractPdf(
  file,
  type
) {

  const pdfjs =
    await import(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
    );

  pdfjs
    .GlobalWorkerOptions
    .workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

  const pdf =
    await pdfjs.getDocument({
      data:
        await file.arrayBuffer()
    }).promise;

  let text = "";

  for (
    let p = 1;
    p <= pdf.numPages;
    p++
  ) {

    const page =
      await pdf.getPage(p);

    const tc =
      await page.getTextContent();

    text +=
      tc.items
        .map(i => i.str)
        .join(" ") +
      "\n";
  }

  return parseFinancialText(
    text,
    type
  );
}

function parseFinancialText(
  text,
  type
) {

  const lines =
    text
      .split(/\n+/)
      .map(x => x.trim())
      .filter(Boolean);

  const result = [];

  const moneyRe =
    /R?\$?\s?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/;

  lines.forEach(
    line => {

      const m =
        line.match(
          moneyRe
        );

      if (!m) return;

      const raw =
        m[1]
          .replace(/\./g, "")
          .replace(",", ".");

      const valor =
        Number(raw);

      const dm =
        line.match(
          /\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/
        );

      let data =
        new Date()
          .toISOString()
          .slice(0, 10);

      if (dm) {

        const y =
          dm[3]
            ? String(dm[3]).length === 2
              ? "20" + dm[3]
              : dm[3]
            : String(
                new Date()
                  .getFullYear()
              );

        data =
          `${y}-${String(dm[2]).padStart(2,"0")}-${String(dm[1]).padStart(2,"0")}`;
      }

      const descricao =
        line
          .replace(m[0], "")
          .replace(
            dm?.[0] || "",
            ""
          )
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      if (
        type === "cartao"
      ) {

        result.push({
          data,
          descricao:
            descricao ||
            "Importado do PDF",
          valor,
          categoria: "",
          portadorUid: null,
          id: currentId()
        });

      } else {

        result.push({
          data,
          descricao:
            descricao ||
            "Importado do PDF",
          valor,
          tipo:
            /\b(crédito|credito|entrada|recebimento)\b/i
              .test(line)
              ? "Receita"
              : "Despesa",
          categoria: "",
          subcategoria: "",
          id: currentId()
        });
      }
    }
  );

  return result;
}

function renderImportTable(
  items,
  type
) {

  $("pdfTable")
    .innerHTML =
      items.length
        ? table(
            [
              "Data",
              "Descrição",
              "Tipo",
              "Valor",
              "ID"
            ],
            items.map(
              (x, i) => [
                `
                  <input
                    class="search-input import-date"
                    data-i="${i}"
                    value="${esc(x.data)}"
                  >
                `,

                `
                  <input
                    class="search-input import-desc"
                    data-i="${i}"
                    value="${esc(x.descricao)}"
                  >
                `,

                type === "financeiro"
                  ? `
                    <select
                      class="search-input import-type"
                      data-i="${i}"
                    >

                      <option
                        ${
                          x.tipo === "Receita"
                            ? "selected"
                            : ""
                        }
                      >
                        Receita
                      </option>

                      <option
                        ${
                          x.tipo === "Despesa"
                            ? "selected"
                            : ""
                        }
                      >
                        Despesa
                      </option>

                    </select>
                  `
                  : "💳 Cartão",

                `
                  <input
                    class="search-input import-value"
                    type="number"
                    step="0.01"
                    data-i="${i}"
                    value="${x.valor}"
                  >
                `,

                esc(
                  x.id ||
                  currentId()
                )
              ]
            )
          )
        : `
          <div class="empty">
            Nenhum lançamento reconhecido
            no texto do PDF.
          </div>
        `;

  [
    "date",
    "desc",
    "type",
    "value"
  ].forEach(
    kind => {

      document
        .querySelectorAll(
          `.import-${kind}`
        )
        .forEach(
          el =>
            el.oninput =
              () => {

                const i =
                  Number(
                    el.dataset.i
                  );

                if (
                  kind === "date"
                ) {
                  items[i].data =
                    el.value;
                }

                if (
                  kind === "desc"
                ) {
                  items[i].descricao =
                    el.value;
                }

                if (
                  kind === "type"
                ) {
                  items[i].tipo =
                    el.value;
                }

                if (
                  kind === "value"
                ) {
                  items[i].valor =
                    Number(
                      el.value
                    );
                }
              }
        );
    }
  );
}

/* =========================================================
   DIVERGENTES
   ========================================================= */

async function renderDivergentes() {

  const docs =
    await scopedDocs(
      "transacoes_cartao",
      [],
      "data"
    );

  const div =
    docs.filter(
      d =>
        !d.data()
          .portadorUid
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          ⚠️ Dados Divergentes
        </h3>

        <p>
          Lançamentos de cartão sem
          portador identificado.
        </p>

      </div>

    </div>

    <div class="card table-card">

      <div class="table-toolbar">

        <strong>
          ${div.length}
          pendência(s)
        </strong>

        <button
          id="refreshDiv"
          class="btn btn-soft"
        >
          🔄 Atualizar
        </button>

      </div>

      <div id="divTable">

        ${
          table(
            [
              "Data",
              "Descrição",
              "Valor",
              "Portador",
              "Ação"
            ],
            div.map(
              d => {

                const x =
                  d.data();

                return [
                  dateBR(x.data),

                  esc(
                    x.descricao
                  ),

                  `
                    <span class="money">
                      ${value(x.valor)}
                    </span>
                  `,

                  `
                    <span
                      class="badge badge-red"
                    >
                      Não identificado
                    </span>
                  `,

                  `
                    <button
                      class="btn btn-primary resolve-div"
                      data-id="${d.id}"
                    >
                      🔗 Vincular
                    </button>
                  `
                ];
              }
            )
          )
        }

      </div>

    </div>
  `);

  document
    .querySelectorAll(
      ".resolve-div"
    )
    .forEach(
      b =>
        b.onclick =
          () =>
            resolveDivergence(
              b.dataset.id
            )
    );
}

async function resolveDivergence(
  id
) {

  const users =
    await scopedDocs(
      "usuarios",
      [
        where(
          "status",
          "==",
          "Ativo"
        )
      ],
      "nome"
    );

  modal({

    title:
      "Vincular portador",

    body: `
      <div class="field">

        <label>
          Usuário
        </label>

        <select id="resolveUser">

          ${users
            .map(
              u => `
                <option
                  value="${u.id}"
                >
                  ${esc(
                    u.data().nome ||
                    u.data().email
                  )}
                  —
                  ${esc(
                    u.data().id ||
                    ""
                  )}
                </option>
              `
            )
            .join("")}

        </select>

      </div>
    `,

    footer: `
      <button
        class="btn btn-outline"
        data-close-modal
      >
        Cancelar
      </button>

      <button
        id="resolveSave"
        class="btn btn-primary"
      >
        🔗 Vincular
      </button>
    `
  });

  document
    .querySelectorAll(
      "[data-close-modal]"
    )
    .forEach(
      x =>
        x.onclick =
          closeModal
    );

  $("resolveSave")
    .onclick =
      async () => {

        await updateRecord(
          "transacoes_cartao",
          id,
          {
            portadorUid:
              $("resolveUser").value
          },
          "Vinculação de portador"
        );

        closeModal();

        notify(
          "Portador vinculado."
        );

        renderDivergentes();
      };
}

/* =========================================================
   CONSULTA DE FATURA
   ========================================================= */

async function renderCardConsult() {

  const docs =
    await scopedDocs(
      "transacoes_cartao",
      [],
      "data"
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          🔍 Consulta de Fatura
        </h3>

        <p>
          Consolidação por período,
          portador e status de pagamento.
        </p>

      </div>

    </div>

    ${formLayout(
      `
        ${field(
          "Data inicial",
          "ini",
          "date"
        )}

        ${field(
          "Data final",
          "fim",
          "date"
        )}

        ${selectField(
          "Status",
          "status",
          [
            "Todos",
            "Pendente",
            "Pago"
          ]
        )}
      `,
      `
        <button
          id="filterCard"
          class="btn btn-primary"
        >
          🔍 Filtrar
        </button>
      `
    )}

    <div
      class="card table-card"
    >

      <div
        id="cardConsultTable"
      >
        ${renderCardRows(docs)}
      </div>

    </div>
  `);

  $("filterCard")
    .onclick =
      async () => {

        const ini =
          $("[name=ini]").value;

        const fim =
          $("[name=fim]").value;

        const status =
          $("[name=status]").value;

        const rows =
          docs.filter(
            d => {

              const x =
                d.data();

              if (
                ini &&
                x.data < ini
              ) {
                return false;
              }

              if (
                fim &&
                x.data > fim
              ) {
                return false;
              }

              if (
                status !==
                "Todos" &&
                (
                  x.statusPagamento ||
                  "Pendente"
                ) !== status
              ) {
                return false;
              }

              return true;
            }
          );

        $("cardConsultTable")
          .innerHTML =
            renderCardRows(
              rows
            );
      };
}

function renderCardRows(
  docs
) {

  return table(
    [
      "Data",
      "Descrição",
      "Portador",
      "Status",
      "Valor"
    ],
    docs.map(
      d => {

        const x =
          d.data();

        const st =
          x.statusPagamento ||
          "Pendente";

        return [
          dateBR(x.data),

          esc(
            x.descricao
          ),

          esc(
            x.portadorUid ||
            "Não identificado"
          ),

          `
            <span
              class="badge ${
                st === "Pago"
                  ? "badge-green"
                  : "badge-gray"
              }"
            >
              ${st}
            </span>
          `,

          `
            <span class="money">
              ${value(x.valor)}
            </span>
          `
        ];
      }
    )
  );
}

/* =========================================================
   PARÂMETROS DO CARTÃO
   ========================================================= */

async function renderCardParams() {

  const docs =
    await scopedDocs(
      "parametros_cartao"
    );

  const p =
    docs[0]?.data() ||
    {};

  const users =
    await scopedDocs(
      "usuarios",
      [
        where(
          "status",
          "==",
          "Ativo"
        )
      ],
      "nome"
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          ⚙️ Parâmetros do Cartão
        </h3>

        <p>
          Configure fechamento e
          usuários autorizados.
        </p>

      </div>

    </div>

    <form id="cardParams">

      ${formLayout(

        `
          ${field(
            "Data de virada",
            "virada",
            "number",
            `
              min="1"
              max="31"
              required
              value="${esc(
                p.virada || ""
              )}"
            `
          )}

          ${field(
            "Data de fechamento",
            "fechamento",
            "number",
            `
              min="1"
              max="31"
              required
              value="${esc(
                p.fechamento || ""
              )}"
            `
          )}

          <div class="field span-2">

            <label>
              Usuários autorizados
            </label>

            <div class="pill-list">

              ${
                users.map(
                  u => `
                    <label class="pill">

                      <input
                        type="checkbox"
                        name="authorized"
                        value="${u.id}"
                        ${
                          p.autorizados?.includes(
                            u.id
                          )
                            ? "checked"
                            : ""
                        }
                      >

                      ${esc(
                        u.data().nome ||
                        u.data().email
                      )}

                    </label>
                  `
                ).join("")
                ||
                `
                  <span class="muted">
                    Nenhum usuário ativo.
                  </span>
                `
              }

            </div>

          </div>
        `,

        `
          <button
            class="btn btn-primary"
          >
            💾 Salvar parâmetros
          </button>
        `
      )}

    </form>
  `);

  $("cardParams")
    .onsubmit =
      async e => {

        e.preventDefault();

        const f =
          new FormData(
            e.target
          );

        const autorizados =
          f.getAll(
            "authorized"
          );

        const data = {
          virada:
            Number(
              f.get("virada")
            ),

          fechamento:
            Number(
              f.get("fechamento")
            ),

          autorizados,

          id:
            currentId()
        };

        if (docs[0]) {

          await updateRecord(
            "parametros_cartao",
            docs[0].id,
            data,
            "Alteração de parâmetros do cartão"
          );

        } else {

          await addRecord(
            "parametros_cartao",
            data,
            "Cadastro de parâmetros do cartão"
          );
        }

        notify(
          "Parâmetros salvos."
        );
      };
}

/* =========================================================
   FINANCEIRO
   ========================================================= */

async function renderFinanceLaunch() {

  const cats =
    await scopedDocs(
      "categorias",
      [],
      "nome"
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          💰 Lançamento e Consulta
        </h3>

        <p>
          Receitas e despesas com
          persistência no Firestore.
        </p>

      </div>

    </div>

    <form id="financeForm">

      ${formLayout(

        `
          ${selectField(
            "Tipo",
            "tipo",
            [
              "Receita",
              "Despesa"
            ],
            "required"
          )}

          ${field(
            "Data",
            "data",
            "date",
            "required"
          )}

          ${selectField(
            "Categoria",
            "categoria",
            [
              "",
              ...cats
                .filter(
                  d =>
                    d.data().tipo ===
                      "Receita" ||
                    d.data().tipo ===
                      "Despesa"
                )
                .map(
                  d =>
                    d.data().nome
                )
            ]
          )}

          ${field(
            "Subcategoria",
            "subcategoria"
          )}

          ${field(
            "Valor",
            "valor",
            "number",
            `
              required
              min="0"
              step="0.01"
            `
          )}

          ${field(
            "Descrição",
            "descricao",
            "text",
            "required"
          )}

          ${field(
            "ID",
            "id",
            "text",
            `
              value="${esc(
                currentId()
              )}"
              ${
                !isCoordinator()
                  ? "readonly"
                  : ""
              }
            `
          )}
        `,

        `
          <button
            class="btn btn-primary"
          >
            💾 Salvar lançamento
          </button>
        `
      )}

    </form>

    <div class="card table-card">

      <div class="table-toolbar">

        <strong>
          Consulta
        </strong>

        <div class="actions">

          <input
            id="financeSearch"
            class="search-input"
            placeholder="🔍 Buscar descrição/categoria"
          >

        </div>

      </div>

      <div id="financeTable"></div>

    </div>
  `);

  $("financeForm")
    .onsubmit =
      async e => {

        e.preventDefault();

        const f =
          new FormData(
            e.target
          );

        const data =
          Object.fromEntries(
            f.entries()
          );

        data.valor =
          Number(data.valor);

        await addRecord(
          "transacoes_financeiras",
          data,
          "Novo lançamento financeiro"
        );

        e.target.reset();

        e.target.id.value =
          currentId();

        notify(
          "Lançamento financeiro salvo."
        );

        loadFinanceTable();
      };

  $("financeSearch")
    .oninput =
      loadFinanceTable;

  await loadFinanceTable();
}

async function loadFinanceTable() {

  const docs =
    await scopedDocs(
      "transacoes_financeiras",
      [],
      "data"
    );

  const term =
    (
      $("financeSearch")
        ?.value || ""
    ).toLowerCase();

  const rows =
    docs.filter(
      d =>
        JSON.stringify(
          d.data()
        )
          .toLowerCase()
          .includes(term)
    );

  $("financeTable")
    .innerHTML =
      table(
        [
          "Data",
          "Tipo",
          "Categoria",
          "Descrição",
          "Valor",
          "Ações"
        ],
        rows.map(
          d => {

            const x =
              d.data();

            return [
              dateBR(x.data),

              `
                <span
                  class="badge ${
                    x.tipo ===
                    "Receita"
                      ? "badge-green"
                      : "badge-red"
                  }"
                >
                  ${esc(x.tipo)}
                </span>
              `,

              esc(
                x.categoria ||
                "—"
              ),

              esc(
                x.descricao
              ),

              `
                <span class="money">
                  ${value(x.valor)}
                </span>
              `,

              rowActions(
                "transacoes_financeiras",
                d.id
              )
            ];
          }
        )
      );
}

/* =========================================================
   AUDITORIA FINANCEIRA
   ========================================================= */

async function renderAuditFinance() {

  const docs =
    await scopedDocs(
      "transacoes_financeiras",
      [],
      "data"
    );

  const groupsMap =
    {};

  docs.forEach(
    d => {

      const x =
        d.data();

      const k =
        `${x.tipo || "—"}|${
          x.categoria ||
          "Sem categoria"
        }|${
          x.subcategoria ||
          "Sem subcategoria"
        }`;

      groupsMap[k] =
        (
          groupsMap[k] ||
          0
        ) +
        (
          Number(
            x.valor
          ) || 0
        );
    }
  );

  const rows =
    Object.entries(
      groupsMap
    ).map(
      ([k, v]) => {

        const [
          tipo,
          cat,
          sub
        ] =
          k.split("|");

        return [
          esc(tipo),
          esc(cat),
          esc(sub),
          `
            <span class="money">
              ${value(v)}
            </span>
          `
        ];
      }
    );

  const total =
    docs.reduce(
      (s, d) =>
        s +
        (
          d.data().tipo ===
          "Receita"
            ? 1
            : -1
        ) *
        (
          Number(
            d.data().valor
          ) || 0
        ),
      0
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          📊 Auditoria Financeira
        </h3>

        <p>
          Subtotais por categoria e
          subcategoria do período carregado.
        </p>

      </div>

    </div>

    <div class="grid grid-3">

      <div class="card">

        <div class="small muted">
          Registros
        </div>

        <strong>
          ${docs.length}
        </strong>

      </div>

      <div class="card">

        <div class="small muted">
          Fluxo líquido
        </div>

        <strong class="money">
          ${value(total)}
        </strong>

      </div>

      <div class="card">

        <div class="small muted">
          ID consultado
        </div>

        <strong>
          ${esc(
            isCoordinator()
              ? "Todos"
              : currentId()
          )}
        </strong>

      </div>

    </div>

    <div
      class="card table-card"
      style="margin-top:16px"
    >

      ${table(
        [
          "Tipo",
          "Categoria",
          "Subcategoria",
          "Subtotal"
        ],
        rows
      )}

    </div>
  `);
}

/* =========================================================
   PARÂMETROS FINANCEIROS
   ========================================================= */

async function renderFinanceParams() {

  const docs =
    await scopedDocs(
      "categorias",
      [],
      "nome"
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          ⚙️ Parâmetros Financeiros
        </h3>

        <p>
          CRUD de categorias e
          subcategorias vinculadas.
        </p>

      </div>

      <button
        id="newCat"
        class="btn btn-primary"
      >
        ➕ Nova categoria
      </button>

    </div>

    <div class="card table-card">

      <div id="catTable">

        ${table(
          [
            "Categoria",
            "Tipo",
            "Subcategorias",
            "Ações"
          ],

          docs.map(
            d => {

              const x =
                d.data();

              return [
                esc(x.nome),

                esc(x.tipo),

                `
                  <div class="pill-list">

                    ${
                      (
                        x.subcategorias ||
                        []
                      )
                        .map(
                          s =>
                            `
                              <span class="pill">
                                ${esc(s)}
                              </span>
                            `
                        )
                        .join("")
                      ||
                      "—"
                    }

                  </div>
                `,

                rowActions(
                  "categorias",
                  d.id
                )
              ];
            }
          )
        )}

      </div>

    </div>
  `);

  $("newCat")
    .onclick =
      () =>
        categoryModal();
}

function categoryModal(
  id = "",
  data = {}
) {

  modal({

    title:
      id
        ? "Editar categoria"
        : "Nova categoria",

    body: `
      <form id="catForm">

        ${formLayout(

          `
            ${field(
              "Nome",
              "nome",
              "text",
              `
                required
                value="${esc(
                  data.nome || ""
                )}"
              `
            )}

            ${selectField(
              "Tipo",
              "tipo",
              [
                "Receita",
                "Despesa",
                "Cartão"
              ],
              `value="${esc(
                data.tipo ||
                "Despesa"
              )}"`
            )}

            <div
              class="field span-2"
            >

              <label>
                Subcategorias
                (separe por vírgula)
              </label>

              <input
                name="subcategorias"
                value="${esc(
                  (
                    data.subcategorias ||
                    []
                  ).join(", ")
                )}"
              >

            </div>
          `,

          `
            <button
              class="btn btn-primary"
            >
              💾 Salvar
            </button>
          `
        )}

      </form>
    `
  });

  $("catForm")
    .onsubmit =
      async e => {

        e.preventDefault();

        const f =
          new FormData(
            e.target
          );

        const d = {
          nome:
            f.get("nome"),

          tipo:
            f.get("tipo"),

          subcategorias:
            f
              .get(
                "subcategorias"
              )
              .split(",")
              .map(
                x =>
                  x.trim()
              )
              .filter(Boolean),

          id:
            currentId()
        };

        if (id) {

          await updateRecord(
            "categorias",
            id,
            d,
            "Alteração de categoria"
          );

        } else {

          await addRecord(
            "categorias",
            d,
            "Cadastro de categoria"
          );
        }

        closeModal();

        notify(
          "Categoria salva."
        );

        renderFinanceParams();
      };
}

/* =========================================================
   ACESSOS
   ========================================================= */

async function renderAccess() {

  const profiles = [
    "Coordenador-Geral de Sistemas",
    "Administrador",
    "Financeiro",
    "Operacional",
    "Usuário"
  ];

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          🔑 Concessão de Acesso
        </h3>

        <p>
          Defina visualização e edição
          por perfil e página.
        </p>

      </div>

      <button
        id="saveAccess"
        class="btn btn-primary"
      >
        💾 Salvar matriz
      </button>

    </div>

    <div class="card access-grid">

      <table
        class="data-table"
        id="accessTable"
      ></table>

    </div>
  `);

  const existing =
    (
      await getDocs(
        collection(
          db,
          "permissoes"
        )
      )
    )
      .docs
      .reduce(
        (a, d) => {

          a[d.id] =
            d.data();

          return a;
        },
        {}
      );

  $("accessTable")
    .innerHTML = `

      <thead>

        <tr>

          <th>
            Página
          </th>

          ${
            profiles
              .map(
                p =>
                  `<th>${p}</th>`
              )
              .join("")
          }

        </tr>

      </thead>

      <tbody>

        ${
          Object.entries(
            routes
          )
            .map(
              ([route, r]) =>
                `
                  <tr>

                    <td>
                      ${r.icon}
                      ${r.title}
                    </td>

                    ${
                      profiles
                        .map(
                          p => {

                            const v =
                              existing[
                                `${p}__${route}`
                              ]
                                ?.editar !==
                              false;

                            return `
                              <td
                                class="permission-cell"
                              >

                                <label
                                  class="switch"
                                >

                                  <input
                                    type="checkbox"
                                    data-profile="${esc(p)}"
                                    data-route="${esc(route)}"
                                    ${
                                      v
                                        ? "checked"
                                        : ""
                                    }
                                  >

                                  <span
                                    class="slider"
                                  ></span>

                                </label>

                              </td>
                            `;
                          }
                        )
                        .join("")
                    }

                  </tr>
                `
            )
            .join("")
        }

      </tbody>
    `;

  $("saveAccess")
    .onclick =
      async () => {

        const batch =
          writeBatch(db);

        document
          .querySelectorAll(
            "#accessTable input"
          )
          .forEach(
            i => {

              const ref =
                doc(
                  db,
                  "permissoes",
                  `${i.dataset.profile}__${i.dataset.route}`
                );

              batch.set(
                ref,
                {
                  perfil:
                    i.dataset.profile,

                  rota:
                    i.dataset.route,

                  editar:
                    i.checked,

                  visualizar:
                    i.checked,

                  id:
                    currentId(),

                  atualizadoEm:
                    serverTimestamp()
                }
              );
            }
          );

        await batch.commit();

        await audit(
          "UPDATE",
          "permissoes",
          "",
          "Alteração da matriz de acessos"
        );

        notify(
          "Matriz de acesso salva."
        );
      };
}

/* =========================================================
   USUÁRIOS
   ========================================================= */

async function renderUsers() {

  const docs =
    await scopedDocs(
      "usuarios",
      [],
      "nome"
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          👥 Gestão de Usuários
        </h3>

        <p>
          Cadastro e manutenção dos
          usuários vinculados ao ERP.
        </p>

      </div>

      <button
        id="newUser"
        class="btn btn-primary"
      >
        ➕ Novo usuário
      </button>

    </div>

    <div
      class="card table-card"
    >

      ${table(
        [
          "Nome",
          "E-mail",
          "Perfil",
          "ID",
          "Status",
          "Ações"
        ],

        docs.map(
          d => {

            const x =
              d.data();

            return [
              esc(x.nome),
              esc(x.email),
              esc(x.perfil),
              esc(x.id),

              `
                <span
                  class="badge ${
                    x.status ===
                    "Ativo"
                      ? "badge-green"
                      : "badge-red"
                  }"
                >
                  ${esc(
                    x.status ||
                    "Ativo"
                  )}
                </span>
              `,

              rowActions(
                "usuarios",
                d.id
              )
            ];
          }
        )
      )}

    </div>
  `);

  $("newUser")
    .onclick =
      () =>
        userModal();
}

function userModal(
  id = "",
  data = {}
) {

  const profiles = [
    "Coordenador-Geral de Sistemas",
    "Administrador",
    "Financeiro",
    "Operacional",
    "Usuário"
  ];

  modal({

    title:
      id
        ? "Editar usuário"
        : "Novo usuário",

    body: `

      <form id="userForm">

        ${formLayout(

          `
            ${field(
              "Nome",
              "nome",
              "text",
              `
                required
                value="${esc(
                  data.nome || ""
                )}"
              `
            )}

            ${field(
              "E-mail",
              "email",
              "email",
              `
                required
                value="${esc(
                  data.email || ""
                )}"
              `
            )}

            ${selectField(
              "Perfil",
              "perfil",
              profiles,
              "required"
            )}

            ${field(
              "ID vinculado",
              "id",
              "text",
              `
                required
                value="${esc(
                  data.id ||
                  currentId()
                )}"
              `
            )}

            ${selectField(
              "Status",
              "status",
              [
                "Ativo",
                "Inativo"
              ],
              "required"
            )}
          `,

          `
            <button
              class="btn btn-primary"
            >
              💾 Salvar
            </button>
          `
        )}

      </form>

      <p class="responsive-note">
        A criação da conta/senha deve
        ser feita no Firebase Authentication
        ou por fluxo administrativo seguro;
        esta tela mantém os dados do cadastro
        no Firestore.
      </p>
    `
  });

  $("userForm")
    .onsubmit =
      async e => {

        e.preventDefault();

        const d =
          Object.fromEntries(
            new FormData(
              e.target
            ).entries()
          );

        if (id) {

          await updateRecord(
            "usuarios",
            id,
            d,
            "Alteração de usuário"
          );

        } else {

          await addRecord(
            "usuarios",
            d,
            "Cadastro de usuário"
          );
        }

        closeModal();

        notify(
          "Usuário salvo."
        );

        renderUsers();
      };
}

/* =========================================================
   LOGS
   ========================================================= */

async function renderLogs() {

  const docs =
    isCoordinator()

      ? await getDocs(
          query(
            collection(
              db,
              "logs_sistema"
            ),
            orderBy(
              "timestamp",
              "desc"
            ),
            limit(300)
          )
        )

      : await scopedDocs(
          "logs_sistema",
          [],
          "timestamp"
        );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          📜 Logs de Auditoria
        </h3>

        <p>
          Trilha cronológica das
          operações registradas.
        </p>

      </div>

    </div>

    <div
      class="card table-card"
    >

      ${table(
        [
          "Data/Hora",
          "Usuário",
          "Perfil",
          "Ação",
          "Coleção",
          "Documento",
          "ID",
          "Descrição"
        ],

        docs.docs
          ? docs.docs.map(
              d => logRow(d)
            )
          : docs.map(
              d => logRow(d)
            )
      )}

    </div>
  `);
}

function logRow(d) {

  const x =
    d.data();

  return [
    dateTimeBR(
      x.timestamp
    ),

    esc(
      x.usuario
    ),

    esc(
      x.perfil
    ),

    `
      <span
        class="badge badge-purple"
      >
        ${esc(x.acao)}
      </span>
    `,

    esc(
      x.colecao
    ),

    esc(
      x.documentoId ||
      "—"
    ),

    esc(
      x.id ||
      "—"
    ),

    esc(
      x.descricao ||
      ""
    )
  ];
}

/* =========================================================
   GESTÃO DE IDs
   ========================================================= */

async function renderIds() {

  const docs =
    await getDocs(
      collection(
        db,
        "ids"
      )
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          🆔 Gestão de IDs
        </h3>

        <p>
          Cadastro das unidades
          organizacionais do sistema.
        </p>

      </div>

      <button
        id="newId"
        class="btn btn-primary"
      >
        ➕ Novo ID
      </button>

    </div>

    <div
      class="card table-card"
    >

      ${table(
        [
          "ID",
          "Nome",
          "Status",
          "Ações"
        ],

        docs.docs.map(
          d => {

            const x =
              d.data();

            return [
              esc(
                x.codigo ||
                d.id
              ),

              esc(
                x.nome
              ),

              `
                <span
                  class="badge ${
                    x.ativo !== false
                      ? "badge-green"
                      : "badge-red"
                  }"
                >
                  ${
                    x.ativo !== false
                      ? "Ativo"
                      : "Inativo"
                  }
                </span>
              `,

              rowActions(
                "ids",
                d.id
              )
            ];
          }
        )
      )}

    </div>
  `);

  $("newId")
    .onclick =
      () =>
        idModal();
}

function idModal(
  id = "",
  data = {}
) {

  modal({

    title:
      id
        ? "Editar ID"
        : "Novo ID",

    body: `

      <form id="idForm">

        ${formLayout(

          `
            ${field(
              "Código do ID",
              "codigo",
              "text",
              `
                required
                value="${esc(
                  data.codigo ||
                  ""
                )}"
              `
            )}

            ${field(
              "Nome da unidade",
              "nome",
              "text",
              `
                required
                value="${esc(
                  data.nome ||
                  ""
                )}"
              `
            )}

            ${selectField(
              "Status",
              "status",
              [
                "Ativo",
                "Inativo"
              ],
              "required"
            )}
          `,

          `
            <button
              class="btn btn-primary"
            >
              💾 Salvar
            </button>
          `
        )}

      </form>
    `
  });

  $("idForm")
    .onsubmit =
      async e => {

        e.preventDefault();

        const f =
          Object.fromEntries(
            new FormData(
              e.target
            ).entries()
          );

        f.ativo =
          f.status ===
          "Ativo";

        delete f.status;

        if (id) {

          await updateRecord(
            "ids",
            id,
            f,
            "Alteração de ID"
          );

        } else {

          await addRecord(
            "ids",
            f,
            "Cadastro de ID"
          );
        }

        closeModal();

        notify(
          "ID salvo."
        );

        renderIds();
      };
}

/* =========================================================
   AVISOS / BANNERS
   ========================================================= */

async function renderNotices() {

  const docs =
    await getDocs(
      collection(
        db,
        "avisos"
      )
    );

  setContent(`

    <div class="page-header">

      <div>

        <h3>
          📢 Gestão de Avisos / Banners
        </h3>

        <p>
          Mensagens exibidas na dashboard.
        </p>

      </div>

      <button
        id="newNotice"
        class="btn btn-primary"
      >
        ➕ Novo aviso
      </button>

    </div>

    <div class="grid grid-2">

      ${
        docs.docs
          .map(
            d => {

              const x =
                d.data();

              return `

                <div class="notice-banner">

                  <div
                    class="page-header"
                    style="margin:0 0 8px"
                  >

                    <strong>
                      ${esc(
                        x.titulo
                      )}
                    </strong>

                    ${rowActions(
                      "avisos",
                      d.id
                    )}

                  </div>

                  <p>
                    ${esc(
                      x.mensagem
                    )}
                  </p>

                  <small>
                    ${
                      x.ativo === false
                        ? "Inativo"
                        : "Ativo"
                    }
                  </small>

                </div>
              `;
            }
          )
          .join("")
        ||
        `
          <div class="empty">
            Nenhum aviso cadastrado.
          </div>
        `
      }

    </div>
  `);

  $("newNotice")
    .onclick =
      () =>
        noticeModal();
}

function noticeModal(
  id = "",
  data = {}
) {

  modal({

    title:
      id
        ? "Editar aviso"
        : "Novo aviso",

    body: `

      <form id="noticeForm">

        ${formLayout(

          `
            ${field(
              "Título",
              "titulo",
              "text",
              `
                required
                value="${esc(
                  data.titulo ||
                  ""
                )}"
              `
            )}

            ${field(
              "Expira em",
              "expiraEm",
              "date",
              `
                value="${esc(
                  data.expiraEm ||
                  ""
                )}"
              `
            )}

            <div
              class="field span-2"
            >

              <label>
                Mensagem
              </label>

              <textarea
                name="mensagem"
                required
              >${esc(
                data.mensagem ||
                ""
              )}</textarea>

            </div>

            ${selectField(
              "Status",
              "ativo",
              [
                "true",
                "false"
              ],
              `
                value="${
                  data.ativo === false
                    ? "false"
                    : "true"
                }"
              `
            )}
          `,

          `
            <button
              class="btn btn-primary"
            >
              💾 Salvar
            </button>
          `
        )}

      </form>
    `
  });

  $("noticeForm")
    .onsubmit =
      async e => {

        e.preventDefault();

        const d =
          Object.fromEntries(
            new FormData(
              e.target
            ).entries()
          );

        d.ativo =
          d.ativo ===
          "true";

        d.id =
          "GLOBAL";

        if (id) {

          await updateRecord(
            "avisos",
            id,
            d,
            "Alteração de aviso"
          );

        } else {

          await addRecord(
            "avisos",
            d,
            "Cadastro de aviso"
          );
        }

        closeModal();

        notify(
          "Aviso salvo."
        );

        renderNotices();
      };
}

/* =========================================================
   EVENTOS GLOBAIS
   ========================================================= */

$("globalEyeBtn")
  .onclick =
    () => {

      state.eye =
        !state.eye;

      $("globalEyeBtn")
        .textContent =
          state.eye
            ? "🙈"
            : "👁️";

      renderPage(
        state.currentRoute
      );
    };

$("closeSidebar")
  .onclick =
    () => {

      $("sidebar")
        .classList
        .add("collapsed");

      $("openSidebar")
        .classList
        .remove("hidden");
    };

$("openSidebar")
  .onclick =
    () => {

      $("sidebar")
        .classList
        .remove("collapsed");

      $("openSidebar")
        .classList
        .add("hidden");
    };

$("mobileMenuBtn")
  .onclick =
    () =>
      $("sidebar")
        .classList
        .toggle(
          "mobile-open"
        );

$("logoutBtn")
  .onclick =
    async () => {

      await audit(
        "LOGOUT",
        "auth",
        uid(),
        "Logout"
      );

      await signOut(
        auth
      );
    };

/* =========================================================
   LOGIN
   ========================================================= */

$("loginForm")
  .onsubmit =
    async e => {

      e.preventDefault();

      $("loginError")
        .classList
        .add("hidden");

      try {

        await signInWithEmailAndPassword(
          auth,
          $("loginEmail").value,
          $("loginPassword").value
        );

      } catch (err) {

        $("loginError")
          .textContent =
            "Não foi possível entrar. Verifique e-mail e senha.";

        $("loginError")
          .classList
          .remove("hidden");
      }
    };

/* =========================================================
   CARREGAMENTO DO PERFIL
   ========================================================= */

async function loadProfile(
  user
) {

  const q =
    query(
      collection(
        db,
        "usuarios"
      ),
      where(
        "email",
        "==",
        user.email
      ),
      limit(1)
    );

  const docs =
    (
      await getDocs(q)
    ).docs;

  if (!docs.length) {

    throw new Error(
      "Usuário autenticado não possui cadastro na coleção usuarios."
    );
  }

  const p =
    docs[0].data();

  if (
    p.status ===
    "Inativo"
  ) {

    throw new Error(
      "Usuário inativo."
    );
  }

  state.profile = {
    ...p,
    firestoreId:
      docs[0].id
  };

  $("sidebarUserName")
    .textContent =
      profileName();

  $("sidebarUserRole")
    .textContent =
      p.perfil ||
      "Sem perfil";

  $("sidebarUserId")
    .textContent =
      isCoordinator()
        ? "Acesso global"
        : `ID ${
            p.id ||
            "—"
          }`;

  $("userAvatar")
    .textContent =
      (
        profileName()[0] ||
        "U"
      ).toUpperCase();
}

/* =========================================================
   ESTADO DE AUTENTICAÇÃO
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    try {

      if (user) {

        state.user =
          user;

        await loadProfile(
          user
        );

        $("loadingScreen")
          .classList
          .add("hidden");

        $("loginScreen")
          .classList
          .add("hidden");

        $("appShell")
          .classList
          .remove("hidden");

        state.initialized =
          true;

        await audit(
          "LOGIN",
          "auth",
          user.uid,
          "Login realizado"
        );

        await navigate(
          "dashboard"
        );

      } else {

        state.user =
          null;

        state.profile =
          null;

        $("loadingScreen")
          .classList
          .add("hidden");

        $("appShell")
          .classList
          .add("hidden");

        $("loginScreen")
          .classList
          .remove("hidden");

        $("loginScreen")
          .classList
          .add("flex");
      }

    } catch (e) {

      console.error(e);

      await signOut(
        auth
      ).catch(
        () => {}
      );

      $("loadingScreen")
        .classList
        .add("hidden");

      $("appShell")
        .classList
        .add("hidden");

      $("loginScreen")
        .classList
        .remove("hidden");

      $("loginScreen")
        .classList
        .add("flex");

      $("loginError")
        .textContent =
          e.message;

      $("loginError")
        .classList
        .remove("hidden");
    }
  }
);