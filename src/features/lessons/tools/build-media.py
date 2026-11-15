"""Rebuild original lesson artwork and synthesized Japanese audio.
Only the original public lesson text is submitted to the speech endpoint.
Run from the repository: python src/features/lessons/tools/build-media.py
"""
from pathlib import Path
import concurrent.futures, html, json, subprocess, urllib.parse, urllib.request

ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'public/lessons'
OUT.mkdir(parents=True,exist_ok=True)
lessons=json.loads(subprocess.check_output([str(ROOT/'node_modules/.bin/tsx'),'-e',"import {lessons} from './src/lib/lessons'; console.log(JSON.stringify(lessons))"],cwd=ROOT,text=True))
PALETTES=[('#e9ded0','#f6f0e6','#697c67','#d98669'),('#d8e8e4','#f4f3df','#526f78','#e8a26e'),('#e5e3ef','#f9f0df','#69668b','#d28d8d'),('#dce7ec','#f6efe6','#567284','#d1a56e'),('#ebe3d7','#f7f1e6','#78836c','#cc8472'),('#eadedb','#faf1e5','#69776c','#d49676')]

def artwork(lesson,index):
    bg,paper,ink,accent=PALETTES[index%len(PALETTES)]
    cat=lesson['category']; v=index%6
    title=html.escape(lesson['titleJa'])
    base=f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="{bg}"/><stop offset="1" stop-color="{paper}"/></linearGradient><pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".55" fill="{ink}" opacity=".1"/></pattern></defs><rect width="800" height="450" fill="url(#sky)"/><circle cx="{650-v*24}" cy="98" r="55" fill="{paper}" opacity=".8"/>'''
    if cat=='daily':
        scene=f'''<path d="M0 350 Q200 310 420 350 T800 330V450H0" fill="{ink}" opacity=".12"/><rect x="92" y="75" width="286" height="241" rx="95" fill="{paper}"/><path d="M234 76V315M95 187H375" stroke="{bg}" stroke-width="8"/><path d="M100 274Q190 195 234 247T375 220V310H100" fill="{ink}" opacity=".3"/><path d="M80 348H720" stroke="{ink}" stroke-width="11" stroke-linecap="round"/><ellipse cx="407" cy="343" rx="115" ry="13" fill="{ink}" opacity=".2"/><path d="M337 243H465V302Q464 338 402 338Q340 336 337 302Z" fill="{accent}"/><path d="M465 252H482Q519 275 483 300H465" fill="none" stroke="{accent}" stroke-width="17"/><ellipse cx="402" cy="245" rx="62" ry="12" fill="{paper}"/><ellipse cx="402" cy="247" rx="52" ry="8" fill="{ink}"/><path d="M383 215Q369 195 385 177M420 213Q434 191 418 173" fill="none" stroke="{paper}" stroke-width="6" stroke-linecap="round"/><path d="M586 333L570 269H646L633 333" fill="{accent}"/><path d="M607 275V198M607 244Q561 244 555 209Q602 207 607 244M607 224Q644 218 655 180Q607 181 607 224" fill="{ink}"/><rect x="495" y="322" width="77" height="15" rx="3" fill="{ink}"/><rect x="501" y="309" width="75" height="12" rx="3" fill="{paper}"/>'''
    elif cat=='travel':
        scene=f'''<path d="M0 230L140 92L300 250L470 117L680 245L800 178V450H0Z" fill="{ink}" opacity=".25"/><path d="M0 285Q210 250 409 294T800 271V450H0" fill="{ink}" opacity=".35"/><path d="M0 335Q350 288 800 362V450H0" fill="{paper}"/><path d="M0 380Q380 316 800 405M0 403Q380 339 800 428" fill="none" stroke="{ink}" stroke-width="7"/><g transform="translate({80+v*9} 196)"><rect width="450" height="136" rx="36" fill="{paper}" stroke="{ink}" stroke-width="3"/><path d="M0 93H450V113H0" fill="{accent}"/><rect x="28" y="24" width="85" height="53" rx="12" fill="{ink}"/><rect x="130" y="24" width="85" height="53" rx="12" fill="{ink}"/><rect x="232" y="24" width="85" height="53" rx="12" fill="{ink}"/><rect x="336" y="20" width="74" height="96" rx="9" fill="{bg}"/><rect x="345" y="29" width="56" height="49" rx="5" fill="{ink}"/><circle cx="76" cy="138" r="19" fill="{ink}"/><circle cx="370" cy="138" r="19" fill="{ink}"/></g><path d="M693 176V369" stroke="{ink}" stroke-width="9"/><rect x="624" y="148" width="139" height="43" rx="9" fill="{accent}"/><path d="M648 170H736M721 159L737 170L721 181" fill="none" stroke="{paper}" stroke-width="5"/>'''
    elif cat=='stories':
        scene=f'''<circle cx="600" cy="105" r="54" fill="{paper}"/><path d="M0 339Q187 293 400 333T800 308V450H0" fill="{ink}" opacity=".22"/><g fill="{ink}" opacity=".6"><path d="M66 334L127 136L190 334Z"/><path d="M618 338L681 157L745 338Z"/></g><path d="M226 354V208L326 142L429 208V354Z" fill="{paper}"/><path d="M213 213L325 133L440 214" fill="none" stroke="{accent}" stroke-width="18" stroke-linejoin="round"/><rect x="298" y="266" width="57" height="88" rx="25" fill="{accent}"/><rect x="251" y="221" width="45" height="42" rx="5" fill="{bg}"/><rect x="357" y="221" width="45" height="42" rx="5" fill="{bg}"/><path d="M470 357Q465 285 510 277Q565 283 554 358Z" fill="{paper}"/><path d="M483 293L482 247L510 272L539 248L544 297" fill="{paper}"/><circle cx="498" cy="291" r="4" fill="{ink}"/><circle cx="526" cy="291" r="4" fill="{ink}"/><path d="M508 303L514 307L520 302M550 345Q602 346 585 307" fill="none" stroke="{ink}" stroke-width="5" stroke-linecap="round"/><path d="M228 380Q390 337 574 385" fill="none" stroke="{accent}" stroke-width="3"/>'''
    elif cat=='work':
        scene=f'''<rect x="105" y="66" width="590" height="235" rx="18" fill="{paper}"/><path d="M300 68V299M500 68V299" stroke="{bg}" stroke-width="8"/><g fill="{ink}" opacity=".2"><rect x="120" y="192" width="58" height="109"/><rect x="186" y="140" width="72" height="161"/><rect x="315" y="171" width="63" height="130"/><rect x="386" y="111" width="95" height="190"/><rect x="520" y="155" width="73" height="146"/><rect x="601" y="190" width="75" height="111"/></g><path d="M50 368H749" stroke="{ink}" stroke-width="14" stroke-linecap="round"/><rect x="224" y="202" width="295" height="153" rx="14" fill="{ink}"/><rect x="237" y="215" width="269" height="126" rx="5" fill="{bg}"/><rect x="262" y="237" width="98" height="9" rx="4" fill="{accent}"/><rect x="262" y="258" width="167" height="7" rx="3" fill="{paper}"/><rect x="262" y="278" width="122" height="7" rx="3" fill="{paper}"/><path d="M196 356H547L566 367H177Z" fill="{ink}"/><rect x="594" y="280" width="48" height="77" rx="8" fill="{accent}"/><path d="M618 279V201M618 245Q584 225 582 204Q622 211 618 245M618 228Q655 214 657 184Q619 191 618 228" fill="{ink}"/>'''
    else:
        scene=f'''<path d="M0 370Q230 332 800 376V450H0" fill="{ink}" opacity=".12"/><rect x="102" y="278" width="115" height="71" rx="10" fill="{accent}"/><path d="M216 290Q258 290 242 322H216" fill="none" stroke="{accent}" stroke-width="10"/><ellipse cx="160" cy="280" rx="51" ry="8" fill="{paper}"/><path d="M281 182Q350 163 409 185Q463 165 544 182V350Q465 332 409 356Q347 329 281 347Z" fill="{paper}" stroke="{ink}" stroke-width="3"/><path d="M409 188V347" stroke="{bg}" stroke-width="5"/><g stroke="{ink}" opacity=".4" stroke-width="4" stroke-linecap="round"><path d="M303 215L381 218M303 238L377 241M303 261L380 264M303 284L368 287M435 215L519 212M435 238L519 235M435 261L510 258M435 284L519 281"/></g><path d="M557 338L635 167L648 173L573 345Z" fill="{accent}"/><path d="M557 338L551 362L573 345" fill="{ink}"/><g transform="translate(118 111) rotate(-9)"><rect width="100" height="129" rx="8" fill="{paper}"/><text x="50" y="83" text-anchor="middle" font-size="55" fill="{ink}" font-family="sans-serif">あ</text></g>'''
    # Title is a small editorial part of the original artwork, with accessible title in the card as well.
    return base+scene+f'<rect width="800" height="450" fill="url(#grain)"/><text x="34" y="46" font-family="sans-serif" font-size="18" font-weight="600" letter-spacing="3" fill="{ink}">NHAIKANJI / {index+1:02}</text><rect x="32" y="390" width="736" height="42" rx="6" fill="{paper}" opacity=".88"/><text x="50" y="419" font-family="sans-serif" font-size="23" font-weight="600" fill="{ink}">{title}</text></svg>'

for i,lesson in enumerate(lessons):
    (OUT/f"{lesson['id']}.svg").write_text(artwork(lesson,i))
(OUT/'audio').mkdir(exist_ok=True)
manifest_path=OUT/'audio-manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

def audio(sentence):
    target=OUT/'audio'/f"{sentence['id']}.mp3"
    if not target.exists():
        url='https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q='+urllib.parse.quote(sentence['text'])
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req,timeout=25) as response:
            if 'audio' not in response.headers.get('content-type',''):raise RuntimeError('Non-audio response')
            target.write_bytes(response.read())
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(target)],text=True))
    if duration<=0:raise RuntimeError('Empty audio')
    return sentence['id'],round(duration,3)

sentences=[s for l in lessons for s in l['sentences']]
errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    tasks={pool.submit(audio,s):s for s in sentences}
    for task in concurrent.futures.as_completed(tasks):
        try:
            key,duration=task.result();manifest[key]=duration
            manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        except Exception as error: errors.append((tasks[task]['id'],str(error)))
print(json.dumps({'lessons':len(lessons),'illustrations':len(list(OUT.glob('*.svg'))),'audio':len(manifest),'sentences':len(sentences),'errors':errors},ensure_ascii=False))
