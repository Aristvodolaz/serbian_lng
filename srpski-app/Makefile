PY ?= python3

.PHONY: all validate build audio clean

all: validate build

validate:
	cd tools && $(PY) validate_content.py

build: validate
	cd tools && $(PY) build_content.py

audio:
	cd tools && $(PY) make_dev_audio.py

clean:
	rm -rf content/build content/audio
