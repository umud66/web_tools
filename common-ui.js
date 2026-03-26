async function loadToolsConfig() {
  const response = await fetch("./tools.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load tools.json: ${response.status}`);
  }
  return await response.json();
}

function flattenTools(config) {
  return config.categories.flatMap((category) =>
    category.tools.map((tool) => ({
      ...tool,
      categoryId: category.id,
      categoryTitle: category.title
    }))
  );
}

function renderSiteNav(container, config, currentToolId = "") {
  const allTools = flattenTools(config);
  const currentTool = allTools.find((tool) => tool.id === currentToolId);

  const panelHtml = config.categories
    .map((category) => {
      const links = category.tools
        .map((tool) => {
          const activeClass = tool.id === currentToolId ? " is-active" : "";
          return `
            <a class="site-nav__link${activeClass}" href="${tool.href}">
              <span class="site-nav__link-title">${tool.title}</span>
              <span class="site-nav__link-desc">${tool.description || ""}</span>
            </a>
          `;
        })
        .join("");

      return `
        <section class="site-nav__group">
          <h3 class="site-nav__group-title">${category.title}</h3>
          <div class="site-nav__menu">${links}</div>
        </section>
      `;
    })
    .join("");

  const currentBadge = currentTool
    ? `<span class="site-nav__current">${currentTool.title}</span>`
    : "";

  container.innerHTML = `
    <div class="site-nav__bar">
      <div class="site-nav__brand">
        <div class="site-nav__mark"></div>
        <div>
          <h2>${config.site.title}</h2>
          <span>${config.site.subtitle}</span>
        </div>
      </div>
      <div class="site-nav__controls">
        ${currentBadge}
        <a class="site-nav__home" href="${config.site.home}">首页</a>
        <div class="site-nav__chip" data-nav-chip>
          <button class="site-nav__chip-button" type="button" aria-expanded="false">工具导航</button>
          <div class="site-nav__panel">
            <div class="site-nav__panel-grid">
              ${panelHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const chip = container.querySelector("[data-nav-chip]");
  const button = chip?.querySelector(".site-nav__chip-button");
  if (!chip || !button) {
    return;
  }

  let suppressHoverUntilLeave = false;

  const closeChip = () => {
    chip.classList.remove("is-open");
    chip.classList.remove("is-hover");
    button.setAttribute("aria-expanded", "false");
  };

  const openChip = () => {
    chip.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (chip.classList.contains("is-open")) {
      suppressHoverUntilLeave = true;
      closeChip();
    } else {
      suppressHoverUntilLeave = false;
      openChip();
    }
  });

  chip.addEventListener("mouseenter", () => {
    if (!suppressHoverUntilLeave && !chip.classList.contains("is-open")) {
      chip.classList.add("is-hover");
      button.setAttribute("aria-expanded", "true");
    }
  });

  chip.addEventListener("mouseleave", () => {
    suppressHoverUntilLeave = false;
    if (chip.classList.contains("is-hover")) {
      closeChip();
    }
  });

  document.addEventListener("click", (event) => {
    if (!chip.contains(event.target)) {
      suppressHoverUntilLeave = false;
      closeChip();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeChip();
    }
  });
}

async function initSiteNav() {
  const navContainer = document.querySelector("[data-site-nav]");
  if (!navContainer) {
    return null;
  }

  try {
    const config = await loadToolsConfig();
    renderSiteNav(navContainer, config, document.body.dataset.toolId || "");
    return config;
  } catch (error) {
    console.error(error);
    navContainer.innerHTML = '<div class="site-nav__error">导航配置加载失败。若你是直接双击打开本地 HTML，请改用本地 HTTP 服务访问。</div>';
    return null;
  }
}

window.ToolSite = {
  flattenTools,
  initSiteNav,
  loadToolsConfig
};
