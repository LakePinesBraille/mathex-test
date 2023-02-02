HTML=../public_html
VERSION=0.0.1

all:
    rm -rf $(HTML)/mathex-old
    mv -f $(HTML)/mathex $(HTML)/mathex-old
    unzip version/mathex-aee-$(version).zip -d $(HTML)/mathex
