HTML=../public_html
VERSION=0.0.1

all:
	-rm -rf $(HTML)/mathex-old
	-mv -f $(HTML)/mathex $(HTML)/mathex-old
	unzip -q version/mathex-ee-$(VERSION).zip -d $(HTML)/mathex
