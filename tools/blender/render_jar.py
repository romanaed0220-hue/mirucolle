"""
コレクションの瓶（広口のガラス瓶）を Blender で描いて、透明 PNG に書き出す。
画風：アプリの「2.5D（正面は平ら、右下に側面を押し出す）」に合わせる。
  - ガラスは 2 段の単色（光の当たる面＝淡い色、かげの面＝同じ色の濃いめ）。境目はくっきり
  - ハイライトも 2 段（白い硬いかたち）
  - 黒い輪郭線（Freestyle）
  - 厚み：瓶の外形を右下にずらして重ね、同じ色の濃い側面＋黒のふちにする（カードやボタンと同じ）
すべて Blender で描く（アプリ側では重ねるだけ）。

  /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/render_jar.py -- <出力フォルダ> [スタイルid ...]

出力（スタイルごと）:
  jar-<id>-back.webp  側面（押し出し）と瓶の奥半分（形の後ろに置く）
  jar-<id>-front.webp  瓶の手前半分とハイライト（形の前に重ねる）
  jar.json            物理の壁（内側の線）・外形（アプリの座標系 320x470）→ src/config/jar.json にコピーする

座標：アプリの瓶の座標系（幅 320・高さ 470、底の中心が (160, 450)）と 1 単位 = 0.01 BU で対応させる。
カメラは正投影で、少しだけ上から見下ろす（口の楕円が見えるように）。環境変数 JAR_TILT で角度を変えられる。
"""
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(ARGS[0] if ARGS else "jar-out")
# id: (ガラスの色, かげの色)。かげはインクに近い濃い色で、重く落とす
STYLES = {
    "soda": ("#D8F3F1", "#2C4446"),
    "peach": ("#FFE4EC", "#4A2E38"),
    "lemon": ("#FFF6CF", "#4A4127"),
    "lilac": ("#EEE8FF", "#352E4F"),
    "night": ("#DDE5FF", "#2A3150"),
}
INK = "#1A1A1A"
WANT = ARGS[1:] or list(STYLES)

VW, VH = 320, 470
BASE_Y = 450  # 底の中心のアプリ座標 y
TILT = math.radians(float(os.environ.get("JAR_TILT", "10")))  # 見下ろす角度
S = 0.01  # アプリの 1 単位 → Blender の長さ
RES = 2  # 書き出しの倍率（640 x 940）
LINE_PX = 5  # 輪郭線の太さ（書き出し px。アプリでは約 2.5px）
SIDE = 0  # 側面の押し出しのうち、かげ色の部分（いまはすべて黒）
EDGE = 9  # 黒い押し出し（重い影）の厚み

# ---- 形（ころんとした広口瓶） ----
R = 128  # 胴の半径
NECK = 100  # 首の半径
T = 6  # ガラスの厚み
BOTTOM_CORNER = 64  # 底の丸み（大きめにして、四角く見えないように）
SHOULDER_CORNER = 46  # 肩の丸み
SHOULDER_Z = 268  # 胴のまっすぐな部分の上端
LIP = 10  # 口のふちの丸みの半径


def arc(cx, cz, rad, a0, a1, n=12):
    return [(cx + rad * math.cos(math.radians(a0 + (a1 - a0) * k / n)),
             cz + rad * math.sin(math.radians(a0 + (a1 - a0) * k / n))) for k in range(n + 1)]


def profile():
    bc, sc = BOTTOM_CORNER, SHOULDER_CORNER
    outer = [(0, 0)]
    outer += arc(R - bc, bc, bc, -90, 0, 16)  # 底の角（大きな丸み）
    outer += arc(R - sc, SHOULDER_Z, sc, 0, 60)  # 肩（60° で止めて首へ）
    neck_z = SHOULDER_Z + sc * math.sin(math.radians(60)) + 8
    outer += [(NECK, neck_z)]
    lip_c = neck_z + 6 + LIP
    outer += arc(NECK + 2, lip_c, LIP, -90, 180, 16)  # 口のふち（ちくわのような丸）
    inner_r = NECK + 2 - LIP
    inner = [(inner_r, lip_c - 2), (inner_r, neck_z - 4)]
    inner += arc(R - sc, SHOULDER_Z, sc - T, 60, 0)
    inner += arc(R - bc, bc, bc - T, 0, -90, 16)
    inner += [(0, T)]
    return outer, inner


OUTER, INNER = profile()
WALL_INNER = [(r, z) for r, z in INNER if r > 0]  # 物理の壁（内側の線）
TOP_Z = max(z for _, z in OUTER)


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def spin_profile(name, prof, steps=256):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    verts = [bm.verts.new((r * S, 0, z * S)) for r, z in prof]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    bmesh.ops.spin(bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1),
                   angle=math.radians(360), steps=steps, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    return obj


def link(nt, a, b):
    nt.links.new(a, b)


def set_blend(m, cull=False):
    if hasattr(m, "surface_render_method"):
        m.surface_render_method = "BLENDED"
    elif hasattr(m, "blend_method"):
        m.blend_method = "BLEND"
    if hasattr(m, "use_backface_culling"):
        m.use_backface_culling = cull


def two_step(nt, value_socket, threshold, low, high):
    """値をしきい値で 2 段にする（くっきり。グラデーションなし）"""
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = low
    ramp.color_ramp.elements[1].position = threshold
    ramp.color_ramp.elements[1].color = high
    link(nt, value_socket, ramp.inputs["Fac"])
    return ramp


def shade_value(nt, bsdf_type, roughness=None):
    """BSDF の明るさを 0〜1 の値にする（Shader to RGB → 白黒）"""
    try:
        b = nt.nodes.new(bsdf_type)
    except RuntimeError:
        b = nt.nodes.new("ShaderNodeBsdfAnisotropic")
    if roughness is not None:
        b.inputs["Roughness"].default_value = roughness
    s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    link(nt, b.outputs[0], s2r.inputs[0])
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    link(nt, s2r.outputs["Color"], bw.inputs[0])
    return bw.outputs[0]


def glass_material(name, glass_hex, shade_hex, alpha_lit, alpha_shade, highlight):
    """2 段のガラス：光の当たる面は淡い色、かげの面は濃いめの色。ハイライトは白い硬いかたち"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    # 明暗は左右の位置で決める：光は左から来るので、右のふちに一定の幅のかげの帯。
    # （面の向きで決めると、奥半分は内側の面が見えているので左右が逆になってしまう。ライトの影はノイズの縞が出る）
    # 「瓶の中心から外へ向かう向き」で明暗を決める。内側の面でも外側の面でも同じ向きになるので、
    # かげは右のふちに沿った三日月形になる（底の角や肩でも輪郭に沿って曲がる）
    tc = nt.nodes.new("ShaderNodeTexCoord")
    center = nt.nodes.new("ShaderNodeVectorMath")
    center.operation = "SUBTRACT"
    center.inputs[1].default_value = (0, 0, 190 * S)
    link(nt, tc.outputs["Object"], center.inputs[0])
    squash = nt.nodes.new("ShaderNodeVectorMath")  # 縦方向は弱める（胴の側面はほぼ真横を向く）
    squash.operation = "MULTIPLY"
    squash.inputs[1].default_value = (1, 1, 0.55)
    link(nt, center.outputs["Vector"], squash.inputs[0])
    norm = nt.nodes.new("ShaderNodeVectorMath")
    norm.operation = "NORMALIZE"
    link(nt, squash.outputs["Vector"], norm.inputs[0])
    dot = nt.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = Vector((-1.0, 0.0, 0.25)).normalized()  # 光：ほぼ真左から
    link(nt, norm.outputs["Vector"], dot.inputs[0])
    lit_map = nt.nodes.new("ShaderNodeMapRange")  # -1〜1 → 0〜1
    lit_map.inputs["From Min"].default_value = -1.0
    link(nt, dot.outputs["Value"], lit_map.inputs["Value"])
    lit = lit_map.outputs["Result"]
    SHADE_EDGE = 0.13  # これより暗い向きがかげ（右のふちの帯）
    color = two_step(nt, lit, SHADE_EDGE, (*hex_rgb(shade_hex), 1), (*hex_rgb(glass_hex), 1))
    alpha = two_step(nt, lit, SHADE_EDGE, (alpha_shade,) * 3 + (1,), (alpha_lit,) * 3 + (1,))

    spec = shade_value(nt, "ShaderNodeBsdfGlossy", roughness=0.07)
    hl = two_step(nt, spec, 0.33, (0, 0, 0, 1), (highlight, highlight, highlight, 1))
    hl_raw = nt.nodes.new("ShaderNodeRGBToBW")
    link(nt, hl.outputs["Color"], hl_raw.inputs[0])
    # ハイライトは明るい面にだけ（かげの上には出さない）
    lit_mask = two_step(nt, lit, SHADE_EDGE, (0, 0, 0, 1), (1, 1, 1, 1))
    lit_bw = nt.nodes.new("ShaderNodeRGBToBW")
    link(nt, lit_mask.outputs["Color"], lit_bw.inputs[0])
    hl_bw = nt.nodes.new("ShaderNodeMath")
    hl_bw.operation = "MULTIPLY"
    link(nt, hl_raw.outputs[0], hl_bw.inputs[0])
    link(nt, lit_bw.outputs[0], hl_bw.inputs[1])

    white = nt.nodes.new("ShaderNodeMix")
    white.data_type = "RGBA"
    white.inputs["B"].default_value = (1, 1, 1, 1)
    link(nt, hl_bw.outputs[0], white.inputs["Factor"])
    link(nt, color.outputs["Color"], white.inputs["A"])
    a_bw = nt.nodes.new("ShaderNodeRGBToBW")
    link(nt, alpha.outputs["Color"], a_bw.inputs[0])
    a_max = nt.nodes.new("ShaderNodeMath")
    a_max.operation = "MAXIMUM"
    link(nt, a_bw.outputs[0], a_max.inputs[0])
    link(nt, hl_bw.outputs[0], a_max.inputs[1])

    em = nt.nodes.new("ShaderNodeEmission")
    link(nt, white.outputs["Result"], em.inputs["Color"])
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    link(nt, a_max.outputs[0], mix.inputs[0])
    link(nt, tr.outputs[0], mix.inputs[1])
    link(nt, em.outputs[0], mix.inputs[2])
    link(nt, mix.outputs[0], out.inputs["Surface"])
    set_blend(m, cull=True)  # ガラスの厚みの裏側の面は描かない（縁が二重にならないように）
    return m


def solid_material(name):
    """側面・影用のべた塗り（色はあとで差し替える）"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    link(nt, em.outputs[0], out.inputs["Surface"])
    return m, em


def look_at(obj, target):
    t = bpy.data.objects.new(obj.name + "-target", None)
    t.location = target
    bpy.context.collection.objects.link(t)
    c = obj.constraints.new("TRACK_TO")
    c.target = t
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"


def area_light(name, loc, size, size_y, energy, target=(0, 0, 1.7)):
    data = bpy.data.lights.new(name, "AREA")
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size_y
    data.energy = energy
    obj = bpy.data.objects.new(name, data)
    obj.location = loc
    bpy.context.collection.objects.link(obj)
    look_at(obj, target)


def setup_scene():
    sc = bpy.context.scene
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            sc.render.engine = engine
            break
        except TypeError:
            continue
    sc.render.film_transparent = True
    sc.render.resolution_x = VW * RES
    sc.render.resolution_y = VH * RES
    sc.render.image_settings.file_format = "WEBP"  # 透過つきで PNG よりずっと軽い
    sc.render.image_settings.quality = 90
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.world = bpy.data.worlds.new("w")  # 真っ黒

    # 明暗を決める光：左上手前から（かげは右側にできる＝側面の押し出しと同じ向き）
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.0
    sun.location = (-5, -6, 7)
    bpy.context.collection.objects.link(sun)
    look_at(sun, (0, 0, 1.5))
    # ハイライト用：左に縦の帯、右に細い帯、上に横の帯
    area_light("key", (-4.6, 0.6, 1.8), 0.16, 7.0, 900)
    # area_light("rim", (4.8, 1.0, 1.4), 0.10, 5.0, 500)
    area_light("top", (-0.8, -2.6, 6.0), 2.4, 0.35, 700, target=(0, 0, 3.0))

    # 輪郭線：外形（シルエット）だけ。切り口のふち（border）は引かない
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = "ABSOLUTE"
    sc.render.line_thickness = 1.0
    vl = sc.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("lines")
    ls.select_by_visibility = True
    ls.visibility = "VISIBLE"
    ls.select_silhouette = True
    ls.select_border = False
    ls.select_crease = False
    lines_col = bpy.data.collections.new("lines")
    sc.collection.children.link(lines_col)
    ls.select_by_collection = True
    ls.collection = lines_col
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("ink")
    ls.linestyle.thickness = LINE_PX
    ls.linestyle.caps = "ROUND"
    ls.linestyle.color = hex_rgb(INK)

    # カメラ：正投影・少し見下ろし。アプリ座標 (160, 235) が画面の中心
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = VH * S
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.collection.objects.link(cam)
    up = Vector((0, math.sin(TILT), math.cos(TILT)))
    view = Vector((0, math.cos(TILT), -math.sin(TILT)))
    center = up * ((BASE_Y - VH / 2) * S)
    cam.location = center - view * 20
    cam.rotation_euler = (math.pi / 2 - TILT, 0, 0)
    cam_data.clip_end = 100
    sc.camera = cam
    return up, view


def keep_half(obj, front):
    """手前半分（カメラ側 = -y）か奥半分だけ残したコピーを作る"""
    dup = obj.copy()
    dup.hide_render = False
    dup.data = obj.data.copy()
    bpy.context.collection.objects.link(dup)  # 半分には線を引かない（線は瓶全体で別に描く）
    bm = bmesh.new()
    bm.from_mesh(dup.data)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, 0), plane_no=(0, 1, 0),
                           clear_inner=front is False, clear_outer=front is True)
    bm.to_mesh(dup.data)
    bm.free()
    return dup


def make_extrusion(jar, up, view):
    """瓶の外形を画面の右下にずらして重ねた「側面」。手前は同じ色の濃いめ、いちばん外は黒"""
    side_mat, side_em = solid_material("side")
    ink_mat, ink_em = solid_material("ink")
    ink_em.inputs["Color"].default_value = (*hex_rgb(INK), 1)
    copies = []
    total = SIDE + EDGE
    for k in range(total, 0, -1):
        d = jar.copy()
        d.data = jar.data
        d.hide_render = False
        bpy.context.collection.objects.link(d)
        # 画面で右に k、下に k（アプリ単位）。奥行きは瓶の厚みより大きく離して、前後が混ざらないように
        d.location = Vector((k * S, 0, 0)) - up * (k * S) + view * (4.0 + k * 3.0)
        d.data = jar.data.copy()
        d.data.materials.clear()
        d.data.materials.append(ink_mat if k > SIDE else side_mat)
        copies.append(d)
    # 瓶そのものの位置に、紙の色で塗りつぶし（側面が透けて見えないように）
    fill = jar.copy()
    fill.data = jar.data.copy()
    fill.hide_render = False
    bpy.context.collection.objects.link(fill)
    fill.location = view * 3.0  # 瓶（奥行き約 2.6）より完全に後ろ、側面より前
    paper_mat, paper_em = solid_material("paper")
    paper_em.inputs["Color"].default_value = (*hex_rgb("#FFFDF6"), 1)
    fill.data.materials.clear()
    fill.data.materials.append(paper_mat)
    copies.append(fill)
    return copies, side_em


def project(x, y, z):
    """Blender 座標（アプリ単位）→ アプリの画面座標"""
    v = y * math.sin(TILT) + z * math.cos(TILT)
    return [round(160 + x, 2), round(BASE_Y - v, 2)]


def convex_hull(pts):
    pts = sorted(set(map(tuple, pts)))

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return [list(p) for p in lower[:-1] + upper[:-1]]


def main():
    os.makedirs(OUT, exist_ok=True)
    clear_scene()
    up, view = setup_scene()
    jar = spin_profile("jar", OUTER + INNER)
    jar.hide_render = True
    extrusion, side_em = make_extrusion(jar, up, view)
    sc = bpy.context.scene
    for sid in WANT:
        glass_hex, shade_hex = STYLES[sid]
        side_em.inputs["Color"].default_value = (*hex_rgb(shade_hex), 1)
        for part, front, a_lit, a_shade, highlight in (
            ("back", False, 0.22, 1.0, 0.0),  # 奥：明るい面はほぼ白、かげは重く
            ("front", True, 0.06, 0.06, 1.0),  # 手前：薄いまま。かげは奥のレイヤーだけで描く（縁が二重にならないように）
        ):
            for e in extrusion:
                e.hide_render = front  # 側面と塗りつぶしは奥のレイヤーだけ
            half = keep_half(jar, front)
            half.data.materials.clear()
            half.data.materials.append(glass_material(f"glass-{sid}-{part}", glass_hex, shade_hex, a_lit, a_shade, highlight))
            sc.render.filepath = os.path.join(OUT, f"jar-{sid}-{part}.webp")
            bpy.ops.render.render(write_still=True)
            bpy.data.objects.remove(half, do_unlink=True)
        print("rendered", sid)

    # 輪郭線だけのレイヤー（全スタイル共通）：瓶全体を見えない材質にして、Freestyle の線だけ描く
    for e in extrusion:
        e.hide_render = True
    outline = jar.copy()
    outline.data = jar.data.copy()
    outline.hide_render = False
    bpy.data.collections["lines"].objects.link(outline)
    clear_mat = bpy.data.materials.new("clear")
    clear_mat.use_nodes = True
    cnt = clear_mat.node_tree
    cnt.nodes.clear()
    link(cnt, cnt.nodes.new("ShaderNodeBsdfTransparent").outputs[0], cnt.nodes.new("ShaderNodeOutputMaterial").inputs["Surface"])
    set_blend(clear_mat)
    outline.data.materials.clear()
    outline.data.materials.append(clear_mat)
    sc.render.filepath = os.path.join(OUT, "jar-lines.webp")
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(outline, do_unlink=True)

    left = [project(-r, 0, z) for r, z in WALL_INNER]
    right = [project(r, 0, z) for r, z in reversed(WALL_INNER)]
    ring = []
    for r, z in OUTER:
        for k in range(72):
            a = 2 * math.pi * k / 72
            ring.append(project(r * math.cos(a), r * math.sin(a), z))
    with open(os.path.join(OUT, "jar.json"), "w") as f:
        json.dump({
            "viewBox": [VW, VH],
            "wallLeft": left,
            "wallRight": right,
            "rimY": project(0, 0, TOP_Z)[1],
            "silhouette": convex_hull(ring),
            "styles": {k: {"glass": v[0], "shade": v[1]} for k, v in STYLES.items()},
        }, f)
    print("done", OUT)


main()
