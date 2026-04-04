import { useState, useRef, useEffect } from "react";

// ============================================================
// HERSHEY FONTS — Multiple variants
// Each char: [advanceWidth, [[x1,y1,x2,y2], ...]]
// Font height: 21 units = cap height
// ============================================================

// --- Helper: point list → segment list ---
const seg = pts => pts.reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[]);

// ============================================================
// FONT: SANS (standard CNC engraving)
// ============================================================
const SANS = {
  ' ':[8,[]], '!':[4,[[2,21,2,7],[2,2,2,1],[2,1,3,1],[3,1,3,2],[3,2,2,2]]],
  '"':[8,[[1,21,1,16],[6,21,6,16]]], "'":[4,[[1,21,1,16]]],
  '(':[6,seg([[4,25],[2,22],[1,18],[0,14],[0,8],[1,4],[2,0],[4,-3]])],
  ')':[6,seg([[0,25],[2,22],[3,18],[4,14],[4,8],[3,4],[2,0],[0,-3]])],
  '*':[10,[[5,21,5,9],[1,18,9,12],[9,18,1,12]]], '+':[12,[[6,21,6,0],[1,10,11,10]]],
  ',':[4,seg([[2,2],[2,1],[3,1],[3,2],[2,2],[1,0]])],
  '-':[10,[[1,10,9,10]]], '.':[4,seg([[1,1],[1,0],[2,0],[2,1],[1,1]])],
  '/':[10,[[0,0,10,21]]], '\\':[10,[[0,21,10,0]]],
  '0':[12,seg([[5,21],[3,20],[1,18],[0,16],[0,5],[1,3],[3,1],[5,0],[7,0],[9,1],[11,3],[12,5],[12,16],[11,18],[9,20],[7,21],[5,21],[3,16,9,5]])],
  '1':[8,[[2,17,5,21],[5,21,5,0]]], '2':[12,seg([[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[1,3],[0,5],[0,6],[1,8],[3,10],[6,12],[9,15],[10,17],[10,19],[9,21],[7,21],[5,20],[4,19],[3,17]])],
  '3':[12,seg([[1,20],[3,21],[5,21],[9,19],[10,17],[10,14],[8,11],[5,10],[8,9],[10,6],[10,3],[8,1],[6,0],[4,0],[2,1],[1,2]])],
  '4':[12,[[8,21,8,0],[0,14,12,14],[0,14,8,21]]],
  '5':[12,seg([[11,20],[9,21],[4,21],[2,19],[1,17],[1,14],[2,12],[4,11],[6,11],[9,12],[11,14],[12,17],[12,19],[11,21],[9,21]])],
  '6':[12,seg([[9,19],[7,21],[5,21],[3,20],[1,17],[0,13],[0,8],[1,4],[3,1],[6,0],[8,0],[11,1],[13,4],[13,6],[12,9],[10,11],[7,11],[4,10],[1,7]])],
  '7':[12,[[0,21,12,21],[12,21,3,0]]],
  '8':[12,seg([[5,0],[3,1],[1,4],[1,6],[2,9],[4,11],[7,11],[10,9],[11,6],[11,4],[9,1],[7,0],[5,0]])],
  '9':[12,seg([[11,14],[9,12],[7,11],[5,11],[2,12],[0,14],[0,16],[1,19],[3,21],[6,21],[9,20],[11,17],[12,13],[12,8],[11,4],[9,1],[7,0],[4,0],[2,1]])],
  ':':[4,seg([[1,12],[1,11],[2,11],[2,12],[1,12],[1,2],[1,1],[2,1],[2,2],[1,2]])],
  ';':[4,seg([[2,12],[2,11],[3,11],[3,12],[2,12],[3,2],[3,1],[4,1],[4,2],[3,2],[2,0]])],
  '<':[12,[[11,18],[1,10],[11,2]].reduce((a,p,i,r)=>i?[...a,[r[i-1][0],r[i-1][1],p[0],p[1]]]:a,[])],
  '=':[12,[[1,13,11,13],[1,7,11,7]]], '>':[12,seg([[1,18],[11,10],[1,2]])],
  '?':[10,seg([[1,16],[2,14],[4,12],[7,10],[9,8],[10,5],[10,3],[9,1],[7,0],[5,0],[3,1],[2,2],[9,21],[11,19],[11,16],[9,14],[7,13]])],
  '@':[16,seg([[11,13],[10,15],[8,17],[6,18],[4,18],[2,17],[0,15],[0,9],[1,7],[3,5],[5,4],[7,4],[9,5],[11,7],[12,9],[12,13],[12,17],[11,19],[9,20],[7,20],[5,19],[3,17]])],
  'A':[14,[[0,0,7,21],[14,0,7,21],[3,7,11,7]]],
  'B':[14,[[0,0,0,21],[0,21,9,21],[12,20,13,17],[13,17,13,14],[13,14,12,12],[12,12,9,11],[9,11,0,11],[0,11,10,11],[13,9,14,6],[14,6,14,3],[14,3,12,1],[12,1,9,0],[9,0,0,0]]],
  'C':[13,seg([[13,4],[11,2],[9,1],[6,1],[4,2],[2,4],[1,6],[0,9],[0,13],[1,16],[2,18],[4,20],[6,21],[9,21],[11,20],[13,18]])],
  'D':[14,seg([[0,0,0,21],[0,21,7,21],[10,20],[12,18],[13,16],[14,13],[14,8],[13,5],[12,3],[10,1],[7,0],[0,0]])],
  'E':[12,[[0,0,0,21],[0,21,11,21],[0,11,7,11],[0,0,11,0]]],
  'F':[11,[[0,0,0,21],[0,21,11,21],[0,11,7,11]]],
  'G':[14,seg([[13,18],[11,20],[9,21],[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[9,0],[11,1],[13,3],[13,8],[8,8]])],
  'H':[14,[[0,0,0,21],[14,0,14,21],[0,11,14,11]]],
  'I':[4,[[0,0,4,0],[2,0,2,21],[0,21,4,21]]],
  'J':[11,seg([[0,2],[1,0],[3,0],[5,1],[6,3],[6,21]])],
  'K':[13,[[0,0,0,21],[13,21,0,8],[5,13,13,0]]],
  'L':[12,[[0,21,0,0],[0,0,12,0]]],
  'M':[16,[[0,0,0,21],[0,21,8,7],[8,7,16,21],[16,21,16,0]]],
  'N':[14,[[0,0,0,21],[0,21,14,0],[14,0,14,21]]],
  'O':[14,seg([[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[8,0],[10,1],[12,3],[13,5],[14,8],[14,13],[13,16],[12,18],[10,20],[8,21],[6,21]])],
  'P':[13,seg([[0,0,0,21],[0,21,9,21],[12,20],[13,18],[13,14],[12,12],[9,11],[0,11]])],
  'Q':[14,[[6,21,4,20],[4,20,2,18],[2,18,1,16],[1,16,0,13],[0,13,0,8],[0,8,1,5],[1,5,2,3],[2,3,4,1],[4,1,6,0],[6,0,8,0],[8,0,10,1],[10,1,12,3],[12,3,13,5],[13,5,14,8],[14,8,14,13],[14,13,13,16],[13,16,12,18],[12,18,10,20],[10,20,8,21],[8,21,6,21],[10,6,14,0]]],
  'R':[13,seg([[0,0,0,21],[0,21,9,21],[12,20],[13,18],[13,14],[12,12],[9,11],[0,11],[6,11,13,0]])],
  'S':[12,seg([[12,18],[10,20],[8,21],[5,21],[3,20],[1,18],[1,16],[2,14],[4,12],[9,10],[11,8],[12,6],[12,3],[10,1],[8,0],[5,0],[3,1],[1,3]])],
  'T':[12,[[6,0,6,21],[0,21,12,21]]],
  'U':[14,seg([[0,21,0,5],[0,3,1,1],[1,1,3,0],[5,0,9,0],[11,1,13,3],[13,3,14,5],[14,5,14,21]])],
  'V':[14,[[0,21,7,0],[14,21,7,0]]],
  'W':[18,[[0,21,4,0],[9,21,4,0],[9,21,14,0],[18,21,14,0]]],
  'X':[14,[[0,21,14,0],[14,21,0,0]]],
  'Y':[14,[[0,21,7,11],[7,11,7,0],[14,21,7,11]]],
  'Z':[14,[[0,21,14,21],[14,21,0,0],[0,0,14,0]]],
  'a':[12,seg([[9,14,9,0],[9,11,7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,7],[3,6],[5,6],[7,7],[9,9]])],
  'b':[12,seg([[0,21,0,0],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]])],
  'c':[11,seg([[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]])],
  'd':[12,seg([[12,21,12,0],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],
  'e':[11,seg([[0,9,11,9],[11,9,11,11],[10,13,8,14],[6,14],[4,13],[2,11],[1,9],[0,7],[0,5],[1,3],[3,2],[5,2],[7,3],[9,5]])],
  'f':[7,seg([[5,21],[3,21],[2,20],[1,18],[1,0],[3,14,7,14]])],
  'g':[12,seg([[12,14,12,-4],[12,-4,10,-6],[8,-7],[6,-7],[4,-6],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],
  'h':[12,seg([[0,21,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]])],
  'i':[4,[[1,21,1,20],[1,20,2,20],[2,20,2,21],[2,21,1,21],[1,14,1,0]]],
  'j':[5,[[2,21,2,20],[2,20,3,20],[3,20,3,21],[3,21,2,21],[3,14,3,-2],[3,-2,2,-4],[2,-4,0,-5]]],
  'k':[11,[[0,21,0,0],[0,6,9,14],[4,8,11,0]]],
  'l':[4,[[0,21,0,0]]],
  'm':[18,seg([[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0],[10,10,12,13],[14,14],[17,14],[19,13],[20,10],[20,0]])],
  'n':[12,seg([[0,14,0,0],[0,10,2,13],[4,14],[7,14],[9,13],[10,10],[10,0]])],
  'o':[12,seg([[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5],[12,7],[12,9],[11,11],[9,13],[7,14],[5,14]])],
  'p':[12,seg([[0,14,0,-7],[0,11,2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]])],
  'q':[12,seg([[12,14,12,-7],[12,11,10,13],[8,14],[6,14],[4,13],[2,11],[1,9],[1,7],[2,5],[4,3],[6,2],[8,2],[10,3],[12,5]])],
  'r':[7,[[0,14,0,0],[0,8,1,11],[3,13],[5,14],[7,14]].reduce((a,p,i,r2)=>i&&Array.isArray(p)?[...a,[r2[i-1][0]??0,r2[i-1][1]??0,p[0],p[1]]]:a,[])],
  's':[10,seg([[9,11],[7,13],[5,14],[3,14],[1,13],[0,11],[0,9],[1,8],[4,7],[6,6],[8,5],[9,3],[9,2],[8,0],[6,-1],[4,-1],[2,0],[0,2]])],
  't':[7,[[2,21,2,3],[2,3,3,1],[3,1,5,0],[5,0,7,0],[0,14,6,14]]],
  'u':[12,seg([[0,14,0,4],[0,2,1,0],[1,0,3,0],[5,0,7,1],[9,4,10,14],[10,0,10,14]])],
  'v':[12,[[0,14,6,0],[12,14,6,0]]],
  'w':[16,[[0,14,4,0],[8,14,4,0],[8,14,12,0],[16,14,12,0]]],
  'x':[12,[[0,14,12,0],[12,14,0,0]]],
  'y':[12,[[0,14,6,0],[12,14,6,0],[6,0,5,-2],[5,-2,3,-4],[3,-4,1,-4],[1,-4,0,-3]]],
  'z':[11,[[0,14,11,14],[11,14,0,0],[0,0,11,0]]],
  // Hebrew
  'א':[14,[[1,0,7,14],[7,14,13,0],[7,14,7,7]]],'ב':[13,[[11,14,1,14],[1,14,0,12],[0,12,0,1],[0,1,11,1],[0,7,7,7]]],
  'ג':[11,[[9,14,1,14],[1,14,0,12],[0,12,0,0]]],'ד':[13,[[0,0,0,12],[0,12,2,14],[2,14,12,14],[12,14,12,0]]],
  'ה':[13,[[0,0,0,14],[0,14,12,14],[12,14,12,5],[6,14,6,0]]],'ו':[5,[[3,14,3,0]]],
  'ז':[9,[[0,14,8,14],[8,14,5,0]]],'ח':[13,[[0,0,0,14],[13,0,13,14],[0,14,13,14]]],
  'ט':[13,[[0,0,0,14],[0,14,13,14],[13,14,13,0],[7,14,7,5]]],'י':[6,[[5,14,3,12],[3,12,3,0]]],
  'כ':[12,[[11,14,1,14],[1,14,0,12],[0,12,0,1],[0,1,11,1]]],'ך':[12,[[11,14,1,14],[1,14,0,12],[0,12,0,-5]]],
  'ל':[11,[[9,14,1,14],[1,14,0,12],[0,12,0,6],[0,6,2,4],[2,4,9,4],[9,4,9,0]]],
  'מ':[13,[[0,0,0,14],[13,0,13,10],[13,10,6,14],[6,14,0,14],[6,14,6,0]]],'ם':[13,[[0,0,0,14],[13,0,13,14],[0,14,13,14],[0,0,5,0]]],
  'נ':[11,[[9,14,1,14],[1,14,0,12],[0,12,0,0],[0,14,9,0]]],'ן':[5,[[3,14,3,-4]]],
  'ס':[13,seg([[6,14],[4,14],[2,13],[0,11],[0,5],[2,3],[4,2],[6,2],[8,2],[10,3],[12,5],[12,9],[10,11],[8,13],[6,14],[6,7,0,7]])],
  'ע':[13,[[0,14,4,7],[4,7,6,0],[6,0,9,7],[9,7,13,14],[4,7,9,7]]],
  'פ':[12,[[11,14,2,14],[2,14,0,12],[0,12,0,8],[0,8,2,6],[2,6,7,6],[7,6,7,0],[0,0,7,0]]],'ף':[12,[[11,14,2,14],[2,14,0,12],[0,12,0,8],[0,8,2,6],[2,6,7,6],[7,6,7,-5]]],
  'צ':[13,[[0,0,4,14],[4,14,8,0],[8,0,12,14],[4,14,12,14]]],'ץ':[13,[[0,0,4,14],[4,14,8,0],[8,0,12,14],[4,14,12,14],[8,0,8,-5]]],
  'ק':[12,[[0,0,0,14],[0,14,11,14],[11,14,11,5]]],'ר':[11,[[0,0,0,12],[0,12,2,14],[2,14,10,14]]],
  'ש':[14,[[0,0,0,14],[0,14,7,14],[7,14,7,0],[7,14,14,0]]],'ת':[14,[[0,0,0,14],[0,14,14,14],[14,14,14,5],[7,14,7,0]]],
};

// ============================================================
// FONT: ITALIC — slanted version of SANS (shear transform)
// ============================================================
const SHEAR = 0.25; // italic slant factor
function makeItalic(font) {
  const out = {};
  for (const [ch, [w, segs]] of Object.entries(font)) {
    out[ch] = [w, segs.map(([x1,y1,x2,y2]) => [
      x1 + y1*SHEAR, y1,
      x2 + y2*SHEAR, y2
    ])];
  }
  return out;
}

// ============================================================
// FONT: BOLD — duplicate strokes slightly offset
// ============================================================
function makeBold(font, offset=0.8) {
  const out = {};
  for (const [ch, [w, segs]] of Object.entries(font)) {
    const extra = segs.map(([x1,y1,x2,y2]) => [x1+offset,y1,x2+offset,y2]);
    out[ch] = [w + offset, [...segs, ...extra]];
  }
  return out;
}

// ============================================================
// FONT: GOTHIC — angular/architectural style
// ============================================================
const GOTHIC = {
  ...SANS,
  'A':[14,[[0,0,7,21],[14,0,7,21],[2,6,12,6],[0,0,2,0],[14,0,12,0]]],
  'B':[14,[[0,0,0,21],[0,21,10,21],[13,20,14,18],[14,18,14,13],[14,13,12,11],[12,11,0,11],[0,11,12,11],[14,9,14,3],[14,3,12,1],[12,1,0,1],[0,1,0,0]]],
  'E':[12,[[0,0,0,21],[0,21,12,21],[0,11,9,11],[0,0,12,0]]],
  'G':[14,[[13,21,0,21],[0,21,0,0],[0,0,13,0],[13,0,13,8],[13,8,7,8]]],
  'H':[14,[[0,0,0,21],[14,0,14,21],[0,10,14,10]]],
  'M':[16,[[0,0,0,21],[0,21,8,8],[8,8,16,21],[16,21,16,0]]],
  'N':[14,[[0,0,0,21],[0,21,14,0],[14,0,14,21],[0,0,2,0],[12,0,14,0],[0,21,2,21],[12,21,14,21]]],
  'O':[14,[[0,0,0,21],[0,21,14,21],[14,21,14,0],[14,0,0,0]]],
  'S':[12,[[12,21,0,21],[0,21,0,11],[0,11,12,11],[12,11,12,0],[12,0,0,0]]],
  'Z':[14,[[0,21,14,21],[14,21,0,0],[0,0,14,0],[0,21,2,21],[12,21,14,21],[0,0,2,0],[12,0,14,0]]],
};

// ============================================================
// FONT: SCRIPT — cursive-style with connecting strokes
// ============================================================
const SCRIPT = {
  ...SANS,
  'A':[16,seg([[0,0],[2,8],[5,16],[8,21],[10,21],[12,18],[14,10],[15,0],[3,8,12,8]])],
  'B':[14,seg([[2,21],[0,20],[0,0],[0,21],[8,21],[11,20],[13,18],[13,15],[11,12],[8,11],[0,11],[0,11],[8,11],[11,10],[13,8],[13,4],[11,1],[8,0],[0,0]])],
  'C':[13,seg([[13,17],[11,20],[8,21],[5,21],[2,19],[1,16],[0,12],[0,8],[1,4],[3,1],[6,0],[9,0],[12,2],[13,5]])],
  'D':[15,seg([[2,21],[0,20],[0,0],[0,21],[8,21],[11,20],[14,17],[15,13],[15,8],[14,4],[12,1],[9,0],[0,0]])],
  'G':[14,seg([[13,17],[11,20],[8,21],[5,21],[2,19],[1,16],[0,12],[0,8],[1,4],[3,1],[6,0],[9,0],[12,1],[13,4],[13,8],[9,8]])],
  'S':[12,seg([[12,17],[10,20],[7,21],[4,21],[2,19],[1,16],[1,14],[3,11],[7,9],[9,7],[11,4],[11,2],[9,0],[6,0],[3,1],[1,3]])],
  'a':[12,seg([[9,14],[7,16],[5,16],[3,15],[1,12],[0,9],[0,6],[1,3],[3,1],[5,0],[7,0],[9,2],[9,14],[9,0]])],
  'e':[12,seg([[1,9,11,9],[11,13],[9,15],[7,16],[5,15],[3,13],[1,9],[0,6],[0,4],[1,2],[3,0],[5,0],[7,1],[9,3]])],
  'o':[12,seg([[5,16],[3,15],[1,12],[0,9],[0,6],[1,3],[3,1],[5,0],[7,0],[9,1],[11,4],[12,7],[12,9],[11,12],[9,15],[7,16],[5,16]])],
  's':[10,seg([[9,13],[7,16],[5,16],[3,14],[1,11],[1,8],[3,6],[5,5],[7,4],[9,2],[9,0],[7,-1],[5,-1],[3,0],[1,2]])],
};

// ============================================================
// FONT REGISTRY
// ============================================================
const FONTS = {
  sans:   { name: 'Sans',   data: SANS },
  italic: { name: 'Italic', data: makeItalic(SANS) },
  bold:   { name: 'Bold',   data: makeBold(SANS) },
  gothic: { name: 'Gothic', data: GOTHIC },
  script: { name: 'Script', data: SCRIPT },
};

// ============================================================
// TTF → SINGLE LINE (canvas-based skeleton extraction)
// ============================================================
async function ttfToStrokes(fontFace, text, fontSizeMm, letterSpacingMm, lineHeightMm) {
  // Render each char to canvas, extract centerline via thinning
  const PX = 80; // render size in pixels per font unit
  const FONT_HEIGHT = 21;
  const scale = fontSizeMm / FONT_HEIGHT;

  await fontFace.load();
  document.fonts.add(fontFace);

  const canvas = document.createElement('canvas');
  canvas.width = PX * 2; canvas.height = PX * 2;
  const ctx = canvas.getContext('2d');

  const allStrokes = [];
  const HEBREW_RE = /[\u05D0-\u05EA]/;
  const lines = text.split('\n');

  lines.forEach((line, li) => {
    const rtl = HEBREW_RE.test(line);
    const chars = rtl ? Array.from(line).reverse() : Array.from(line);
    // Compute char widths
    const charWidths = chars.map(ch => {
      ctx.font = `${PX}px "${fontFace.family}"`;
      return ctx.measureText(ch).width;
    });
    const totalW = charWidths.reduce((a,w)=>a+w,0) * scale / PX;

    let xOff = 0;
    chars.forEach((ch, ci) => {
      if (ch === ' ') { xOff += charWidths[ci]*scale/PX + letterSpacingMm; return; }
      // Render char
      const cW = Math.ceil(charWidths[ci]) + 4;
      canvas.width = cW; canvas.height = PX + 10;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#000';
      ctx.font = `${PX}px "${fontFace.family}"`;
      ctx.fillText(ch, 2, PX - 5);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const W = canvas.width, Hc = canvas.height;
      const binary = new Uint8Array(W * Hc);
      for (let i=0; i<W*Hc; i++) binary[i] = imgData.data[i*4] < 128 ? 1 : 0;

      // Simple centerline: scan each column, find midpoint of dark pixels
      for (let x=0; x<W-1; x++) {
        const col1 = [], col2 = [];
        for (let y=0; y<Hc; y++) { if (binary[y*W+x]) col1.push(y); }
        for (let y=0; y<Hc; y++) { if (binary[y*W+x+1]) col2.push(y); }
        if (!col1.length || !col2.length) continue;
        const m1 = col1.reduce((a,b)=>a+b,0)/col1.length;
        const m2 = col2.reduce((a,b)=>a+b,0)/col2.length;
        const mmX1 = rtl ? totalW - (xOff + x*scale/PX) : xOff + x*scale/PX;
        const mmX2 = rtl ? totalW - (xOff + (x+1)*scale/PX) : xOff + (x+1)*scale/PX;
        allStrokes.push({
          x1: mmX1, y1: li*lineHeightMm + (PX-m1)*scale/PX,
          x2: mmX2, y2: li*lineHeightMm + (PX-m2)*scale/PX,
        });
      }
      xOff += charWidths[ci]*scale/PX + letterSpacingMm;
    });
  });
  return allStrokes;
}

// ============================================================
// HERSHEY TEXT → STROKES
// ============================================================
const HEBREW_RE = /[\u05D0-\u05EA]/;

function textToStrokes(text, fontSizeMm, letterSpacingMm, lineHeightMm, fontData) {
  const FONT_HEIGHT = 21;
  const scale = fontSizeMm / FONT_HEIGHT;
  const lines = text.split('\n');
  const allStrokes = [];

  lines.forEach((line, li) => {
    const rtl = HEBREW_RE.test(line);
    const chars = rtl ? Array.from(line).reverse() : Array.from(line);
    // Compute line width for RTL mirroring
    const lineW = chars.reduce((sum, ch) => {
      const [w] = fontData[ch] || fontData[' '];
      return sum + (w + letterSpacingMm/scale) * scale;
    }, 0);
    let xOff = 0;
    chars.forEach(ch => {
      const [w, segs] = fontData[ch] || fontData[' '];
      segs.forEach(([x1,y1,x2,y2]) => {
        const fx1 = rtl ? lineW - (xOff + x1*scale) : xOff + x1*scale;
        const fx2 = rtl ? lineW - (xOff + x2*scale) : xOff + x2*scale;
        allStrokes.push({ x1:fx1, y1:li*lineHeightMm+y1*scale, x2:fx2, y2:li*lineHeightMm+y2*scale });
      });
      xOff += (w + letterSpacingMm/scale) * scale;
    });
  });
  return allStrokes;
}

// ============================================================
// EXPORT
// ============================================================
function toGcode(strokes, { feedRate, plungeRate, zSafe, zCut, ox, oy }) {
  let g = `; Single-Line Text G-code\nG21\nG90\nG0 Z${zSafe}\n`;
  let px=null, py=null;
  for (const s of strokes) {
    const x1=+(s.x1+ox).toFixed(3), y1=+(s.y1+oy).toFixed(3);
    const x2=+(s.x2+ox).toFixed(3), y2=+(s.y2+oy).toFixed(3);
    if (px===null || Math.hypot(px-x1,py-y1)>0.05) {
      g += `G0 Z${zSafe}\nG0 X${x1} Y${y1}\nG1 Z${zCut} F${plungeRate}\n`;
    }
    g += `G1 X${x2} Y${y2} F${feedRate}\n`;
    px=x2; py=y2;
  }
  return g + `G0 Z${zSafe}\nM2\n`;
}

function toSVG(strokes, color) {
  if (!strokes.length) return '';
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  strokes.forEach(s=>{mnX=Math.min(mnX,s.x1,s.x2);mnY=Math.min(mnY,s.y1,s.y2);mxX=Math.max(mxX,s.x1,s.x2);mxY=Math.max(mxY,s.y1,s.y2);});
  const p=5, W=mxX-mnX+p*2, H=mxY-mnY+p*2;
  const lines=strokes.map(s=>`<line x1="${(s.x1-mnX+p).toFixed(2)}" y1="${(H-(s.y1-mnY+p)).toFixed(2)}" x2="${(s.x2-mnX+p).toFixed(2)}" y2="${(H-(s.y2-mnY+p)).toFixed(2)}" stroke="${color}" stroke-width="0.5" stroke-linecap="round"/>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">\n${lines}\n</svg>`;
}

// ============================================================
// CANVAS PREVIEW
// ============================================================
function drawCanvas(canvas, strokes) {
  if (!canvas) return;
  const W=canvas.clientWidth, H=canvas.clientHeight;
  if (!W||!H) return;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
  if (!strokes.length) {
    ctx.fillStyle='#aaa'; ctx.font='14px Segoe UI'; ctx.textAlign='center';
    ctx.fillText('הכנס טקסט לתצוגה', W/2, H/2); return;
  }
  let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity;
  strokes.forEach(s=>{mnX=Math.min(mnX,s.x1,s.x2);mnY=Math.min(mnY,s.y1,s.y2);mxX=Math.max(mxX,s.x1,s.x2);mxY=Math.max(mxY,s.y1,s.y2);});
  const pad=30, bw=mxX-mnX||1, bh=mxY-mnY||1;
  const sc=Math.min((W-pad*2)/bw,(H-pad*2)/bh);
  const ox2=pad+(W-pad*2-bw*sc)/2, oy2=pad+(H-pad*2-bh*sc)/2;
  const tx=x=>ox2+(x-mnX)*sc, ty=y=>H-oy2-(y-mnY)*sc;
  let prev=null;
  for (const s of strokes) {
    if (prev&&Math.hypot(prev.x2-s.x1,prev.y2-s.y1)>0.05) {
      ctx.strokeStyle='rgba(255,100,100,0.35)'; ctx.lineWidth=0.8; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(tx(prev.x2),ty(prev.y2)); ctx.lineTo(tx(s.x1),ty(s.y1)); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle='#111'; ctx.lineWidth=1.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(tx(s.x1),ty(s.y1)); ctx.lineTo(tx(s.x2),ty(s.y2)); ctx.stroke();
    prev=s;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TextToGcode() {
  const [text, setText] = useState('Hello CNC\nשלום עולם');
  const [fontKey, setFontKey] = useState('sans');
  const [ttfName, setTtfName] = useState('');
  const [ttfFace, setTtfFace] = useState(null);
  const [useTTF, setUseTTF] = useState(false);
  const [ttfLoading, setTtfLoading] = useState(false);
  const [fontSizeMm, setFontSizeMm] = useState(10);
  const [letterSpacingMm, setLetterSpacingMm] = useState(1);
  const [lineHeightMm, setLineHeightMm] = useState(20);
  const [feedRate, setFeedRate] = useState(800);
  const [plungeRate, setPlungeRate] = useState(200);
  const [zSafe, setZSafe] = useState(5);
  const [zCut, setZCut] = useState(-0.3);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [svgColor, setSvgColor] = useState('#000000');
  const [fileName, setFileName] = useState('text');
  const [strokes, setStrokes] = useState([]);
  const [err, setErr] = useState('');

  const canvasRef = useRef(null);
  const ttfInput = useRef(null);
  const importInput = useRef(null);
  const resizeObs = useRef(null);

  // Recompute strokes
  useEffect(() => {
    if (useTTF && ttfFace) {
      setTtfLoading(true);
      ttfToStrokes(ttfFace, text, fontSizeMm, letterSpacingMm, lineHeightMm)
        .then(s => { setStrokes(s); setTtfLoading(false); })
        .catch(() => setTtfLoading(false));
    } else {
      const fontData = FONTS[fontKey]?.data || SANS;
      setStrokes(textToStrokes(text, fontSizeMm, letterSpacingMm, lineHeightMm, fontData));
    }
  }, [text, fontKey, fontSizeMm, letterSpacingMm, lineHeightMm, useTTF, ttfFace]);

  // Draw preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, strokes);
    if (resizeObs.current) resizeObs.current.disconnect();
    resizeObs.current = new ResizeObserver(() => drawCanvas(canvas, strokes));
    resizeObs.current.observe(canvas);
    return () => resizeObs.current?.disconnect();
  }, [strokes]);

  const loadTTF = (file) => {
    setErr('');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['ttf','otf','woff','woff2'].includes(ext)) {
      setErr('נתמך: TTF, OTF, WOFF, WOFF2'); return;
    }
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9]/g,'-');
    const face = new FontFace(name, `url(${url})`);
    setTtfName(file.name);
    setTtfFace(face);
    setUseTTF(true);
  };

  const importFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target.result;
      if (ext==='txt') { setText(content.trim()); return; }
      if (ext==='svg') {
        const doc = new DOMParser().parseFromString(content,'image/svg+xml');
        const t = [...doc.querySelectorAll('text,tspan')].map(el=>el.textContent.trim()).filter(Boolean).join('\n');
        if (t) setText(t); else setErr('לא נמצא טקסט ב-SVG');
      } else if (ext==='dxf') {
        const lines = content.split('\n').map(l=>l.trim());
        const texts = [];
        for (let i=0;i<lines.length-1;i++) if ((lines[i]==='TEXT'||lines[i]==='MTEXT')) for (let j=i;j<Math.min(i+30,lines.length-1);j++) if (parseInt(lines[j])===1){texts.push(lines[j+1]);break;}
        if (texts.length) setText(texts.join('\n')); else setErr('לא נמצא טקסט ב-DXF');
      }
    };
    reader.readAsText(file);
  };

  const exportGcode = () => {
    const content = toGcode(strokes,{feedRate,plungeRate,zSafe,zCut,ox,oy});
    const url=URL.createObjectURL(new Blob([content],{type:'text/plain'}));
    const a=document.createElement('a');a.href=url;a.download=`${fileName}.gcode`;a.click();URL.revokeObjectURL(url);
  };
  const exportSVG = () => {
    const content=toSVG(strokes,svgColor);
    const url=URL.createObjectURL(new Blob([content],{type:'image/svg+xml'}));
    const a=document.createElement('a');a.href=url;a.download=`${fileName}.svg`;a.click();URL.revokeObjectURL(url);
  };

  const unknownChars = useTTF ? [] : [...new Set(Array.from(text).filter(c=>c!=='\n'&&c!==' '&&!(FONTS[fontKey]?.data[c])))];
  const card={background:'#0d1525',border:'1px solid #1e2d4a',borderRadius:10,padding:'14px 16px',marginBottom:12};
  const row={display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8};
  const lbl={fontSize:13,color:'#6a8aaa'};
  const inp=(c='#00e5ff')=>({width:75,background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'5px 8px',color:c,fontSize:13,textAlign:'center',fontFamily:'inherit'});

  return (
    <div dir="rtl" style={{minHeight:'100vh',background:'#0a0e1a',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'15px',color:'#c8d8f0'}}>
      <div style={{borderBottom:'1px solid #1e2d4a',background:'linear-gradient(180deg,#0d1525,#0a0e1a)',padding:'18px 32px',display:'flex',alignItems:'center',gap:16}}>
        <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,#a855f7,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff',fontWeight:700}}>T</div>
        <div>
          <div style={{fontSize:19,fontWeight:700,color:'#e8f4ff'}}>TEXT → G-CODE</div>
          <div style={{fontSize:12,color:'#4a6a8a',marginTop:2}}>Single-Line Fonts + TTF/OTF</div>
        </div>
      </div>

      <div style={{padding:'20px 28px',maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:'310px 1fr',gap:20,alignItems:'start'}}>

        {/* LEFT */}
        <div>
          {/* Font selector */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:10}}>🔤 בחירת פונט</div>

            {/* Hershey variants */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
              {Object.entries(FONTS).map(([key,{name}])=>(
                <button key={key} onClick={()=>{setFontKey(key);setUseTTF(false);}}
                  style={{padding:'8px',borderRadius:7,fontSize:13,cursor:'pointer',border:'none',
                    background:(!useTTF&&fontKey===key)?'rgba(168,85,247,0.2)':'rgba(255,255,255,0.04)',
                    color:(!useTTF&&fontKey===key)?'#a855f7':'#6a8aaa',
                    fontFamily:'inherit',transition:'all 0.15s',
                    outline:(!useTTF&&fontKey===key)?'1px solid #a855f7':'1px solid transparent'}}>
                  {name}
                </button>
              ))}
            </div>

            {/* TTF upload */}
            <div style={{borderTop:'1px solid #1e2d4a',paddingTop:10}}>
              <button onClick={()=>ttfInput.current?.click()}
                style={{width:'100%',padding:'9px',borderRadius:7,fontSize:13,cursor:'pointer',
                  background:useTTF?'rgba(168,85,247,0.2)':'rgba(255,255,255,0.04)',
                  border:useTTF?'1px solid #a855f7':'1px solid #2a3a5a',
                  color:useTTF?'#a855f7':'#6a8aaa',fontFamily:'inherit'}}>
                📁 {ttfName || 'העלה פונט TTF/OTF'}
              </button>
              <input ref={ttfInput} type="file" accept=".ttf,.otf,.woff,.woff2"
                onChange={e=>{if(e.target.files[0])loadTTF(e.target.files[0])}} style={{display:'none'}}/>
              {useTTF&&<div style={{fontSize:11,color:'#a855f7',marginTop:4,textAlign:'center'}}>✓ {ttfName}</div>}
              {ttfLoading&&<div style={{fontSize:11,color:'#ff9900',marginTop:4,textAlign:'center'}}>⚙ מעבד פונט...</div>}
              <div style={{fontSize:11,color:'#3a5060',marginTop:6,lineHeight:1.5}}>
                TTF מומר לקו מרכזי אוטומטית. לתוצאות מיטביות השתמש בפונטים פשוטים.
              </div>
            </div>
          </div>

          {/* Import */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>📂 ייבוא טקסט (SVG/DXF/TXT)</div>
            <button onClick={()=>importInput.current?.click()}
              style={{width:'100%',padding:'8px',borderRadius:7,fontSize:13,cursor:'pointer',background:'rgba(255,255,255,0.04)',border:'1px solid #2a3a5a',color:'#6a8aaa',fontFamily:'inherit'}}>
              📂 בחר קובץ
            </button>
            <input ref={importInput} type="file" accept=".svg,.dxf,.txt"
              onChange={e=>{if(e.target.files[0])importFile(e.target.files[0])}} style={{display:'none'}}/>
            {err&&<div style={{marginTop:6,fontSize:11,color:'#ff8080'}}>⚠ {err}</div>}
          </div>

          {/* Text */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✏ טקסט</div>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} dir="auto"
              style={{width:'100%',background:'#060d1a',border:'1px solid #1e3050',borderRadius:6,padding:'8px',color:'#e8f4ff',fontSize:14,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',lineHeight:1.7}}
              placeholder="הכנס טקסט...&#10;Enter text..."/>
            {unknownChars.length>0&&(
              <div style={{marginTop:5,fontSize:11,color:'#ff9900',background:'rgba(255,153,0,0.08)',borderRadius:5,padding:'5px 8px'}}>
                ⚠ לא נתמך: {unknownChars.map(c=>`"${c}"`).join(' ')}
              </div>
            )}
          </div>

          {/* Typography */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>📐 טיפוגרפיה</div>
            {[
              {label:'גודל אות (mm)',val:fontSizeMm,set:setFontSizeMm,min:1,max:200,step:0.5,c:'#00e5ff'},
              {label:'רווח אותיות (mm)',val:letterSpacingMm,set:setLetterSpacingMm,min:0,max:30,step:0.5,c:'#00e5ff'},
              {label:'גובה שורה (mm)',val:lineHeightMm,set:setLineHeightMm,min:5,max:300,step:1,c:'#00e5ff'},
            ].map(({label,val,set,min,max,step,c})=>(
              <div key={label} style={row}>
                <span style={lbl}>{label}:</span>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <input type="range" min={min} max={max} step={step} value={val}
                    onChange={e=>set(+e.target.value)} style={{width:70}}/>
                  <input type="number" min={min} max={999} step={step} value={val}
                    onChange={e=>set(+e.target.value)} style={inp(c)}/>
                </div>
              </div>
            ))}
          </div>

          {/* Cut params */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✂ חיתוך</div>
            <div style={row}><span style={lbl}>מהירות (mm/min):</span><input type="number" value={feedRate} min={1} onChange={e=>setFeedRate(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>ירידה (mm/min):</span><input type="number" value={plungeRate} min={1} onChange={e=>setPlungeRate(+e.target.value)} style={inp('#ff9900')}/></div>
            <div style={row}><span style={lbl}>Z בטוח (mm):</span><input type="number" value={zSafe} step={0.5} onChange={e=>setZSafe(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>עומק חריטה (mm):</span><input type="number" value={zCut} step={0.1} onChange={e=>setZCut(+e.target.value)} style={inp('#ff5050')}/></div>
            <div style={row}><span style={lbl}>X מקור:</span><input type="number" value={ox} step={1} onChange={e=>setOx(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>Y מקור:</span><input type="number" value={oy} step={1} onChange={e=>setOy(+e.target.value)} style={inp()}/></div>
          </div>

          {/* Stats */}
          <div style={{...card,background:'rgba(0,229,255,0.04)',border:'1px solid rgba(0,229,255,0.12)'}}>
            <div style={{display:'flex',gap:20}}>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>קווים</div><div style={{fontSize:20,fontWeight:700,color:'#00e5ff'}}>{strokes.length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>אותיות</div><div style={{fontSize:20,fontWeight:700,color:'#c8d8f0'}}>{Array.from(text.replace(/\n/g,'')).length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>פונט</div><div style={{fontSize:14,fontWeight:700,color:'#a855f7'}}>{useTTF?ttfName.split('.')[0]:FONTS[fontKey]?.name}</div></div>
            </div>
          </div>

          {/* Export */}
          <div style={{marginBottom:8}}>
            <input value={fileName} onChange={e=>setFileName(e.target.value)} placeholder="שם קובץ"
              style={{width:'100%',background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'7px 10px',color:'#c8d8f0',fontSize:13,boxSizing:'border-box',fontFamily:'inherit',marginBottom:8}}/>
          </div>
          <button onClick={exportGcode} disabled={!strokes.length||ttfLoading}
            style={{width:'100%',padding:'12px',borderRadius:8,fontSize:14,cursor:'pointer',background:'linear-gradient(135deg,#a855f7,#6366f1)',border:'none',color:'#fff',fontFamily:'inherit',fontWeight:600,marginBottom:8,opacity:strokes.length?1:0.5}}>
            ⬇ {fileName}.gcode
          </button>
          <div style={{display:'flex',gap:8}}>
            <button onClick={exportSVG} disabled={!strokes.length}
              style={{flex:1,padding:'9px',borderRadius:8,fontSize:13,cursor:'pointer',background:'transparent',border:'1px solid #4a3a7a',color:'#a855f7',fontFamily:'inherit'}}>
              ⬇ {fileName}.svg
            </button>
            <input type="color" value={svgColor} onChange={e=>setSvgColor(e.target.value)}
              style={{width:38,height:38,borderRadius:6,border:'1px solid #1e3050',cursor:'pointer',padding:2,background:'transparent'}}/>
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'#ffffff',border:'1px solid #ddd',borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'9px 14px',borderBottom:'1px solid #eee',fontSize:12,color:'#666',display:'flex',gap:12,alignItems:'center',background:'#f8f8f8'}}>
              <span>תצוגה מקדימה</span>
              <span style={{color:'#a855f7',fontWeight:600}}>{useTTF?ttfName:FONTS[fontKey]?.name}</span>
              {ttfLoading&&<span style={{color:'#ff9900'}}>⚙ מעבד...</span>}
              <span style={{color:'#bbb',marginRight:'auto'}}>שחור = חיתוך | אדום = אוויר</span>
            </div>
            <canvas ref={canvasRef} style={{width:'100%',height:'480px',display:'block'}}/>
          </div>
          <div style={{background:'#0d1525',border:'1px solid #1a2540',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#3a5a7a',lineHeight:1.8}}>
            <span style={{color:'#4a6a8a',fontWeight:600}}>פונטים מובנים: </span>
            Sans · Italic · Bold · Gothic · Script — תמיכה מלאה בעברית ולטינית
            <span style={{color:'#4a6a8a',fontWeight:600,marginRight:8}}> | TTF/OTF: </span>
            כל פונט מהמחשב שלך
          </div>
        </div>
      </div>
    </div>
  );
}
