(function () {

    if (window.__AVIA_OFFICIAL_REPO_LOADED__) return;
    window.__AVIA_OFFICIAL_REPO_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";
    const BACKEND_FILE = "pluginrepobackend.js";

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

        if (!data || !data.plugins) {
            repoContent.innerHTML = "Invalid repo data.";
            return;
        }

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
            desc.textContent = repoPlugin.description || "";
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

    function loadBackendFromString(content) {
        try {
            return JSON.parse(content);
        } catch {
            try {
                const cleaned = content
                    .replace(/module\.exports\s*=\s*/, "")
                    .replace(/export\s+default\s*/, "")
                    .trim();
                return eval("(" + cleaned + ")");
            } catch {
                return null;
            }
        }
    }

    function refetchRepo() {
        if (!repoContent) return;

        repoContent.innerHTML = "Loading...";

        try {
            if (typeof require !== "undefined") {
                const path = require("path");
                const fs = require("fs");
                const filePath = path.join(__dirname, BACKEND_FILE);
                const content = fs.readFileSync(filePath, "utf8");
                const data = loadBackendFromString(content);
                if (!data) {
                    repoContent.innerHTML = "Invalid repo JSON.";
                    return;
                }
                renderRepo(data);
            } else {
                fetch("./" + BACKEND_FILE + "?t=" + Date.now(), { cache: "no-store" })
                    .then(res => res.text())
                    .then(text => {
                        const data = loadBackendFromString(text);
                        if (!data) {
                            repoContent.innerHTML = "Invalid repo JSON.";
                            return;
                        }
                        renderRepo(data);
                    })
                    .catch(() => repoContent.innerHTML = "Failed to load repo.");
            }
        } catch {
            repoContent.innerHTML = "Failed to load repo.";
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
        panel.style.background = "#1e1e1e";
        panel.style.color = "#fff";
        panel.style.borderRadius = "16px";
        panel.style.boxShadow = "0 8px 28px rgba(0,0,0,0.35)";
        panel.style.zIndex = "1000000";
        panel.style.display = "flex";
        panel.style.flexDirection = "column";
        panel.style.overflow = "hidden";

        const header = document.createElement("div");
        header.textContent = "Official Repo";
        header.style.padding = "14px 16px";
        header.style.fontWeight = "600";
        header.style.cursor = "move";

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "12px";
        closeBtn.style.right = "16px";
        closeBtn.style.cursor = "pointer";
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

})();" and im installing these plugins with this plugin manager

"(function () {

    if (window.__AVIA_PLUGINS_LOADED__) return;
    window.__AVIA_PLUGINS_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";

    const runningPlugins = {};
    const pluginErrors = {};
    const injectionQueue = [];

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    async function processQueue() {
        if (processQueue.running) return;
        processQueue.running = true;

        while (injectionQueue.length) {
            const { plugin, force } = injectionQueue.shift();
            await loadPluginInternal(plugin, force);
        }

        processQueue.running = false;
    }

    function queuePlugin(plugin, force = false) {
        injectionQueue.push({ plugin, force });
        processQueue();
    }

    async function loadPluginInternal(plugin, force = false) {
        if (runningPlugins[plugin.url] && !force) return;
        if (force) stopPlugin(plugin);

        try {
            const res = await fetch(plugin.url);
            if (!res.ok) throw new Error("Fetch failed");
            const code = await res.text();

            delete pluginErrors[plugin.url];

            const script = document.createElement("script");
            script.textContent = code;
            script.dataset.pluginUrl = plugin.url;
            document.body.appendChild(script);

            runningPlugins[plugin.url] = script;

        } catch {
            pluginErrors[plugin.url] = true;
        }

        renderPanel();
    }

    function stopPlugin(plugin) {
        const script = runningPlugins[plugin.url];
        if (!script) return;
        script.remove();
        delete runningPlugins[plugin.url];
        delete pluginErrors[plugin.url];
        renderPanel();
    }

    function togglePluginsPanel() {
        let panel = document.getElementById('avia-plugins-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-plugins-panel';
        panel.style.position = 'fixed';
        panel.style.bottom = '24px';
        panel.style.right = '24px';
        panel.style.width = '520px';
        panel.style.height = '460px';
        panel.style.background = 'var(--md-sys-color-surface, #1e1e1e)';
        panel.style.color = 'var(--md-sys-color-on-surface, #fff)';
        panel.style.borderRadius = '16px';
        panel.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)';
        panel.style.zIndex = '999999';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.overflow = 'hidden';
        panel.style.border = '1px solid rgba(255,255,255,0.08)';
        panel.style.backdropFilter = 'blur(12px)';

        const header = document.createElement('div');
        header.textContent = 'Plugins';
        header.style.padding = '14px 16px';
        header.style.fontWeight = '600';
        header.style.fontSize = '14px';
        header.style.background = 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
        header.style.cursor = 'move';

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '16px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => panel.style.display = 'none';

        const controlsBar = document.createElement('div');
        controlsBar.style.padding = '12px 16px';
        controlsBar.style.display = 'flex';
        controlsBar.style.gap = '8px';
        controlsBar.style.alignItems = 'center';
        controlsBar.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
        controlsBar.style.flex = '0 0 auto';

        const content = document.createElement('div');
        content.id = 'avia-plugins-content';
        content.style.flex = '1';
        content.style.overflow = 'auto';
        content.style.padding = '16px';

        const nameInput = document.createElement('input');
        nameInput.placeholder = 'Name';
        styleInput(nameInput);
        nameInput.style.width = '110px';

        const urlInput = document.createElement('input');
        urlInput.placeholder = 'Plugin URL';
        styleInput(urlInput);
        urlInput.style.flex = '1';

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add';
        addBtn.onclick = () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            if (!name || !url) return;
            const plugins = getPlugins();
            plugins.push({ name, url, enabled: false });
            setPlugins(plugins);
            nameInput.value = '';
            urlInput.value = '';
            renderPanel();
        };

        const refreshAll = document.createElement('button');
        refreshAll.textContent = 'Refresh';
        refreshAll.onclick = () => {
            const plugins = getPlugins();
            plugins.forEach(p => {
                if (p.enabled) queuePlugin(p, true);
            });
        };

        controlsBar.appendChild(nameInput);
        controlsBar.appendChild(urlInput);
        controlsBar.appendChild(addBtn);
        controlsBar.appendChild(refreshAll);

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(controlsBar);
        panel.appendChild(content);
        document.body.appendChild(panel);

        enableDrag(panel, header);
        renderPanel();
    }

    function renderPanel() {
        const content = document.getElementById('avia-plugins-content');
        if (!content) return;

        content.innerHTML = '';

        const plugins = getPlugins();
        const runningSnapshot = { ...runningPlugins };
        const errorSnapshot = { ...pluginErrors };

        plugins.forEach((plugin, index) => {

            const isRunning = !!runningSnapshot[plugin.url];
            const hasError = !!errorSnapshot[plugin.url];

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.marginBottom = '12px';

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.style.gap = '10px';

            const statusDot = document.createElement('div');
            statusDot.style.width = '10px';
            statusDot.style.height = '10px';
            statusDot.style.borderRadius = '50%';

            if (hasError) {
                statusDot.style.background = '#ff4d4d';
                statusDot.style.boxShadow = '0 0 6px #ff4d4d';
            } else if (isRunning) {
                statusDot.style.background = '#4dff88';
                statusDot.style.boxShadow = '0 0 6px #4dff88';
            } else {
                statusDot.style.background = '#777';
            }

            const name = document.createElement('div');
            name.textContent = plugin.name;

            left.appendChild(statusDot);
            left.appendChild(name);

            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.gap = '6px';

            const toggle = document.createElement('button');
            toggle.textContent = plugin.enabled ? 'Disable' : 'Enable';
            toggle.onclick = () => {
                plugin.enabled = !plugin.enabled;
                setPlugins(plugins);
                if (plugin.enabled) queuePlugin(plugin);
                else stopPlugin(plugin);
                renderPanel();
            };

            const remove = document.createElement('button');
            remove.textContent = '✕';
            remove.onclick = () => {
                stopPlugin(plugin);
                plugins.splice(index, 1);
                setPlugins(plugins);
                renderPanel();
            };

            controls.appendChild(toggle);
            controls.appendChild(remove);

            row.appendChild(left);
            row.appendChild(controls);
            content.appendChild(row);
        });
    }

    function styleInput(input) {
        input.style.padding = '6px 8px';
        input.style.borderRadius = '8px';
        input.style.border = '1px solid rgba(255,255,255,0.1)';
        input.style.background = 'rgba(255,255,255,0.05)';
        input.style.color = '#fff';
    }

    function enableDrag(panel, header) {
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
    }

    function injectButtons() {
        const appearanceBtn = Array.from(document.querySelectorAll('a'))
            .find(a => a.textContent.trim() === 'Appearance');
        if (!appearanceBtn) return;
        if (document.getElementById('stoat-fake-plugins')) return;

        const pluginsBtn = appearanceBtn.cloneNode(true);
        pluginsBtn.id = 'stoat-fake-plugins';

        const textNode = Array.from(pluginsBtn.querySelectorAll('div'))
            .find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
        if (textNode) textNode.textContent = "(Avia) Plugins";

        if (typeof setIcon === "function") setIcon(pluginsBtn, "extension");

        pluginsBtn.addEventListener('click', togglePluginsPanel);

        const lastBtn =
            document.getElementById('stoat-fake-quickcss') ||
            document.getElementById('stoat-fake-removefont') ||
            document.getElementById('stoat-fake-loadfont') ||
            document.getElementById('stoat-fake-stoatserver') ||
            document.getElementById('stoat-fake-linktree');

        if (lastBtn) {
            lastBtn.parentElement.insertBefore(pluginsBtn, lastBtn.nextSibling);
        } else {
            appearanceBtn.parentElement.insertBefore(pluginsBtn, appearanceBtn.nextSibling);
        }
    }

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) {
                obs.disconnect();
                callback();
            }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        injectButtons();
    });

    getPlugins().forEach(plugin => {
        if (plugin.enabled) queuePlugin(plugin);
    });

})();
