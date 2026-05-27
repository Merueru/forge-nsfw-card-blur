import json
import os
import tempfile
import threading

import gradio as gr # type: ignore
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from modules import script_callbacks, shared # type: ignore


EXTENSION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(EXTENSION_DIR, "data")
MARKED_PATH = os.path.join(DATA_DIR, "marked_cards.json")
ENDPOINT_BASE = "/nsfw-card-blur"
MAX_MARKED_CARDS = 50000
_lock = threading.Lock()


def ensure_dirs():
	os.makedirs(DATA_DIR, exist_ok=True)


def normalize_marked(values):
	marked = []
	seen = set()

	if not isinstance(values, list):
		return marked

	for value in values[:MAX_MARKED_CARDS]:
		if not isinstance(value, str):
			continue

		value = value.strip()
		if not value or value == "::" or value in seen:
			continue

		seen.add(value)
		marked.append(value)

	return marked


def read_marked():
	ensure_dirs()
	if not os.path.exists(MARKED_PATH):
		return []

	try:
		with open(MARKED_PATH, "r", encoding="utf-8") as f:
			data = json.load(f)
	except Exception as exc:
		print(f"[NSFWCardBlur] Failed to read marked cards: {exc}")
		return []

	if isinstance(data, dict):
		return normalize_marked(data.get("marked", []))

	return normalize_marked(data)


def write_marked(marked):
	ensure_dirs()
	data = {"version": 1, "marked": normalize_marked(marked)}

	fd, temp_path = tempfile.mkstemp(prefix="marked-cards-", suffix=".json", dir=DATA_DIR)
	try:
		with os.fdopen(fd, "w", encoding="utf-8") as f:
			json.dump(data, f, indent=2, ensure_ascii=False)
		os.replace(temp_path, MARKED_PATH)
	finally:
		if os.path.exists(temp_path):
			try:
				os.remove(temp_path)
			except OSError:
				pass

	return data["marked"]


def ensure_storage_file():
	if not os.path.exists(MARKED_PATH):
		write_marked([])


def on_ui_settings():
	section = ('nsfw_card_blur', "Forge NSFW Card Blur")
	shared.opts.add_option("nsfw_card_blur_default", shared.OptionInfo("Blur", "Default NSFW filter setting", gr.Radio, {"choices": ["Blur", "Hide", "Show"]}, section=section))


def register_routes(demo, app: FastAPI):
	with _lock:
		ensure_storage_file()

	@app.get(f"{ENDPOINT_BASE}/marked")
	async def get_marked():
		with _lock:
			marked = read_marked()
		return JSONResponse({"ok": True, "marked": marked})

	@app.post(f"{ENDPOINT_BASE}/marked")
	async def set_marked(request: Request):
		try:
			payload = await request.json()
			key = (payload.get("key") or "").strip()
			marked_value = bool(payload.get("marked"))

			with _lock:
				marked = set(read_marked())
				if key and key != "::":
					if marked_value:
						marked.add(key)
					else:
						marked.discard(key)
				updated = write_marked(sorted(marked))

			return JSONResponse({"ok": True, "marked": updated})
		except Exception as exc:
			print(f"[NSFWCardBlur] Failed to update marked cards: {exc}")
			return JSONResponse({"ok": False, "error": str(exc)}, status_code=400)


script_callbacks.on_ui_settings(on_ui_settings)
script_callbacks.on_app_started(register_routes)
