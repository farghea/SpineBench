NAVY="#1f3552"; ORANGE="#e8572a"; BONE="#ffffff"; SH="#dfe6ee"; DISC="#9db8d6"
def vert(x,y,w=13,h=11):
    # vertebral body (side view, lying) with spinous process pointing down into the bench
    return (f'<path d="M{x+3},{y+h} l-2,6 h5 l2,-6 z" fill="{BONE}" stroke="{NAVY}" stroke-width="1.6" stroke-linejoin="round"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3.5" fill="{BONE}" stroke="{NAVY}" stroke-width="1.8"/>')
def mark(bg=False):
    s=[]
    if bg: s.append(f'<rect x="0" y="0" width="200" height="150" rx="28" fill="#f4f6f8"/>')
    s.append(f'<ellipse cx="108" cy="134" rx="74" ry="6" fill="{SH}"/>')
    # rack upright
    s.append(f'<rect x="160" y="44" width="7" height="88" rx="2" fill="{NAVY}"/><rect x="150" y="128" width="28" height="5" rx="2" fill="{NAVY}"/>')
    s.append(f'<path d="M160 52 h-9 v-6" fill="none" stroke="{NAVY}" stroke-width="4" stroke-linecap="round"/>')
    # bench pad + legs
    s.append(f'<rect x="38" y="96" width="122" height="11" rx="4" fill="{NAVY}"/>')
    s.append(f'<rect x="52" y="106" width="7" height="22" fill="{NAVY}"/><rect x="40" y="127" width="31" height="5" rx="2" fill="{NAVY}"/>')
    s.append(f'<rect x="136" y="106" width="7" height="22" fill="{NAVY}"/>')
    # legs (thigh up, shin down to floor) from pelvis at x~46
    s.append(f'<path d="M50 88 L33 72 L24 120" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>')
    s.append(f'<path d="M24 120 h-10" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>')
    # pelvis
    s.append(f'<path d="M44 80 q8 -6 16 0 l-1 13 h-14 z" fill="{BONE}" stroke="{NAVY}" stroke-width="1.8" stroke-linejoin="round"/>')
    # spine: vertebrae with discs
    xs=[61,76,91,106,121]
    for i,x in enumerate(xs):
        s.append(vert(x,82))
        if i<len(xs)-1: s.append(f'<rect x="{x+13.3}" y="83.5" width="1.6" height="8" rx="0.8" fill="{ORANGE}"/>')
    # neck + head
    s.append(f'<rect x="135" y="84" width="7" height="6" rx="2" fill="{BONE}" stroke="{NAVY}" stroke-width="1.6"/>')
    s.append(f'<circle cx="153" cy="78" r="13" fill="{BONE}" stroke="{NAVY}" stroke-width="2"/>')
    s.append(f'<path d="M147 76 q2 -2 4 0 M155 76 q2 -2 4 0 M148 83 q5 4 10 0" fill="none" stroke="{NAVY}" stroke-width="1.4" stroke-linecap="round"/>')
    # arms from shoulders (x~128) to bar
    s.append(f'<path d="M124 84 L118 63 L120 44 M132 84 L138 63 L136 44" fill="none" stroke="{NAVY}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>')
    # barbell
    s.append(f'<rect x="58" y="39.5" width="128" height="4.5" rx="2.2" fill="{NAVY}"/>')
    for x in (66,170):
        s.append(f'<rect x="{x}" y="24" width="10" height="36" rx="3" fill="{NAVY}"/>')
    s.append(f'<rect x="78" y="30" width="5" height="24" rx="2" fill="{NAVY}"/><rect x="163" y="30" width="5" height="24" rx="2" fill="{NAVY}"/>')
    # hands
    s.append(f'<circle cx="120" cy="42" r="3.6" fill="{BONE}" stroke="{NAVY}" stroke-width="1.6"/><circle cx="136" cy="42" r="3.6" fill="{BONE}" stroke="{NAVY}" stroke-width="1.6"/>')
    # effort lines
    s.append(f'<path d="M56 26 q-6 4 -4 12 M51 22 q-9 7 -6 19 M190 26 q6 4 4 12 M195 22 q9 7 6 19" fill="none" stroke="{ORANGE}" stroke-width="2" stroke-linecap="round"/>')
    return "".join(s)
open("mark.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 150">{mark()}</svg>')
open("mark_badge.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150">{mark(True)}</svg>')
full=(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 230"><g transform="translate(105,0)">{mark()}</g>'
      f'<text x="210" y="208" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="52" font-weight="800" font-style="italic" letter-spacing="-1">'
      f'<tspan fill="{NAVY}">Spine</tspan><tspan fill="{ORANGE}">Bench</tspan></text></svg>')
open("full.svg","w").write(full)
