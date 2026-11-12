N="#1f3552"; O="#e8572a"; W="#ffffff"; L="#dbe3ec"; T="#16858f"
def wrap(body, vb="0 0 240 240", word=True, wy=222, size=34):
    t=(f'<text x="120" y="{wy}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="{size}" font-weight="800" font-style="italic" letter-spacing="-1">'
       f'<tspan fill="{N}">Spine</tspan><tspan fill="{O}">Bench</tspan></text>') if word else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{body}{t}</svg>'
# lumbar vertebra, side view, anterior = left; unit ~ 32 x 16
def vside(x,y,s=1,fill=W,stroke=N,sw=2.2):
    d="M2,0 H17 Q19,0 19,2 L21,3 H25 L33,9 Q34,11 32,12 L25,9.5 H20 L19,12 Q19,14 17,14 H2 Q0,14 0,12 V2 Q0,0 2,0 Z"
    return f'<path transform="translate({x},{y}) scale({s})" d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw/s}" stroke-linejoin="round"/>'
# vertebra, top (axial) view centred at 0,0; ~44 wide
AX=("M0,-15 C15,-15 21,-6 19,4 C18,9 12,11 9,10 L11,15 L22,16 Q25,17 24,20 L10,21 L5,29 L1,37 Q0,39 -1,37 L-5,29 L-10,21 L-24,20 Q-25,17 -22,16 L-11,15 L-9,10 "
    "C-12,11 -18,9 -19,4 C-21,-6 -15,-15 0,-15 Z")
def vax(x,y,s=1,fill=W,stroke=N,sw=2.4,hole=True):
    h=f'<ellipse cx="0" cy="15" rx="5" ry="4" fill="{stroke}"/>' if hole else ''
    return f'<g transform="translate({x},{y}) scale({s})"><path d="{AX}" fill="{fill}" stroke="{stroke}" stroke-width="{sw/s}" stroke-linejoin="round"/>{h}</g>'

# 1 · The lifter: faceless spine figure bench-pressing on an incline bench
def opt1():
    b=[f'<ellipse cx="120" cy="176" rx="86" ry="7" fill="{L}"/>']
    b.append(f'<path d="M62 150 L150 116" stroke="{N}" stroke-width="13" stroke-linecap="round"/>')         # incline pad
    b.append(f'<path d="M80 147 L74 174 M58 174 H92 M140 122 L152 174 M136 174 H170" stroke="{N}" stroke-width="7" stroke-linecap="round"/>')
    b.append(f'<path d="M176 62 V174 M164 174 H190 M176 66 H164" stroke="{N}" stroke-width="7" stroke-linecap="round"/>')  # rack
    # spine along the pad (vertebrae rotated to pad angle), pelvis at left, no head: top vertebra is a rounded cap
    import math
    ang=-21
    for i in range(6):
        x=74+i*14.2; y=128-i*5.45
        b.append(f'<g transform="translate({x},{y}) rotate({ang})"><rect x="0" y="0" width="12" height="11" rx="3.2" fill="{W}" stroke="{N}" stroke-width="2.2"/><path d="M3,11 l-1,7 h5 l1,-7" fill="{W}" stroke="{N}" stroke-width="1.8" stroke-linejoin="round"/></g>')
        if i<5: b.append(f'<g transform="translate({x+12.6},{y-0.2}) rotate({ang})"><rect x="0" y="1.5" width="2" height="8" rx="1" fill="{O}"/></g>')
    # pelvis + legs
    b.append(f'<path d="M58 136 q8 -10 18 -4 l-2 14 h-14 z" fill="{W}" stroke="{N}" stroke-width="2.2" stroke-linejoin="round"/>')
    b.append(f'<path d="M62 140 L42 118 L36 172 H24" fill="none" stroke="{N}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    # arms + bar
    b.append(f'<path d="M146 103 L140 56 M156 99 L160 56" fill="none" stroke="{N}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    b.append(f'<rect x="76" y="51" width="128" height="6" rx="3" fill="{N}"/>')
    for x in (84,186): b.append(f'<rect x="{x-6}" y="30" width="12" height="48" rx="4" fill="{N}"/>')
    for x in (98,172): b.append(f'<rect x="{x-3}" y="38" width="6" height="32" rx="2.5" fill="{N}"/>')
    b.append(f'<path d="M66 34 q-8 6 -5 17 M58 28 q-11 9 -8 25 M206 34 q8 6 5 17 M214 28 q11 9 8 25" fill="none" stroke="{O}" stroke-width="3" stroke-linecap="round"/>')
    return wrap("".join(b))

# 2 · Barbell spine: the bar is a lumbar spine lying flat, plates at both ends
def opt2():
    b=[f'<ellipse cx="120" cy="150" rx="92" ry="6" fill="{L}"/>']
    for i in range(5):
        b.append(vside(57+i*25,92,1.0))
        if i<4: b.append(f'<rect x="{57+i*25+20}" y="93.5" width="4.5" height="11" rx="2" fill="{O}"/>')
    for x in (30,196): b.append(f'<rect x="{x}" y="58" width="16" height="84" rx="6" fill="{N}"/>')
    for x in (47,186): b.append(f'<rect x="{x}" y="72" width="8" height="56" rx="3" fill="{N}"/>')
    b.append(f'<rect x="14" y="94" width="16" height="10" rx="4" fill="{N}"/><rect x="212" y="94" width="16" height="10" rx="4" fill="{N}"/>')
    return wrap("".join(b), wy=205)

# 3 · S-curve spine resting on a bench (monoline, elegant)
def opt3():
    import math
    b=[]
    b.append(f'<path d="M40 150 H200" stroke="{N}" stroke-width="12" stroke-linecap="round"/>')
    b.append(f'<path d="M60 156 V184 M180 156 V184 M48 184 H72 M168 184 H192" stroke="{N}" stroke-width="7" stroke-linecap="round"/>')
    # gentle S of vertebrae from left (sacrum) to right (cervical), arching above the bench
    pts=[]
    for i in range(8):
        t=i/7; x=58+t*124; y=130-10*math.sin(math.pi*t)
        pts.append((x,y))
    for i,(x,y) in enumerate(pts):
        j=min(i,6); nx,ny=pts[j+1]; px,py=pts[j]; a=math.degrees(math.atan2(ny-py,nx-px))
        b.append(f'<g transform="translate({x:.1f},{y:.1f}) rotate({a:.1f})"><rect x="-7" y="-7" width="14" height="13" rx="3.5" fill="{W}" stroke="{N}" stroke-width="2.4"/><path d="M-3,6 l-1.5,9 h6 l1.5,-9" fill="{W}" stroke="{N}" stroke-width="2" stroke-linejoin="round"/></g>')
    for i in range(7):
        (x1,y1),(x2,y2)=pts[i],pts[i+1]; mx,my=(x1+x2)/2,(y1+y2)/2; a=math.degrees(math.atan2(y2-y1,x2-x1))
        b.append(f'<g transform="translate({mx:.1f},{my:.1f}) rotate({a:.1f})"><rect x="-1.5" y="-5" width="3" height="10" rx="1.2" fill="{O}"/></g>')
    b.append(f'<path d="M120 62 v26 m-9 -9 l9 9 l9 -9" fill="none" stroke="{O}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    return wrap("".join(b), wy=226)

# 4 · Emblem: vertebra (top view) inside a rounded hexagon with a barbell across
def opt4():
    b=[f'<path d="M120 18 L196 60 V144 L120 186 L44 144 V60 Z" fill="{N}" stroke="{N}" stroke-width="10" stroke-linejoin="round"/>']
    b.append(f'<rect x="20" y="96" width="200" height="9" rx="4.5" fill="{O}"/>')
    for x in (26,206): b.append(f'<rect x="{x-6}" y="74" width="14" height="53" rx="4" fill="{O}"/>')
    b.append(vax(120,92,2.25,fill=W,stroke=N,sw=2.6))
    return wrap("".join(b), wy=226)

# 5 · Test bench: a motion segment in a load frame (pure moment + axial load)
def opt5():
    b=[]
    b.append(f'<path d="M52 186 H188 M60 186 V40 M180 186 V40 M52 40 H188" stroke="{N}" stroke-width="9" stroke-linecap="round"/>')
    b.append(f'<rect x="88" y="150" width="64" height="20" rx="4" fill="{N}"/>')     # base pot
    b.append(f'<rect x="98" y="58" width="44" height="16" rx="4" fill="{N}"/>')      # top fixture
    b.append(vside(96,98,1.35)); b.append(vside(96,124,1.35))
    b.append(f'<rect x="99" y="118.5" width="23" height="5" rx="2" fill="{O}"/>')
    b.append(f'<path d="M120 74 V96" stroke="{N}" stroke-width="5"/>')
    b.append(f'<path d="M150 68 a28 28 0 0 1 16 34" fill="none" stroke="{O}" stroke-width="5" stroke-linecap="round"/><path d="M160 98 l7 7 l3 -10" fill="none" stroke="{O}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    b.append(f'<path d="M120 22 v14 m-7 -7 l7 7 l7 -7" fill="none" stroke="{O}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')
    return wrap("".join(b), vb="0 0 240 250", wy=236)

for i,f in enumerate([opt1,opt2,opt3,opt4,opt5],1):
    open(f"opt{i}.svg","w").write(f())
html='<html><body style="margin:0;font-family:Segoe UI,Arial;background:#f5f5f2"><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:16px">'
names=["1 · The lifter (no face)","2 · Barbell spine","3 · Spine on a bench","4 · Emblem","5 · Test bench"]
for i,n in enumerate(names,1):
    html+=f'<div style="background:#fff;border-radius:12px;padding:10px;text-align:center"><img src="opt{i}.svg" style="width:100%"><div style="font-size:13px;color:#555">{n}</div></div>'
html+='</div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:0 16px 16px">'
for i in range(1,6):
    html+=f'<div style="background:#16191d;border-radius:12px;padding:10px;text-align:center"><img src="opt{i}.svg" style="width:55%;background:#fff;border-radius:12px;padding:6px"> <img src="opt{i}.svg" style="width:34px;background:#fff;border-radius:6px"></div>'
html+='</div></body></html>'
open("sheet.html","w").write(html)
