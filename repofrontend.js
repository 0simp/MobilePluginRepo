(function () {

if (window.__AVIA_OFFICIAL_REPO_LOADED__) return;
window.__AVIA_OFFICIAL_REPO_LOADED__ = true;

const STORAGE_KEY = "avia_plugins";
const OFFICIAL_REPO_URL = "https://avalilac.github.io/PluginRepo/pluginrepobackend.js";

const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

let repoContent;
let currentRepoData = [];
let searchInput;

document.getElementById("avia-official-repo-btn")?.remove();

function triggerManagerRefresh() {
    const panel = document.getElementById("avia-plugins-panel");
    if (!panel) return;
    const refreshBtn = Array.from(panel.querySelectorAll("button"))
        .find(b => b.textContent.trim() === "Refresh");
    if (refreshBtn) refreshBtn.click();
}

function updateInstallStates() {
    if (!repoContent) return;
    const installed = getPlugins().map(p => p.url);
    repoContent.querySelectorAll("[data-link]").forEach(row => {
        const link = row.getAttribute("data-link");
        const btn = row.querySelector("button.install-btn");
        if (!btn) return;
        if (installed.includes(link)) {
            btn.textContent = "Installed";
            btn.disabled = true;
        } else {
            btn.textContent = "Install";
            btn.disabled = false;
        }
    });
}

function renderRepo(data, filter = "") {
    if (!repoContent) return;

    currentRepoData = data.plugins;
    repoContent.innerHTML = "";

    const filtered = currentRepoData.filter(p =>
        (p.name + " " + (p.author || "") + " " + (p.description || ""))
            .toLowerCase()
            .includes(filter.toLowerCase())
    );

    filtered.forEach(repoPlugin => {

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.marginBottom = "10px";
        row.style.width = "100%";
        row.style.minWidth = "0";
        row.setAttribute("data-link", repoPlugin.link);

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.flexDirection = "column";
        left.style.flex = "1";
        left.style.minWidth = "0";

        const title = document.createElement("div");
        title.textContent = `${repoPlugin.name} — ${repoPlugin.author || "Unknown"}`;
        title.style.fontWeight = "500";
        title.style.wordBreak = "break-word";

        const desc = document.createElement("div");
        desc.textContent = repoPlugin.description;
        desc.style.fontSize = "12px";
        desc.style.opacity = "0.7";
        desc.style.wordBreak = "break-word";

        left.appendChild(title);
        left.appendChild(desc);

        const installBtn = document.createElement("button");
        installBtn.className = "install-btn";

        Object.assign(installBtn.style, {
            padding: "6px 10px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            flexShrink: "0"
        });

        installBtn.onclick = () => {
            const plugins = getPlugins();
            if (!plugins.some(p => p.url === repoPlugin.link)) {
                plugins.push({
                    name: repoPlugin.name,
                    url: repoPlugin.link,
                    enabled: false
                });
                setPlugins(plugins);
                window.dispatchEvent(new Event("avia-plugin-list-changed"));
                triggerManagerRefresh();
                renderRepo({ plugins: currentRepoData }, searchInput.value);
            }
        };

        row.appendChild(left);
        row.appendChild(installBtn);
        repoContent.appendChild(row);
    });

    updateInstallStates();
}

function refetchRepo() {
    if (!repoContent) return;
    repoContent.innerHTML = "Loading...";

    function electronFetch() {
        try {
            const https = require("https");
            https.get(OFFICIAL_REPO_URL, res => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => {
                    renderRepo(JSON.parse(data));
                });
            }).on("error", () => {
                repoContent.innerHTML = "Failed to fetch repo.";
            });
        } catch {
            repoContent.innerHTML = "Failed to fetch repo.";
        }
    }

    try {
        fetch(OFFICIAL_REPO_URL)
            .then(res => res.json())
            .then(data => renderRepo(data))
            .catch(() => electronFetch());
    } catch {
        electronFetch();
    }
}

function openWindow() {

    let panel = document.getElementById("avia-official-repo-window");

    if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        return;
    }

    panel = document.createElement("div");
    panel.id = "avia-official-repo-window";

    Object.assign(panel.style, {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        width: "420px",
        height: "500px",
        background: "#1e1e1e",
        color: "#fff",
        borderRadius: "20px",
        boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)"
    });

    const header = document.createElement("div");
    header.textContent = "Trusted Plugins Repo";

    Object.assign(header.style, {
        padding: "18px",
        fontWeight: "600",
        fontSize: "16px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        cursor: "move",
        position: "relative",
        textAlign: "center",
        userSelect: "none"
    });

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        panel.style.bottom = "auto";
        panel.style.right = "auto";
        panel.style.left = rect.left + "px";
        panel.style.top = rect.top + "px";
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        panel.style.left = e.clientX - offsetX + "px";
        panel.style.top = e.clientY - offsetY + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
    });

    const close = document.createElement("div");
    close.textContent = "✕";

    Object.assign(close.style, {
        position: "absolute",
        right: "18px",
        top: "16px",
        cursor: "pointer"
    });

    close.onclick = () => panel.style.display = "none";
    header.appendChild(close);

    const container = document.createElement("div");

    Object.assign(container.style, {
        flex: "1",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
    });

    searchInput = document.createElement("input");
    searchInput.placeholder = "Search plugins, authors, or descriptions";

    Object.assign(searchInput.style, {
        margin: "12px",
        padding: "8px",
        borderRadius: "8px",
        border: "none",
        outline: "none",
        background: "rgba(255,255,255,0.06)",
        color: "#fff"
    });

    repoContent = document.createElement("div");

    Object.assign(repoContent.style, {
        flex: "1",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px"
    });

    searchInput.addEventListener("input", () => {
        renderRepo({ plugins: currentRepoData }, searchInput.value);
    });

    container.appendChild(searchInput);
    container.appendChild(repoContent);

    panel.appendChild(header);
    panel.appendChild(container);
    document.body.appendChild(panel);

    refetchRepo();
}

function injectSettingsButton() {

    if (document.getElementById("avia-official-repo-btn-settings")) return;

    const appearanceBtn = [...document.querySelectorAll("a")]
        .find(a => a.textContent.trim() === "Appearance");

    const referenceNode = document.getElementById("stoat-fake-quickcss");

    if (!appearanceBtn || !referenceNode) return;

    const clone = appearanceBtn.cloneNode(true);
    clone.id = "avia-official-repo-btn-settings";

    const label = [...clone.querySelectorAll("div")]
        .find(d => d.children.length === 0);

    if (label) label.textContent = "(Avia) Trusted Plugins Repo";

    const iconSpan = clone.querySelector("span.material-symbols-outlined");
    if (iconSpan) {
        iconSpan.textContent = "extension";
        iconSpan.style.fontVariationSettings = "'FILL' 0,'wght' 400,'GRAD' 0";
    }

    clone.onclick = openWindow;

    referenceNode.parentElement.insertBefore(clone, referenceNode.nextSibling);
}

window.addEventListener("avia-plugin-list-changed", () => {
    if (document.getElementById("avia-official-repo-window")) {
        updateInstallStates();
    }
});

new MutationObserver(() => {
    injectSettingsButton();
}).observe(document.body, { childList: true, subtree: true });

injectSettingsButton();

})();
