# Forge NSFW Card Blur

A small Stable Diffusion WebUI Forge / A1111 Extra Networks extension for blurring or hiding selected card thumbnails.

This extension does not analyze generated images and does not filter your output images. It only affects thumbnails shown in the Extra Networks card browser, such as LoRA cards.

![Per-card blur toggle](images/fncbgif003.png)

## Features

- Blur, hide, or show marked Extra Networks card thumbnails.
- Hover a blurred card to temporarily reveal it.
- Mark individual cards from the card metadata popup with a compact `NSFW blur on/off` toggle.
- Keep the original path-based behavior: cards with model or preview paths containing `nsfw` are also treated as NSFW.
- Save per-card choices on the Forge machine in `data/marked_cards.json`, not in browser local storage.
- Use a small Extra Networks toolbar button to switch between `Blur`, `Hide`, and `Show` modes.

## Usage

Open an Extra Networks card metadata popup, then toggle `NSFW blur on/off` below the file metadata table.

![Metadata toggle](images/fncbgif003.png)

The global toolbar mode controls how marked cards behave:

- `Blur`: blur marked thumbnails. Hovering over the card reveals the thumbnail.
- `Hide`: hide marked thumbnails entirely.
- `Show`: show all thumbnails.

The toolbar mode is temporary for the current UI session. To change the default, open Forge `Settings` and search for `Forge NSFW Card Blur`.

## Toolbar Mode

Use the Extra Networks toolbar button to switch between blur, hide, and show behavior without changing the saved default setting.

![Toolbar mode](images/fncbgif001.gif)

## Blur

Marked cards are blurred. Hovering over a blurred card temporarily reveals the thumbnail.

![Blur mode](images/fncbgif002.gif)

## Hide

![hide mode](images/fncbgif001.png)

## Show

All card thumbnails are shown normally.

![Show mode](images/fncbgif002.png)

## Storage

Per-card markers are stored here:

```text
data/marked_cards.json
```

The `data/` folder is ignored by git so personal card choices are not published with the extension.

## Installation

Install from Forge / A1111's Extensions tab, or clone this repository into your `extensions` folder:

```bash
git clone https://github.com/Merueru/forge-nsfw-card-blur.git extensions/forge-nsfw-card-blur
```

Restart the WebUI after installation.

## Credits

Based on [CurtisDS/stupid-nsfw-card-blur-a1111](https://github.com/CurtisDS/stupid-nsfw-card-blur-a1111).

Original project by CurtisDS. This fork keeps the original lightweight blur/hide/show behavior and adds per-card metadata toggles, machine-local JSON storage, and Forge-focused UI polish.

Some toolbar/blur/show demo images are based on the original project preview assets and are kept under the same MIT license. Replace them with new screenshots any time.

## License

MIT License. See [LICENSE.txt](LICENSE.txt).
