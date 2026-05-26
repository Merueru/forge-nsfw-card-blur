# Forge NSFW Card Blur

A small Stable Diffusion WebUI Forge / A1111 Extra Networks extension for blurring or hiding selected card thumbnails.

This extension does not analyze generated images and does not filter your output images. It only affects thumbnails shown in the Extra Networks card browser, such as LoRA cards.

![Per-card blur toggle](images/fncbgif003.png)

## Features

- Blur, hide, or show marked Extra Networks card thumbnails.
- Use cached low-resolution blurred previews in Blur mode, which avoids applying a live browser blur filter to every marked card while scrolling.
- Hover a blurred card to temporarily reveal the original thumbnail.
- Mark individual cards from the card metadata popup with a compact `NSFW blur on/off` toggle.
- Save per-card choices on the Forge machine in `data/marked_cards.json`, not in browser local storage.
- Use a small Extra Networks toolbar button to switch between `Blur`, `Hide`, and `Show` modes.

## Usage

Open an Extra Networks card metadata popup, then toggle `NSFW blur on/off` below the file metadata table.

![Metadata toggle](images/fncbgif003.png)

The global toolbar mode controls how marked cards behave:

- `Blur`: show a cached blurred preview for marked thumbnails. Hovering over the card reveals the original thumbnail.
- `Hide`: hide marked thumbnails entirely.
- `Show`: show all thumbnails normally.

The toolbar mode is temporary for the current UI session. To change the default, open Forge `Settings` and search for `Forge NSFW Card Blur`.

## Toolbar Mode

Use the Extra Networks toolbar button to switch between blur, hide, and show behavior without changing the saved default setting.

![Toolbar mode](images/fncbgif001.gif)

## Blur

Marked cards use a generated blurred preview image instead of a live CSS blur filter. The first time a marked preview is shown, the extension creates a small blurred JPEG under `data/blurred_previews/`; later views reuse that cache.

If the original preview image changes, the blurred cache key changes too because it includes the preview file path, modified time, and file size. Hovering over a blurred card still swaps back to the original thumbnail, so editing or inspecting a card behaves like the normal Extra Networks view.

![Blur mode](images/fncbgif002.gif)

## Hide

Marked cards are hidden completely. Hovering over the card will not reveal the thumbnail.

![Hide mode](images/fncbgif001.png)

## Show

All card thumbnails are shown normally.

![Show mode](images/fncbgif002.png)

## Storage

Per-card markers are stored here:

```text
data/marked_cards.json
```

Blurred preview cache files are stored here:

```text
data/blurred_previews/
```

The cache is only used for the Extra Networks thumbnail UI. It does not replace your original preview images and does not affect generated output images. The `data/` folder is ignored by git so personal card choices and cache files are not published with the extension.

## Installation

Install from Forge / A1111's Extensions tab, or clone this repository into your `extensions` folder:

```bash
git clone https://github.com/Merueru/forge-nsfw-card-blur.git extensions/forge-nsfw-card-blur
```

Restart the WebUI after installation.

## Credits

Based on [CurtisDS/stupid-nsfw-card-blur-a1111](https://github.com/CurtisDS/stupid-nsfw-card-blur-a1111).

Original project by CurtisDS. This version keeps the lightweight blur/hide/show behavior and adds explicit per-card metadata toggles, machine-local JSON storage, cached blurred previews, and Forge-focused UI polish.

Some toolbar/blur/show demo images are based on the original project preview assets and are kept under the same MIT license. Replace them with new screenshots any time.

## License

MIT License. See [LICENSE.txt](LICENSE.txt).
