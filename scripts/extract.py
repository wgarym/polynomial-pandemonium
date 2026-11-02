"""Read-only extraction of the migration source and a complete object inventory."""
from pathlib import Path
import hashlib, json, zipfile, xml.etree.ElementTree as ET
import sys
source = Path(sys.argv[1] if len(sys.argv)>1 else '/Users/wgarymartin/Downloads/poly072225e.ggb')
out = Path(__file__).resolve().parents[1] / 'docs/source'
out.mkdir(parents=True, exist_ok=True)
before = hashlib.sha256(source.read_bytes()).hexdigest()
with zipfile.ZipFile(source) as archive:
    for name in ['geogebra.xml','geogebra_javascript.js','geogebra_thumbnail.png']:
        (out/name).write_bytes(archive.read(name))
root=ET.parse(out/'geogebra.xml').getroot()
items=[{'tag':e.tag, **e.attrib, 'children':[{'tag':c.tag, **c.attrib} for c in e]} for e in root.find('construction')]
(out/'interface-inventory.json').write_text(json.dumps(items,indent=2,ensure_ascii=False)+'\n')
assert before == hashlib.sha256(source.read_bytes()).hexdigest()
(out/'provenance.json').write_text(json.dumps({'source':str(source),'sha256':before,'bytes':source.stat().st_size,'geogebra':root.attrib},indent=2)+'\n')
print('Extracted',len(items),'construction records. Source SHA-256:',before)
