"""Package only the production build for Cloudflare Pages direct upload."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json
root=Path(__file__).resolve().parents[1]
dist=root/'dist'
assert (dist/'index.html').is_file(), 'Run pnpm build first.'
output=root/'deployment/polynomial-pandemonium-cloudflare.zip'
output.parent.mkdir(exist_ok=True)
files=sorted(p for p in dist.rglob('*') if p.is_file())
with ZipFile(output,'w',ZIP_DEFLATED) as archive:
    for file in files:
        archive.write(file,file.relative_to(dist))
manifest={'archive':output.name,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'files':[str(p.relative_to(dist)) for p in files]}
(output.parent/'cloudflare-package.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Packaged {len(files)} production files: {output}')
