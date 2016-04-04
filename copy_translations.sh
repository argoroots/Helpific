scp anton@helpific.com:/opt/translation/locales-copy.yaml.latest .

cp locales-copy.yaml.latest locales-copy.yaml

cp locales-copy.yaml.latest locales.yaml

rm -f locales-copy.yaml.latest
