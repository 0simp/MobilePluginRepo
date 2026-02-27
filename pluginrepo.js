(function () {

    if (window.__AVIA_OFFICIAL_REPO_LOADED__) return;
    window.__AVIA_OFFICIAL_REPO_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";
    const OFFICIAL_REPO_URL = "https://raw.githubusercontent.com/AvaLilac/PluginRepo/refs/heads/main/pluginrepobackend";

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    let repoContent;

    function triggerManagerRefresh() {
        const panel = document.getElementById("avia-plugins-panel");
        if (!panel) return;
        const refreshBtn = Array.from(panel.querySelectorAll("button"))
            .find(b => b.textContent.trim() === "Refresh");
        if (refreshBtn) refreshBtn.click();
    }

    function injectButton() {
        const panel = document.getElementById("avia-plugins-panel");
        if (!panel) return;
        if (document.getElementById("avia-official-repo-btn")) return;

        const btn = document.createElement("button");
        btn.id = "avia-official-repo-btn";
        btn.textContent = "Official Repo";
        btn.style.position = "absolute";
        btn.style.left = "16px";
        btn.style.bottom = "16px";
        btn.onclick = openWindow;

        panel.appendChild(btn);
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

    function renderRepo(data) {
        repoContent.innerHTML = "";

        data.plugins.forEach(repoPlugin => {

            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.style.marginBottom = "12px";
            row.setAttribute("data-link", repoPlugin.link);

            const left = document.createElement("div");
            left.style.display = "flex";
            left.style.flexDirection = "column";

            const title = document.createElement("div");
            title.textContent = `${repoPlugin.name} — by ${repoPlugin.author || "Unknown"}`;
            title.style.fontWeight = "500";

            const desc = document.createElement("div");
            desc.textContent = repoPlugin.description;
            desc.style.fontSize = "12px";
            desc.style.opacity = "0.7";

            left.appendChild(title);
            left.appendChild(desc);

            const installBtn = document.createElement("button");
            installBtn.className = "install-btn";

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
                    updateInstallStates();
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

        if (document.getElementById("avia-official-repo-window")) return;

        const panel = document.createElement("div");
        panel.id = "avia-official-repo-window";
        panel.style.position = "fixed";
        panel.style.bottom = "24px";
        panel.style.right = "24px";
        panel.style.width = "520px";
        panel.style.height = "460px";
        panel.style.background = "var(--md-sys-color-surface, #1e1e1e)";
        panel.style.color = "var(--md-sys-color-on-surface, #fff)";
        panel.style.borderRadius = "16px";
        panel.style.boxShadow = "0 8px 28px rgba(0,0,0,0.35)";
        panel.style.zIndex = "1000000";
        panel.style.display = "flex";
        panel.style.flexDirection = "column";
        panel.style.overflow = "hidden";
        panel.style.border = "1px solid rgba(255,255,255,0.08)";
        panel.style.backdropFilter = "blur(12px)";

        const header = document.createElement("div");
        header.textContent = "Official Repo";
        header.style.padding = "14px 16px";
        header.style.fontWeight = "600";
        header.style.fontSize = "14px";
        header.style.background = "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))";
        header.style.borderBottom = "1px solid rgba(255,255,255,0.08)";
        header.style.cursor = "move";

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "12px";
        closeBtn.style.right = "16px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.opacity = "0.7";
        closeBtn.onclick = () => panel.remove();

        repoContent = document.createElement("div");
        repoContent.style.flex = "1";
        repoContent.style.overflow = "auto";
        repoContent.style.padding = "16px";
        repoContent.style.paddingBottom = "70px";

        const footer = document.createElement("div");
        footer.style.position = "absolute";
        footer.style.left = "0";
        footer.style.right = "0";
        footer.style.bottom = "0";
        footer.style.height = "60px";
        footer.style.display = "flex";
        footer.style.alignItems = "center";
        footer.style.paddingLeft = "16px";
        footer.style.background = "linear-gradient(to top, rgba(0,0,0,0.6), transparent)";

        const refetchBtn = document.createElement("button");
        refetchBtn.textContent = "Refetch";
        refetchBtn.onclick = () => {
            refetchRepo();
            updateInstallStates();
        };

        footer.appendChild(refetchBtn);

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(repoContent);
        panel.appendChild(footer);
        document.body.appendChild(panel);

        enableDrag(panel, header);

        refetchRepo();
    }

    function enableDrag(panel, header) {
        let isDragging = false, offsetX, offsetY;
        header.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });
        document.addEventListener("mouseup", () => isDragging = false);
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });
    }

    window.addEventListener("avia-plugin-list-changed", () => {
        if (document.getElementById("avia-official-repo-window")) {
            updateInstallStates();
        }
    });

    const observer = new MutationObserver(() => injectButton());
    observer.observe(document.body, { childList: true, subtree: true });

})();
