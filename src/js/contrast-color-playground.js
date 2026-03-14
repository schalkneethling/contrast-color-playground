class ContrastColorPlayground extends HTMLElement {
  static #selectors = {
    // Live Color Picker
    colorPicker: "#color-picker",
    colorTextInput: "#color-text-input",
    pickerPreview: "#picker-preview",
    pickerColorValue: "#picker-color-value",
    pickerContrastResult: "#picker-contrast-result",

    // Palette Gallery
    paletteGrid: "#palette-grid",
    copyStatus: "#copy-status",

    // Tinting
    tintColorPicker: "#tint-color-picker",
    tintColorText: "#tint-color-text",
    tintSlider: "#tint-slider",
    tintValue: "#tint-value",
    tintPreviewPure: "#tint-preview-pure",
    tintPreviewMixed: "#tint-preview-mixed",
    tintCodeOutput: "#tint-code-output",

    // Style Queries
    styleQueryPicker: "#style-query-picker",
    styleQueryText: "#style-query-text",
    styleQueryContainer: "#style-query-container",

    // Card Builder
    cardBgPicker: "#card-bg-picker",
    cardBgText: "#card-bg-text",
    cardPreview: "#card-preview",
    cardCodeOutput: "#card-code-output",

    // Feature Detection
    detectionResult: "#detection-result",
    detectionIcon: "#detection-icon",
    detectionMessage: "#detection-message",

    // Unsupported Notice
    unsupportedNotice: "#unsupported-notice",
  };

  static #presetColors = [
    // Light colors
    { name: "White", value: "white", format: "named" },
    { name: "Lightyellow", value: "lightyellow", format: "named" },
    { name: "Lavender", value: "lavender", format: "named" },
    { name: "Mintcream", value: "mintcream", format: "named" },
    { name: "Nearly White", value: "#f0f0f0", format: "hex" },
    { name: "Cornsilk", value: "cornsilk", format: "named" },

    // Dark colors
    { name: "Black", value: "black", format: "named" },
    { name: "Navy", value: "navy", format: "named" },
    { name: "Darkslategray", value: "darkslategray", format: "named" },
    { name: "Indigo", value: "indigo", format: "named" },
    { name: "Near Black", value: "#1a1a2e", format: "hex" },
    { name: "Midnightblue", value: "midnightblue", format: "named" },

    // Saturated colors
    { name: "Red", value: "red", format: "named" },
    { name: "Blue", value: "blue", format: "named" },
    { name: "Rebeccapurple", value: "rebeccapurple", format: "named" },
    { name: "Coral", value: "coral", format: "named" },
    { name: "Teal", value: "teal", format: "named" },
    { name: "Gold", value: "gold", format: "named" },
    { name: "Tomato", value: "tomato", format: "named" },
    { name: "Vivid Orange", value: "#ff6600", format: "hex" },
    { name: "Deeppink", value: "deeppink", format: "named" },

    // Mid-tones (tricky)
    { name: "Gray", value: "gray", format: "named", midtone: true },
    { name: "Mid Gray", value: "#808080", format: "hex", midtone: true },
    { name: "Rosybrown", value: "rosybrown", format: "named", midtone: true },
    { name: "Darkkhaki", value: "darkkhaki", format: "named", midtone: true },
    {
      name: "Mediumpurple",
      value: "mediumpurple",
      format: "named",
      midtone: true,
    },
    { name: "Peru", value: "peru", format: "named", midtone: true },

    // oklch colors
    {
      name: "OKLCH Deep Blue",
      value: "oklch(0.5 0.2 240)",
      format: "oklch",
    },
    {
      name: "OKLCH Vivid Green",
      value: "oklch(0.7 0.15 150)",
      format: "oklch",
    },
    {
      name: "OKLCH Neutral",
      value: "oklch(0.5 0 0)",
      format: "oklch",
      midtone: true,
    },
    {
      name: "OKLCH Warm Light",
      value: "oklch(0.9 0.05 80)",
      format: "oklch",
    },
  ];

  /** @type {Record<string, Element | null>} */
  #elements = {};

  /** @type {number | undefined} */
  #debounceTimeout;

  /** @type {number | undefined} */
  #copyResetTimeout;

  connectedCallback() {
    this.#elements = this.#getElements();
    this.#renderFeatureDetection();

    if (!CSS.supports("color", "contrast-color(red)")) {
      this.#showUnsupportedNotice();
      return;
    }

    this.#renderPaletteGrid();
    this.#addEventListeners();
  }

  disconnectedCallback() {
    if (this.#debounceTimeout) {
      clearTimeout(this.#debounceTimeout);
    }

    if (this.#copyResetTimeout) {
      clearTimeout(this.#copyResetTimeout);
    }
  }

  #getElements() {
    /** @type {Record<string, Element | null>} */
    const elements = {};
    const selectors = ContrastColorPlayground.#selectors;

    for (const [key, selector] of Object.entries(selectors)) {
      if (selector === "#unsupported-notice") {
        elements[key] = document.querySelector(selector);
      } else {
        elements[key] = this.querySelector(selector);
      }
    }

    return elements;
  }

  #showUnsupportedNotice() {
    const notice = this.#elements.unsupportedNotice;

    if (notice) {
      /** @type {HTMLElement} */ (notice).hidden = false;
    }

    this.hidden = true;
  }

  #renderFeatureDetection() {
    const { detectionResult, detectionIcon, detectionMessage } = this.#elements;
    const supported = CSS.supports("color", "contrast-color(red)");

    if (detectionResult && detectionIcon && detectionMessage) {
      if (supported) {
        detectionResult.classList.add("detection-result-supported");
        detectionIcon.textContent = "\u2714";
        detectionMessage.textContent =
          "Your browser supports contrast-color(). All playground features are active.";
      } else {
        detectionResult.classList.add("detection-result-unsupported");
        detectionIcon.textContent = "\u2718";
        detectionMessage.textContent = "Your browser does not support contrast-color() yet.";
      }
    }
  }

  #renderPaletteGrid() {
    const { paletteGrid } = this.#elements;

    if (!paletteGrid) {
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const color of ContrastColorPlayground.#presetColors) {
      const li = document.createElement("li");
      li.classList.add("palette-swatch");
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-label", `${color.name}: ${color.value}. Click to copy.`);
      li.dataset.value = color.value;
      li.style.setProperty("--swatch-color", color.value);

      const nameSpan = document.createElement("span");
      nameSpan.classList.add("swatch-name");
      nameSpan.textContent = color.name;
      li.appendChild(nameSpan);

      const valueSpan = document.createElement("span");
      valueSpan.classList.add("swatch-value");
      valueSpan.textContent = color.value;
      li.appendChild(valueSpan);

      const indicator = document.createElement("span");
      indicator.classList.add("swatch-contrast-indicator");
      indicator.setAttribute("aria-hidden", "true");
      indicator.textContent = this.#getContrastLabel(color.value);
      li.appendChild(indicator);

      if (color.midtone) {
        const badge = document.createElement("span");
        badge.classList.add("swatch-midtone-badge");
        badge.textContent = "mid-tone";
        badge.setAttribute(
          "title",
          "Mid-tone colors may not provide optimal contrast with either black or white",
        );
        li.appendChild(badge);
      }

      fragment.appendChild(li);
    }

    paletteGrid.appendChild(fragment);
  }

  /**
   * Determines whether contrast-color() would return "white" or "black"
   * for a given color by reading the computed style from a temporary element.
   * @param {string} _colorValue - CSS color value (unused in label, resolved via CSS)
   * @returns {string} "white" or "black"
   */
  #getContrastLabel(_colorValue) {
    // We cannot read contrast-color() results from JS directly,
    // so we show a static label. The actual rendering is done by CSS.
    // A more accurate approach would use getComputedStyle on a rendered element,
    // but at this point the elements aren't in the DOM yet.
    return "\u25CF"; // bullet as neutral indicator
  }

  #addEventListeners() {
    // Live Color Picker
    this.#addColorPairListeners(
      this.#elements.colorPicker,
      this.#elements.colorTextInput,
      (value) => this.#updatePickerPreview(value),
    );

    // Tint section
    this.#addColorPairListeners(
      this.#elements.tintColorPicker,
      this.#elements.tintColorText,
      (value) => this.#updateTintPreview(value),
    );

    const { tintSlider } = this.#elements;

    if (tintSlider) {
      tintSlider.addEventListener("input", () => {
        this.#updateTintSlider();
      });
    }

    // Style Queries section
    this.#addColorPairListeners(
      this.#elements.styleQueryPicker,
      this.#elements.styleQueryText,
      (value) => this.#updateStyleQueryPreview(value),
    );

    // Card Builder
    this.#addColorPairListeners(this.#elements.cardBgPicker, this.#elements.cardBgText, (value) =>
      this.#updateCardPreview(value),
    );

    // Palette Grid — delegated click and keyboard
    const { paletteGrid } = this.#elements;

    if (paletteGrid) {
      paletteGrid.addEventListener("click", (event) => {
        const swatch = /** @type {HTMLElement} */ (event.target).closest(".palette-swatch");

        if (swatch) {
          void this.#copySwatchValue(/** @type {HTMLElement} */ (swatch));
        }
      });

      paletteGrid.addEventListener("keydown", (e) => {
        const event = /** @type {KeyboardEvent} */ (e);

        if (event.key === "Enter" || event.key === " ") {
          const swatch = /** @type {HTMLElement} */ (event.target).closest(".palette-swatch");

          if (swatch) {
            event.preventDefault();
            void this.#copySwatchValue(/** @type {HTMLElement} */ (swatch));
          }
        }
      });
    }
  }

  /**
   * Adds bidirectional sync listeners for a color picker + text input pair.
   * @param {Element | null} picker
   * @param {Element | null} textInput
   * @param {(value: string) => void} updateFn
   */
  #addColorPairListeners(picker, textInput, updateFn) {
    if (picker) {
      picker.addEventListener("input", (event) => {
        const value = /** @type {HTMLInputElement} */ (event.target).value;

        if (textInput) {
          /** @type {HTMLInputElement} */ (textInput).value = value;
        }

        this.#debounced(() => updateFn(value));
      });
    }

    if (textInput) {
      textInput.addEventListener("input", (event) => {
        const value = /** @type {HTMLInputElement} */ (event.target).value;

        if (picker && value.match(/^#[0-9a-f]{6}$/i)) {
          /** @type {HTMLInputElement} */ (picker).value = value;
        }

        this.#debounced(() => updateFn(value));
      });
    }
  }

  /**
   * @param {() => void} fn
   * @param {number} [delay=50]
   */
  #debounced(fn, delay = 50) {
    if (this.#debounceTimeout) {
      clearTimeout(this.#debounceTimeout);
    }

    this.#debounceTimeout = window.setTimeout(fn, delay);
  }

  /** @param {string} color */
  #updatePickerPreview(color) {
    const { pickerPreview, pickerColorValue, pickerContrastResult } = this.#elements;

    if (pickerPreview) {
      /** @type {HTMLElement} */ (pickerPreview).style.setProperty("--bg", color);
    }

    if (pickerColorValue) {
      pickerColorValue.textContent = color;
    }

    if (pickerContrastResult) {
      const contrastValue = this.#resolveContrastColor(pickerPreview);
      pickerContrastResult.textContent = contrastValue;
    }

    // Update the code snippet
    const codeSnippet = this.querySelector(".playground-section:first-of-type .code-snippet code");

    if (codeSnippet) {
      codeSnippet.innerHTML =
        `<span class="code-prop">background</span>: <span class="code-val">${this.#escapeHtml(color)}</span>;\n` +
        `<span class="code-prop">color</span>: <span class="code-fn">contrast-color</span>(<span class="code-val">${this.#escapeHtml(color)}</span>);`;
    }
  }

  /** @param {string} color */
  #updateTintPreview(color) {
    const { tintPreviewPure, tintPreviewMixed } = this.#elements;

    if (tintPreviewPure) {
      /** @type {HTMLElement} */ (tintPreviewPure).style.setProperty("--bg", color);
    }

    if (tintPreviewMixed) {
      /** @type {HTMLElement} */ (tintPreviewMixed).style.setProperty("--bg", color);
    }

    this.#updateTintCode(color);
  }

  #updateTintSlider() {
    const { tintSlider, tintValue, tintPreviewMixed } = this.#elements;

    if (!tintSlider) {
      return;
    }

    const pct = /** @type {HTMLInputElement} */ (tintSlider).value;

    if (tintValue) {
      tintValue.textContent = pct;
    }

    if (tintPreviewMixed) {
      /** @type {HTMLElement} */ (tintPreviewMixed).style.setProperty("--tint-pct", `${pct}%`);
    }

    const currentColor =
      /** @type {HTMLInputElement} */ (this.#elements.tintColorPicker)?.value || "#6c1afb";
    this.#updateTintCode(currentColor);
  }

  /** @param {string} color */
  #updateTintCode(color) {
    const { tintCodeOutput, tintSlider } = this.#elements;

    if (!tintCodeOutput) {
      return;
    }

    const pct = tintSlider ? /** @type {HTMLInputElement} */ (tintSlider).value : "15";
    const escaped = this.#escapeHtml(color);

    tintCodeOutput.innerHTML = `<span class="code-prop">color</span>: <span class="code-fn">color-mix</span>(in oklch, <span class="code-val">${escaped}</span> <span class="code-val">${pct}%</span>, <span class="code-fn">contrast-color</span>(<span class="code-val">${escaped}</span>));`;
  }

  /** @param {string} color */
  #updateStyleQueryPreview(color) {
    const { styleQueryContainer } = this.#elements;

    if (styleQueryContainer) {
      /** @type {HTMLElement} */ (styleQueryContainer).style.setProperty("--bg", color);
    }
  }

  /** @param {string} color */
  #updateCardPreview(color) {
    const { cardPreview, cardCodeOutput } = this.#elements;

    if (cardPreview) {
      /** @type {HTMLElement} */ (cardPreview).style.setProperty("--card-bg", color);
    }

    if (cardCodeOutput) {
      const escaped = this.#escapeHtml(color);

      cardCodeOutput.innerHTML =
        `<span class="code-sel">.card</span> {\n` +
        `  <span class="code-prop">--card-bg</span>: <span class="code-val">${escaped}</span>;\n` +
        `  <span class="code-prop">background</span>: <span class="code-val">var(--card-bg)</span>;\n` +
        `  <span class="code-prop">color</span>: <span class="code-fn">contrast-color</span>(<span class="code-val">var(--card-bg)</span>);\n` +
        `}\n\n` +
        `<span class="code-sel">.card-button</span> {\n` +
        `  <span class="code-prop">background</span>: <span class="code-fn">contrast-color</span>(<span class="code-val">var(--card-bg)</span>);\n` +
        `  <span class="code-prop">color</span>: <span class="code-val">var(--card-bg)</span>;\n` +
        `}`;
    }
  }

  /** @param {HTMLElement} swatch */
  async #copySwatchValue(swatch) {
    const value = swatch.dataset.value;

    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);

    swatch.setAttribute("data-copied", "");

    const { copyStatus } = this.#elements;

    if (copyStatus) {
      copyStatus.textContent = `Copied ${value} to clipboard`;
    }

    if (this.#copyResetTimeout) {
      clearTimeout(this.#copyResetTimeout);
    }

    this.#copyResetTimeout = window.setTimeout(() => {
      swatch.removeAttribute("data-copied");

      if (copyStatus) {
        copyStatus.textContent = "";
      }
    }, 2000);
  }

  /**
   * Reads the computed color from a rendered element to determine
   * whether contrast-color() resolved to "white" or "black".
   * @param {Element | null} element
   * @returns {string}
   */
  #resolveContrastColor(element) {
    if (!element) {
      return "white";
    }

    // Force a layout so getComputedStyle returns the resolved value
    const computed = getComputedStyle(element).color;

    // The computed value will be an rgb() string.
    // rgb(255, 255, 255) = white, rgb(0, 0, 0) = black
    if (computed.includes("255")) {
      return "white";
    }

    return "black";
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  #escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

customElements.define("contrast-color-playground", ContrastColorPlayground);
