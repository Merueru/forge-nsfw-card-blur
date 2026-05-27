const nsfwh = {
	currentViewOption: "Hide",
	defaultOptSet: false,
	attributesAdded: false,
	storageLoaded: false,
	storageLoadPromise: null,
	markedCards: new Set(),
	viewportObserver: null,
	observedCards: new WeakSet(),
	endpoints: {
		marked: "/nsfw-card-blur/marked",
	},

	setAttributes: () => {
		let extraNetworkTabs = gradioApp().querySelectorAll("#txt2img_extra_tabs, #img2img_extra_tabs");
		if(typeof extraNetworkTabs != "undefined" && extraNetworkTabs != null && extraNetworkTabs.length > 0) {
			extraNetworkTabs.forEach(extraNetworkTab => {
				extraNetworkTab.setAttribute("nsfw-setting", nsfwh.currentViewOption)
			});
		}
		nsfwh.attributesAdded = true;
	},

	cardKey: (page, name) => {
		return `${page || ""}::${name || ""}`;
	},

	pageFromCard: (card) => {
		const container = card.closest(".extra-network-cards[id]");
		if(!container) return "";

		return container.id
			.replace(/^(txt2img|img2img)_/, "")
			.replace(/_cards$/, "");
	},

	keyFromCard: (card) => {
		return nsfwh.cardKey(nsfwh.pageFromCard(card), card.getAttribute("data-name") || "");
	},

	pageFromEditor: (editor) => {
		const match = (editor.id || "").match(/^(txt2img|img2img)_(.+)_edit_user_metadata$/);
		return match ? match[2] : "";
	},

	nameFromEditor: (editor) => {
		const field = editor.querySelector('[id$="_name"] textarea, [id$="_name"] input');
		return field ? field.value : "";
	},

	loadMarkedCards: async () => {
		if(nsfwh.storageLoaded) return Array.from(nsfwh.markedCards);
		if(nsfwh.storageLoadPromise) return nsfwh.storageLoadPromise;

		nsfwh.storageLoadPromise = (async () => {
			try {
				const response = await fetch(nsfwh.endpoints.marked);
				const data = await response.json();
				if(!response.ok || !data.ok) throw new Error(data.error || response.statusText);

				nsfwh.markedCards = new Set(Array.isArray(data.marked) ? data.marked : []);
				nsfwh.storageLoaded = true;
				return Array.from(nsfwh.markedCards);
			} catch(error) {
				console.warn("[NSFWCardBlur] Marked-card storage is unavailable", error);
				nsfwh.markedCards = new Set();
				nsfwh.storageLoaded = true;
				return [];
			} finally {
				nsfwh.storageLoadPromise = null;
			}
		})();

		return nsfwh.storageLoadPromise;
	},

	setMarkedCard: async (key, marked) => {
		if(!key || key === "::") return;

		if(marked) {
			nsfwh.markedCards.add(key);
		} else {
			nsfwh.markedCards.delete(key);
		}

		nsfwh.applyMarkedCards();

		const response = await fetch(nsfwh.endpoints.marked, {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({key, marked}),
		});
		const data = await response.json();
		if(!response.ok || !data.ok) throw new Error(data.error || response.statusText);
		nsfwh.markedCards = new Set(Array.isArray(data.marked) ? data.marked : []);
		nsfwh.applyMarkedCards();
	},

	cardInViewport: (card) => {
		const rect = card.getBoundingClientRect();
		if(rect.width <= 0 || rect.height <= 0) return false;

		let top = 0;
		let left = 0;
		let bottom = window.innerHeight || document.documentElement.clientHeight;
		let right = window.innerWidth || document.documentElement.clientWidth;
		const scroller = card.closest(".extra-network-cards");

		if(scroller) {
			const scrollerRect = scroller.getBoundingClientRect();
			top = Math.max(top, scrollerRect.top);
			left = Math.max(left, scrollerRect.left);
			bottom = Math.min(bottom, scrollerRect.bottom);
			right = Math.min(right, scrollerRect.right);
		}

		return rect.bottom > top && rect.top < bottom && rect.right > left && rect.left < right;
	},

	updateCardViewport: (card, visible = null) => {
		const isVisible = visible === null ? nsfwh.cardInViewport(card) : visible;
		card.toggleAttribute("data-nsfw-card-visible", isVisible);
	},

	getViewportObserver: () => {
		if(!("IntersectionObserver" in window)) return null;
		if(nsfwh.viewportObserver) return nsfwh.viewportObserver;

		nsfwh.viewportObserver = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				nsfwh.updateCardViewport(entry.target, entry.isIntersecting);
			});
		}, {
			root: null,
			rootMargin: "120px 0px",
			threshold: 0.01,
		});

		return nsfwh.viewportObserver;
	},

	observeCardVisibility: (card) => {
		nsfwh.updateCardViewport(card);

		const observer = nsfwh.getViewportObserver();
		if(observer && !nsfwh.observedCards.has(card)) {
			observer.observe(card);
			nsfwh.observedCards.add(card);
		}
	},

	applyMarkedCards: () => {
		gradioApp().querySelectorAll(".extra-network-pane .card[data-name]").forEach(card => {
			const key = nsfwh.keyFromCard(card);
			card.toggleAttribute("data-nsfw-card-blur", nsfwh.markedCards.has(key));
			nsfwh.observeCardVisibility(card);
		});
	},

	updateEditorToggle: (editor) => {
		const button = editor.querySelector(".nsfw-card-mark-toggle");
		if(!button) return;

		const name = nsfwh.nameFromEditor(editor);
		const page = nsfwh.pageFromEditor(editor);
		const key = nsfwh.cardKey(page, name);
		const marked = nsfwh.markedCards.has(key);
		const state = marked ? "on" : "off";

		if(button.dataset.nsfwMarkState !== state) {
			button.innerHTML = `
				<span class="nsfw-card-switch" aria-hidden="true">
					<span class="nsfw-card-switch-knob"></span>
				</span>
				<span class="nsfw-card-mark-text">
					<strong>${marked ? "NSFW blur on" : "NSFW blur off"}</strong>
				</span>
			`;
			button.dataset.nsfwMarkState = state;
		}
		button.classList.toggle("active", marked);
		const pressed = marked ? "true" : "false";
		if(button.getAttribute("aria-pressed") !== pressed) button.setAttribute("aria-pressed", pressed);
		if(button.disabled !== !name) button.disabled = !name;
		const title = marked ? "This card is marked for NSFW blur/hide" : "Mark this card for NSFW blur/hide";
		if(button.title !== title) button.title = title;
	},

	enhanceMetadataEditors: () => {
		gradioApp().querySelectorAll(".edit-user-metadata").forEach(editor => {
			const buttons = editor.querySelector(".edit-user-metadata-buttons");
			const metadataTable = editor.querySelector(".file-metadata");
			if(!buttons && !metadataTable) return;

			let host = editor.querySelector(".nsfw-card-mark-host");
			if(!host) {
				host = document.createElement("div");
				host.className = "nsfw-card-mark-host";
			}

			if(metadataTable && host.parentElement !== metadataTable.parentElement) {
				metadataTable.insertAdjacentElement("afterend", host);
			} else if(!metadataTable && buttons && host.parentElement !== buttons) {
				buttons.insertBefore(host, buttons.firstChild);
			}

			let toggle = editor.querySelector(".nsfw-card-mark-toggle");
			if(!toggle) {
				toggle = document.createElement("button");
				toggle.type = "button";
				toggle.className = "nsfw-card-mark-toggle";
				toggle.addEventListener("click", async event => {
					event.preventDefault();
					event.stopPropagation();

					const key = nsfwh.cardKey(nsfwh.pageFromEditor(editor), nsfwh.nameFromEditor(editor));
					const marked = !nsfwh.markedCards.has(key);
					toggle.disabled = true;

					try {
						await nsfwh.setMarkedCard(key, marked);
					} catch(error) {
						console.error("[NSFWCardBlur] Failed to update card blur marker", error);
						alert(error.message || "Failed to update card blur marker.");
					} finally {
						toggle.disabled = false;
						nsfwh.updateEditorToggle(editor);
					}
				});
			}

			if(toggle.parentElement !== host) {
				host.appendChild(toggle);
			}

			nsfwh.updateEditorToggle(editor);
		});
	},

	extraNetworksControlNSFWModalOpenOnClick: (event) => {
		let sibling = event.currentTarget.nextElementSibling;
		if(sibling.hasAttribute("modal-open")) {
			if(sibling.getAttribute("modal-open") === "true") {
				sibling.style.display = 'none';
				sibling.setAttribute("modal-open", "false");
			} else {
				sibling.style.display = 'grid';
				sibling.setAttribute("modal-open", "true");
			}
		}
	},

	extraNetworksControlNSFWModalCloseOnClick: (event) => {
		event.currentTarget.parentNode.style.display = 'none';
		event.currentTarget.parentNode.setAttribute("modal-open", "false");
	},

	extraNetworksControlNSFWBlurOnClick: (event) => {
		event.currentTarget.parentNode.style.display = 'none';
		event.currentTarget.parentNode.setAttribute("modal-open", "false");
		nsfwh.currentViewOption = "Blur";
		nsfwh.setAttributes();
	},

	extraNetworksControlNSFWHideOnClick: (event) => {
		event.currentTarget.parentNode.style.display = 'none';
		event.currentTarget.parentNode.setAttribute("modal-open", "false");
		nsfwh.currentViewOption = "Hide";
		nsfwh.setAttributes();
	},

	extraNetworksControlNSFWShowOnClick: (event) => {
		event.currentTarget.parentNode.style.display = 'none';
		event.currentTarget.parentNode.setAttribute("modal-open", "false");
		nsfwh.currentViewOption = "Show";
		nsfwh.setAttributes();
	},

	ensureControlButtons: () => {
		let extraNetworkTabsControls = document.querySelectorAll("#txt2img_extra_tabs > .tab-nav > .extra-networks-controls-div > .extra-network-control:not([nsfw-hijack]), #img2img_extra_tabs > .tab-nav > .extra-networks-controls-div > .extra-network-control:not([nsfw-hijack])");
		if(typeof extraNetworkTabsControls == "undefined" || extraNetworkTabsControls == null || extraNetworkTabsControls.length <= 0) return;

		extraNetworkTabsControls.forEach(extraNetworkTabsControl => {
			const viewMenu = document.createElement('div');
			viewMenu.className = 'extra-network-control--nsfw extra-network-control--enabled nsfw-menu-button';
			viewMenu.title = `Change NSFW Filter`;
			viewMenu.onclick = (event) => nsfwh.extraNetworksControlNSFWModalOpenOnClick(event);
			const viewMenuIcon = document.createElement('i');
			viewMenuIcon.className = 'extra-network-control--icon extra-network-control--nsfw-icon';
			viewMenu.appendChild(viewMenuIcon);

			const modalDiv = document.createElement('div');
			modalDiv.className = "nsfw-modal-div";
			modalDiv.setAttribute("modal-open","false");

			const blurNsfwDiv = document.createElement('div');
			blurNsfwDiv.title = "Blur NSFW";
			blurNsfwDiv.className = "extra-network-control--nsfw nsfw-blur";
			blurNsfwDiv.onclick = (event) => nsfwh.extraNetworksControlNSFWBlurOnClick(event);
			const blurNsfwIcon = document.createElement('i');
			blurNsfwIcon.className = "extra-network-control--icon extra-network-control--nsfw-icon";
			blurNsfwDiv.appendChild(blurNsfwIcon);

			const hideNsfwDiv = document.createElement('div');
			hideNsfwDiv.title = "Hide NSFW";
			hideNsfwDiv.className = "extra-network-control--nsfw nsfw-hide";
			hideNsfwDiv.onclick = (event) => nsfwh.extraNetworksControlNSFWHideOnClick(event);
			const hideNsfwIcon = document.createElement('i');
			hideNsfwIcon.className = "extra-network-control--icon extra-network-control--nsfw-icon";
			hideNsfwDiv.appendChild(hideNsfwIcon);

			const showNsfwDiv = document.createElement('div');
			showNsfwDiv.title = "Show NSFW";
			showNsfwDiv.className = "extra-network-control--nsfw nsfw-show";
			showNsfwDiv.onclick = (event) => nsfwh.extraNetworksControlNSFWShowOnClick(event);
			const showNsfwIcon = document.createElement('i');
			showNsfwIcon.className = "extra-network-control--icon extra-network-control--nsfw-icon";
			showNsfwDiv.appendChild(showNsfwIcon);

			const clearDiv = document.createElement('div');
			clearDiv.className = "nsfw-modal-div-clear";
			clearDiv.onclick = (event) => nsfwh.extraNetworksControlNSFWModalCloseOnClick(event);

			modalDiv.appendChild(blurNsfwDiv);
			modalDiv.appendChild(hideNsfwDiv);
			modalDiv.appendChild(showNsfwDiv);
			modalDiv.appendChild(clearDiv);

			extraNetworkTabsControl.prepend(modalDiv);
			extraNetworkTabsControl.prepend(viewMenu);
			extraNetworkTabsControl.setAttribute("nsfw-hijack","");
		});

		if(nsfwh.defaultOptSet && !nsfwh.attributesAdded) {
			nsfwh.setAttributes();
		}
	},
};

onAfterUiUpdate(function() {
	nsfwh.ensureControlButtons();
	nsfwh.enhanceMetadataEditors();
	nsfwh.loadMarkedCards().then(() => {
		nsfwh.applyMarkedCards();
		nsfwh.enhanceMetadataEditors();
	});
});

if(typeof onOptionsAvailable === "function") {
	onOptionsAvailable(initNSFWSettings);
} else {
	const checkInterval = setInterval(() => {
		if (typeof opts !== "undefined" && Object.keys(opts).length > 0) {
			clearInterval(checkInterval);
			initNSFWSettings();
		}
	}, 100);
}

function initNSFWSettings() {
	const defaultViewOption = opts["nsfw_card_blur_default"];

	if(defaultViewOption === "Blur" || defaultViewOption === "Show" || defaultViewOption === "Hide") {
		nsfwh.currentViewOption = defaultViewOption;
	}

	nsfwh.defaultOptSet = true;
	
	if(!nsfwh.attributesAdded) {
		nsfwh.setAttributes();
	}
}
