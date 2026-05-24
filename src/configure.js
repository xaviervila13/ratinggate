function fieldHtml(c) {
  switch (c.type) {
    case 'select': {
      const opts = (c.options || []).map(o =>
        `<option value="${o}"${o === c.default ? ' selected' : ''}>${o}</option>`
      ).join('')
      return `<label>${c.title}</label><select name="${c.key}"${c.required ? ' required' : ''}>${opts}</select>`
    }
    case 'number':
      return `<label>${c.title}</label><input type="number" name="${c.key}" value="${c.default || ''}"${c.required ? ' required' : ''}>`
    case 'checkbox':
      return `<label><input type="checkbox" name="${c.key}"${c.default === 'checked' ? ' checked' : ''}> ${c.title}</label>`
    default:
      return `<label>${c.title}</label><input type="${c.type}" name="${c.key}" value="${c.default || ''}"${c.required ? ' required' : ''}>`
  }
}

function pageHtml(manifest, host) {
  const fields = (manifest.config || []).map((c) => {
    return `<div class="form-group">${fieldHtml(c)}</div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${manifest.name} — Configuración</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html{background:#1a1a2e;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
body{max-width:480px;width:100%;padding:24px}
h1{font-size:28px;margin-bottom:4px}
p{color:#888;margin-bottom:24px;font-size:14px}
.form-group{margin-bottom:16px}
label{display:block;font-size:13px;color:#aaa;margin-bottom:4px}
select,input{width:100%;padding:10px 12px;border:1px solid #333;border-radius:8px;background:#16213e;color:#fff;font-size:15px}
select:focus,input:focus{outline:none;border-color:#8A5AAB}
.links{display:flex;gap:12px;margin-top:24px}
.links a{flex:1;text-align:center;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
.btn-desktop{background:#8A5AAB;color:#fff}
.btn-web{background:#0f3460;color:#fff}
.btn-desktop:hover{background:#7a4a9b}
.btn-web:hover{background:#0a2540}
.hint{font-size:12px;color:#666;margin-top:6px}
</style>
</head>
<body>
<h1>${manifest.name}</h1>
<p>${manifest.description}</p>
<form id="configForm">${fields}</form>
<div class="links">
<a id="desktopLink" class="btn-desktop" target="_blank">Stremio Desktop</a>
<a id="webLink" class="btn-web" target="_blank">Stremio Web</a>
</div>
<p class="hint">Elige los valores y haz clic segun tu version de Stremio</p>
<script>
(function(){
var form=document.getElementById('configForm')
function update(){
var data=new FormData(form),cfg={}
for(var e of data)cfg[e[0]]=e[1]
var enc=encodeURIComponent(JSON.stringify(cfg)),h=window.location.host
document.getElementById('desktopLink').href='stremio://'+h+'/'+enc+'/manifest.json'
var w='https://'+h+'/'+enc+'/manifest.json'
document.getElementById('webLink').href='https://web.stremio.com/#/addons?addon='+encodeURIComponent(w)
}
form.addEventListener('change',update)
update()
})()
</script>
</body>
</html>`
}

function getConfigureHandler(manifest) {
  return function configureHandler(req, res) {
    res.send(pageHtml(manifest, req.headers.host))
  }
}

module.exports = getConfigureHandler
