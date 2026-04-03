import { useState, useRef, useEffect } from "react";

// ============================================================
// HERSHEY FONT DATA — Single-line strokes for CNC
// Each char: [width, [[x1,y1,x2,y2], ...strokes]]
// Coordinates normalized: center=0, cap height ~21 units
// ============================================================

const HERSHEY = {
  // Space
  ' ': [16, []],

  // Latin uppercase
  'A': [18, [[0,0,9,21],[18,0,9,21],[4,7,14,7]]],
  'B': [16, [[0,0,0,21],[0,21,10,21],[10,21,13,18],[13,18,13,14],[13,14,10,11],[10,11,0,11],[0,11,11,11],[11,11,14,8],[14,8,14,3],[14,3,11,0],[11,0,0,0]]],
  'C': [15, [[14,3],[12,1],[10,0],[7,0],[5,1],[3,3],[2,5],[1,8],[1,13],[2,16],[3,18],[5,20],[7,21],[10,21],[12,20],[14,18]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'D': [16, [[0,0,0,21],[0,21,8,21],[8,21,11,20],[11,20,13,18],[13,18,14,16],[14,16,15,13],[15,13,15,8],[15,8,14,5],[14,5,13,3],[13,3,11,1],[11,1,8,0],[8,0,0,0]]],
  'E': [14, [[0,0,0,21],[0,21,13,21],[0,11,8,11],[0,0,13,0]]],
  'F': [13, [[0,0,0,21],[0,21,13,21],[0,11,8,11]]],
  'G': [16, [[14,18],[12,20],[10,21],[7,21],[5,20],[3,18],[2,16],[1,13],[1,8],[2,5],[3,3],[5,1],[7,0],[10,0],[12,1],[14,3],[14,8],[9,8]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'H': [17, [[0,0,0,21],[17,0,17,21],[0,11,17,11]]],
  'I': [4,  [[0,0,4,0],[2,0,2,21],[0,21,4,21]]],
  'J': [13, [[0,2],[1,0],[3,0],[5,1],[6,3],[6,21]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'K': [14, [[0,0,0,21],[14,21,0,7],[5,12,14,0]]],
  'L': [13, [[0,21,0,0],[0,0,13,0]]],
  'M': [18, [[0,0,0,21],[0,21,9,7],[9,7,18,21],[18,21,18,0]]],
  'N': [17, [[0,0,0,21],[0,21,17,0],[17,0,17,21]]],
  'O': [17, [[7,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[7,0],[10,0],[13,1],[15,3],[16,5],[17,8],[17,13],[16,16],[15,18],[13,20],[10,21],[7,21]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'P': [15, [[0,0,0,21],[0,21,10,21],[13,20,14,18],[14,18,14,14],[14,14,13,12],[13,12,10,11],[10,11,0,11]]],
  'Q': [17, [[7,21,4,20],[4,20,2,18],[2,18,1,16],[1,16,0,13],[0,13,0,8],[0,8,1,5],[1,5,2,3],[2,3,4,1],[4,1,7,0],[7,0,10,0],[10,0,13,1],[13,1,15,3],[15,3,16,5],[16,5,17,8],[17,8,17,13],[17,13,16,16],[16,16,15,18],[15,18,13,20],[13,20,10,21],[10,21,7,21],[11,6,17,0]]],
  'R': [15, [[0,0,0,21],[0,21,10,21],[13,20,14,18],[14,18,14,14],[14,14,13,12],[13,12,10,11],[10,11,0,11],[6,11,15,0]]],
  'S': [14, [[13,18],[11,20],[9,21],[6,21],[4,20],[2,18],[2,16],[3,14],[5,12],[10,10],[12,8],[13,6],[13,3],[11,1],[9,0],[6,0],[4,1],[2,3]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'T': [13, [[6,0,6,21],[0,21,13,21]]],
  'U': [17, [[0,21,0,5],[0,3],[1,1],[3,0],[6,0],[9,1],[10,3],[10,21]].reduce((a,p,i,arr)=>{ if(i===0)return[[arr[0][0],arr[0][1],arr[1][0],arr[1][1]]]; if(i>1)return[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]; return a;},[])],
  'V': [18, [[0,21,9,0],[18,21,9,0]]],
  'W': [22, [[2,21,7,0],[12,21,7,0],[12,21,17,0],[22,21,17,0]]],
  'X': [17, [[0,21,17,0],[17,21,0,0]]],
  'Y': [17, [[0,21,8,11],[8,11,8,0],[17,21,8,11]]],
  'Z': [17, [[0,21,17,21],[17,21,0,0],[0,0,17,0]]],

  // Latin lowercase
  'a': [14, [[10,14,10,0],[10,11],[8,13],[6,14],[4,14],[2,13],[1,11],[1,9],[2,7],[4,6],[6,6],[8,7],[10,9]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'b': [14, [[0,21,0,0],[0,11],[2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'c': [12, [[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'd': [14, [[11,21,11,0],[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'e': [13, [[0,9,12,9],[12,9],[12,11],[11,13],[9,14],[7,14],[5,13],[3,11],[1,9],[0,7],[0,5],[1,3],[3,2],[5,2],[7,3],[9,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'f': [8,  [[5,21],[3,21],[2,20],[1,18],[1,0],[4,14,8,14]]],
  'g': [14, [[11,14,11,-4],[11,-4],[9,-6],[7,-7],[5,-7],[3,-6],[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'h': [14, [[0,21,0,0],[0,10],[2,13],[4,14],[7,14],[9,13],[10,10],[10,0]]],
  'i': [4,  [[1,21,1,20],[1,20,2,20],[2,20,2,21],[2,21,1,21],[1,14,1,0]]],
  'j': [6,  [[2,21,2,20],[2,20,3,20],[3,20,3,21],[3,21,2,21],[3,14,3,-2],[3,-2,2,-4],[2,-4,0,-5]]],
  'k': [13, [[0,21,0,0],[0,6,10,14],[4,8,13,0]]],
  'l': [4,  [[0,21,0,0]]],
  'm': [20, [[0,14,0,0],[0,10],[2,13],[4,14],[7,14],[9,13],[10,10],[10,0],[10,10],[12,13],[14,14],[17,14],[19,13],[20,10],[20,0]]],
  'n': [14, [[0,14,0,0],[0,10],[2,13],[4,14],[7,14],[9,13],[10,10],[10,0]]],
  'o': [13, [[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5],[12,7],[12,9],[11,11],[9,13],[7,14],[5,14]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'p': [14, [[0,14,0,-7],[0,11],[2,13],[4,14],[6,14],[8,13],[10,11],[11,9],[11,7],[10,5],[8,3],[6,2],[4,2],[2,3],[0,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'q': [14, [[11,14,11,-7],[11,11],[9,13],[7,14],[5,14],[3,13],[1,11],[0,9],[0,7],[1,5],[3,3],[5,2],[7,2],[9,3],[11,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'r': [8,  [[0,14,0,0],[0,8],[1,11],[3,13],[5,14],[8,14]]],
  's': [11, [[10,11],[9,13],[7,14],[5,14],[3,13],[1,11],[1,9],[2,8],[5,7],[7,6],[9,5],[10,3],[10,2],[9,0],[7,-1],[5,-1],[3,0],[1,2]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  't': [8,  [[1,21,1,3],[1,3,2,1],[2,1,4,0],[4,0,6,0],[0,14,6,14]]],
  'u': [14, [[0,14,0,4],[0,2],[1,0],[3,0],[5,0],[7,1],[10,4],[10,14],[10,0]]],
  'v': [13, [[0,14,6,0],[13,14,6,0]]],
  'w': [18, [[0,14,4,0],[9,14,4,0],[9,14,14,0],[18,14,14,0]]],
  'x': [13, [[0,14,13,0],[13,14,0,0]]],
  'y': [13, [[0,14,6,0],[13,14,6,0],[6,0,5,-2],[5,-2,3,-4],[3,-4,1,-4],[1,-4,0,-3]]],
  'z': [12, [[0,14,12,14],[12,14,0,0],[0,0,12,0]]],

  // Digits
  '0': [14, [[6,21],[4,20],[2,18],[1,16],[0,13],[0,8],[1,5],[2,3],[4,1],[6,0],[8,0],[10,1],[12,3],[13,5],[14,8],[14,13],[13,16],[12,18],[10,20],[8,21],[6,21],[3,16,11,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '1': [10, [[3,17,6,21],[6,21,6,0]]],
  '2': [14, [[1,16],[2,14],[4,12],[8,10],[10,8],[11,5],[11,3],[10,1],[8,0],[5,0],[3,1],[1,3],[0,5],[0,6],[1,8],[3,10],[7,12],[10,15],[11,17],[11,19],[10,21],[8,21],[6,20],[5,19],[4,17]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '3': [14, [[1,20],[3,21],[6,21],[10,19],[11,17],[11,14],[9,11],[6,10],[9,9],[11,6],[11,3],[9,1],[7,0],[4,0],[2,1],[1,2]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '4': [14, [[9,21,9,0],[1,14,13,14],[1,14,9,21]]],
  '5': [14, [[12,20],[10,21],[5,21],[2,19],[1,17],[1,14],[2,12],[4,11],[7,11],[10,12],[12,14],[13,17],[13,19],[12,21],[10,21]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '6': [14, [[10,19],[8,21],[5,21],[3,20],[1,17],[0,13],[0,8],[1,4],[3,1],[6,0],[8,0],[11,1],[13,4],[13,6],[12,9],[10,11],[7,11],[4,10],[1,7]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '7': [14, [[0,21,14,21],[14,21,3,0]]],
  '8': [14, [[6,0],[3,1],[1,4],[1,6],[2,9],[5,11],[8,11],[11,9],[12,6],[12,4],[10,1],[8,0],[5,0],[3,1]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '9': [14, [[12,14],[10,12],[7,11],[5,11],[2,12],[0,14],[0,16],[1,19],[3,21],[6,21],[9,20],[11,17],[12,13],[12,8],[11,4],[9,1],[7,0],[4,0],[2,1]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],

  // Punctuation
  '.': [4,  [[1,1],[1,0],[2,0],[2,1],[1,1]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  ',': [4,  [[2,2],[2,1],[3,1],[3,2],[2,2],[1,0]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '!': [4,  [[1,21,1,7],[1,2],[1,1],[2,1],[2,2],[1,2]]],
  '?': [13, [[1,16],[2,14],[4,12],[8,10],[10,8],[11,5],[11,3],[10,1],[8,0],[5,0],[3,1],[2,2],[10,21],[12,19],[12,16],[10,14],[8,13]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '-': [13, [[1,10,12,10]]],
  '_': [13, [[0,-2,13,-2]]],
  '/': [13, [[0,0,13,21]]],
  '\\': [13,[[0,21,13,0]]],
  ':': [4,  [[1,12],[1,11],[2,11],[2,12],[1,12],[1,2],[1,1],[2,1],[2,2],[1,2]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  ';': [4,  [[1,12],[1,11],[2,11],[2,12],[1,12],[2,2],[2,1],[3,1],[3,2],[2,2],[1,0]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '(': [7,  [[5,25],[3,22],[1,18],[0,14],[0,8],[1,4],[3,0],[5,-3]]],
  ')': [7,  [[0,25],[2,22],[4,18],[5,14],[5,8],[4,4],[2,0],[0,-3]]],
  '+': [13, [[6,21,6,0],[1,10,12,10]]],
  '=': [13, [[1,13,12,13],[1,7,12,7]]],
  '@': [18, [[12,13],[11,15],[9,17],[7,18],[5,18],[3,17],[1,15],[0,13],[0,9],[1,7],[3,5],[5,4],[7,4],[9,5],[11,7],[12,9],[12,13],[12,17],[11,19],[9,20],[7,20],[5,19],[3,17]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '#': [13, [[3,21,3,-7],[10,21,10,-7],[0,14,13,14],[0,3,13,3]]],
  '%': [14, [[0,21,14,0],[3,21],[2,20],[2,18],[3,16],[5,16],[6,18],[6,20],[5,21],[3,21],[11,5],[10,4],[10,2],[11,0],[13,0],[14,2],[14,4],[13,5],[11,5]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '"': [8,  [[1,21,1,16],[6,21,6,16]]],
  "'": [4,  [[1,21,1,16]]],
  '<': [13, [[12,18,1,10],[1,10,12,2]]],
  '>': [13, [[1,18,12,10],[12,10,1,2]]],
  '[': [7,  [[2,25,2,-7],[2,25,5,25],[2,-7,5,-7]]],
  ']': [7,  [[5,25,5,-7],[2,25,5,25],[2,-7,5,-7]]],
  '{': [8,  [[5,25],[3,24],[2,23],[1,21],[1,19],[2,17],[3,16],[4,14],[4,12],[2,10],[3,8],[4,6],[4,4],[3,2],[2,1],[1,-1],[1,-3],[2,-5],[3,-6],[5,-7]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '}': [8,  [[3,25],[5,24],[6,23],[7,21],[7,19],[6,17],[5,16],[4,14],[4,12],[6,10],[4,8],[4,6],[5,4],[6,2],[7,1],[7,-1],[7,-3],[6,-5],[5,-6],[3,-7]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  '|': [4,  [[2,25,2,-7]]],
  '*': [10, [[5,21,5,9],[1,18,9,12],[9,18,1,12]]],
  '&': [16, [[13,14],[13,13],[12,11],[9,9],[5,9],[3,10],[1,12],[1,14],[2,16],[3,17],[11,20],[12,21],[12,23],[11,24],[9,24],[7,22],[6,19],[5,14],[4,8],[3,4],[2,1],[1,0]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],

  // Hebrew — single-line approximations
  'א': [16, [[1,0,8,14],[8,14,15,0],[8,14,8,7]]],
  'ב': [15, [[12,14,2,14],[2,14,0,12],[0,12,0,2],[0,2,12,2],[0,7,8,7]]],
  'ג': [13, [[11,14,2,14],[2,14,0,12],[0,12,0,0]]],
  'ד': [14, [[0,0,0,12],[0,12,2,14],[2,14,13,14],[13,14,13,0]]],
  'ה': [14, [[0,0,0,14],[0,14,13,14],[13,14,13,6],[6,14,6,0]]],
  'ו': [6,  [[3,14,3,0]]],
  'ז': [10, [[0,14,9,14],[9,14,6,0]]],
  'ח': [14, [[0,0,0,14],[14,0,14,14],[0,14,14,14]]],
  'ט': [14, [[0,0,0,14],[0,14,14,14],[14,14,14,0],[7,14,7,4]]],
  'י': [6,  [[5,14,3,12],[3,12,3,0]]],
  'כ': [13, [[12,14,2,14],[2,14,0,12],[0,12,0,2],[0,2,12,2]]],
  'ך': [13, [[12,14,2,14],[2,14,0,12],[0,12,0,-5]]],
  'ל': [12, [[10,14,2,14],[2,14,0,12],[0,12,0,6],[0,6,2,4],[2,4,10,4],[10,4,10,0]]],
  'מ': [14, [[0,0,0,14],[14,0,14,10],[14,10,7,14],[7,14,0,14],[7,14,7,0]]],
  'ם': [14, [[0,0,0,14],[14,0,14,14],[0,14,14,14],[0,0,6,0]]],
  'נ': [12, [[10,14,2,14],[2,14,0,12],[0,12,0,0],[0,14,10,0]]],
  'ן': [6,  [[3,14,3,-4]]],
  'ס': [14, [[7,14],[5,14],[3,13],[1,11],[0,9],[0,5],[1,3],[3,1],[5,0],[7,0],[9,1],[11,3],[12,5],[12,9],[11,11],[9,13],[7,14],[7,7,0,7]].reduce((a,p,i,arr)=>i>0?[...a,[arr[i-1][0],arr[i-1][1],p[0],p[1]]]:a,[])],
  'ע': [14, [[0,14,4,7],[4,7,7,0],[7,0,10,7],[10,7,14,14],[4,7,10,7]]],
  'פ': [13, [[12,14,3,14],[3,14,1,12],[1,12,1,8],[1,8,3,6],[3,6,8,6],[8,6,8,0],[0,0,8,0]]],
  'ף': [13, [[12,14,3,14],[3,14,1,12],[1,12,1,8],[1,8,3,6],[3,6,8,6],[8,6,8,-5]]],
  'צ': [14, [[0,0,4,14],[4,14,9,0],[9,0,13,14],[4,14,13,14]]],
  'ץ': [14, [[0,0,4,14],[4,14,9,0],[9,0,13,14],[4,14,13,14],[9,0,9,-5]]],
  'ק': [13, [[0,0,0,14],[0,14,12,14],[12,14,12,6]]],
  'ר': [12, [[0,0,0,12],[0,12,2,14],[2,14,11,14]]],
  'ש': [16, [[0,0,0,14],[0,14,8,14],[8,14,8,0],[8,14,16,0]]],
  'ת': [16, [[0,0,0,14],[0,14,16,14],[16,14,16,6],[8,14,8,0]]],
};

// ============================================================
// TEXT → STROKES
// ============================================================

function textToStrokes(text, fontSize, letterSpacing, lineHeight) {
  const scale = fontSize / 21;
  const lines = text.split('\n');
  const allStrokes = []; // [{x1,y1,x2,y2}]

  lines.forEach((line, lineIdx) => {
    let xOffset = 0;
    const yOffset = -lineIdx * lineHeight * scale;
    const chars = Array.from(line); // handles unicode

    chars.forEach(ch => {
      const def = HERSHEY[ch] || HERSHEY[' '];
      const [charWidth, strokes] = def;

      strokes.forEach(([x1,y1,x2,y2]) => {
        allStrokes.push({
          x1: xOffset + x1 * scale,
          y1: yOffset + y1 * scale,
          x2: xOffset + x2 * scale,
          y2: yOffset + y2 * scale,
        });
      });

      xOffset += (charWidth + letterSpacing) * scale;
    });
  });

  return allStrokes;
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

function strokesToGcode(strokes, params) {
  const { feedRate, plungeRate, zSafe, zCut, originX, originY } = params;
  let g = `; Single-Line Text G-code\n; CNC Vector Optimizer\nG21\nG90\nG0 Z${zSafe}\n`;
  let cx = null, cy = null;

  for (const s of strokes) {
    const x1 = s.x1 + originX, y1 = s.y1 + originY;
    const x2 = s.x2 + originX, y2 = s.y2 + originY;
    const needsTravel = cx === null ||
      Math.hypot(cx - x1, cy - y1) > 0.1;
    if (needsTravel) {
      g += `G0 Z${zSafe}\n`;
      g += `G0 X${x1.toFixed(3)} Y${y1.toFixed(3)}\n`;
      g += `G1 Z${zCut.toFixed(3)} F${plungeRate}\n`;
    }
    g += `G1 X${x2.toFixed(3)} Y${y2.toFixed(3)} F${feedRate}\n`;
    cx = x2; cy = y2;
  }
  g += `G0 Z${zSafe}\nM2\n`;
  return g;
}

function strokesToSVG(strokes, params) {
  const { fontSize, color } = params;
  if (!strokes.length) return '';
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for (const s of strokes) {
    minX=Math.min(minX,s.x1,s.x2); minY=Math.min(minY,s.y1,s.y2);
    maxX=Math.max(maxX,s.x1,s.x2); maxY=Math.max(maxY,s.y1,s.y2);
  }
  const pad = fontSize;
  const W = maxX - minX + pad*2, H = maxY - minY + pad*2;
  const lines = strokes.map(s =>
    `<line x1="${(s.x1-minX+pad).toFixed(2)}" y1="${(-(s.y1)+maxY+pad).toFixed(2)}" x2="${(s.x2-minX+pad).toFixed(2)}" y2="${(-(s.y2)+maxY+pad).toFixed(2)}" stroke="${color}" stroke-width="1" stroke-linecap="round"/>`
  ).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}" height="${H.toFixed(1)}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}">
  ${lines}
</svg>`;
}

// ============================================================
// CANVAS PREVIEW
// ============================================================

function drawPreview(canvas, strokes, params) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#090d18'; ctx.fillRect(0,0,W,H);
  if (!strokes.length) return;

  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for (const s of strokes) {
    minX=Math.min(minX,s.x1,s.x2); minY=Math.min(minY,s.y1,s.y2);
    maxX=Math.max(maxX,s.x1,s.x2); maxY=Math.max(maxY,s.y1,s.y2);
  }

  const pad = 30;
  const bw = maxX-minX||1, bh = maxY-minY||1;
  const scale = Math.min((W-pad*2)/bw, (H-pad*2)/bh);
  const ox = pad + (W-pad*2-bw*scale)/2;
  const oy = pad + (H-pad*2-bh*scale)/2;
  const tx = x => ox + (x-minX)*scale;
  const ty = y => H - oy - (y-minY)*scale;

  // Draw travel moves
  let prev = null;
  for (const s of strokes) {
    if (prev && Math.hypot(prev.x2-s.x1, prev.y2-s.y1) > 0.1) {
      ctx.strokeStyle='rgba(255,80,80,0.3)'; ctx.lineWidth=0.8; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(tx(prev.x2),ty(prev.y2)); ctx.lineTo(tx(s.x1),ty(s.y1)); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle='#00e5ff'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(tx(s.x1),ty(s.y1)); ctx.lineTo(tx(s.x2),ty(s.y2)); ctx.stroke();
    prev = s;
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TextToGcode() {
  const [text, setText] = useState('Hello\nשלום');
  const [fontSize, setFontSize] = useState(10);
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [lineHeight, setLineHeight] = useState(30);
  const [feedRate, setFeedRate] = useState(800);
  const [plungeRate, setPlungeRate] = useState(200);
  const [zSafe, setZSafe] = useState(5);
  const [zCut, setZCut] = useState(-0.3);
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);
  const [svgColor, setSvgColor] = useState('#000000');
  const [fileName, setFileName] = useState('text');

  const previewCanvas = useRef(null);

  const strokes = textToStrokes(text, fontSize, letterSpacing, lineHeight);

  useEffect(() => {
    drawPreview(previewCanvas.current, strokes, {});
  }, [strokes]);

  const exportGcode = () => {
    const content = strokesToGcode(strokes, { feedRate, plungeRate, zSafe, zCut, originX, originY });
    const url = URL.createObjectURL(new Blob([content],{type:'text/plain'}));
    const a = document.createElement('a'); a.href=url; a.download=`${fileName}.gcode`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    const content = strokesToSVG(strokes, { fontSize, color: svgColor });
    const url = URL.createObjectURL(new Blob([content],{type:'image/svg+xml'}));
    const a = document.createElement('a'); a.href=url; a.download=`${fileName}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const card = {background:'#0d1525',border:'1px solid #1e2d4a',borderRadius:10,padding:'14px 16px',marginBottom:12};
  const row = {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8};
  const lbl = {fontSize:13,color:'#6a8aaa'};
  const inp = (c='#00e5ff') => ({width:72,background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'4px 8px',color:c,fontSize:13,textAlign:'center'});

  const knownChars = Array.from(text).filter(c=>c!=='\n'&&c!==' ');
  const unknownChars = [...new Set(knownChars.filter(c=>!HERSHEY[c]))];

  return (
    <div dir="rtl" style={{minHeight:'100vh',background:'#0a0e1a',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'15px',color:'#c8d8f0'}}>

      {/* Header */}
      <div style={{borderBottom:'1px solid #1e2d4a',background:'linear-gradient(180deg,#0d1525,#0a0e1a)',padding:'18px 32px',display:'flex',alignItems:'center',gap:16}}>
        <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,#a855f7,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>T</div>
        <div>
          <div style={{fontSize:19,fontWeight:700,color:'#e8f4ff'}}>TEXT → G-CODE</div>
          <div style={{fontSize:12,color:'#4a6a8a',marginTop:2}}>טקסט לקו בודד — Hershey Single-Line Font</div>
        </div>
      </div>

      <div style={{padding:'20px 28px',maxWidth:1300,margin:'0 auto',display:'grid',gridTemplateColumns:'300px 1fr',gap:20}}>

        {/* LEFT */}
        <div>
          {/* Text input */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✏ טקסט</div>
            <textarea
              value={text}
              onChange={e=>setText(e.target.value)}
              rows={5}
              style={{width:'100%',background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'8px',color:'#e8f4ff',fontSize:14,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',lineHeight:1.6}}
              placeholder="הכנס טקסט כאן...&#10;Enter text here..."
              dir="auto"
            />
            {unknownChars.length>0&&(
              <div style={{marginTop:8,fontSize:11,color:'#ff9900',background:'rgba(255,153,0,0.08)',borderRadius:6,padding:'6px 8px'}}>
                ⚠ תווים לא נתמכים: {unknownChars.map(c=>`"${c}"`).join(', ')}
              </div>
            )}
          </div>

          {/* Typography */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>🔤 טיפוגרפיה</div>
            <div style={row}><span style={lbl}>גודל אות (mm):</span><input type="number" value={fontSize} min={1} max={200} step={0.5} onChange={e=>setFontSize(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>רווח בין אותיות:</span><input type="number" value={letterSpacing} min={0} max={50} step={0.5} onChange={e=>setLetterSpacing(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>גובה שורה:</span><input type="number" value={lineHeight} min={10} max={200} step={1} onChange={e=>setLineHeight(+e.target.value)} style={inp()}/></div>
          </div>

          {/* Cut params */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>✂ פרמטרי חיתוך</div>
            <div style={row}><span style={lbl}>מהירות (mm/min):</span><input type="number" value={feedRate} min={1} onChange={e=>setFeedRate(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>ירידה (mm/min):</span><input type="number" value={plungeRate} min={1} onChange={e=>setPlungeRate(+e.target.value)} style={inp('#ff9900')}/></div>
            <div style={row}><span style={lbl}>Z בטוח (mm):</span><input type="number" value={zSafe} step={0.5} onChange={e=>setZSafe(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>עומק חריטה (mm):</span><input type="number" value={zCut} step={0.1} onChange={e=>setZCut(+e.target.value)} style={inp('#ff5050')}/></div>
          </div>

          {/* Origin */}
          <div style={card}>
            <div style={{fontSize:12,color:'#4a6a8a',fontWeight:600,marginBottom:8}}>📍 נקודת התחלה</div>
            <div style={row}><span style={lbl}>X (mm):</span><input type="number" value={originX} step={1} onChange={e=>setOriginX(+e.target.value)} style={inp()}/></div>
            <div style={row}><span style={lbl}>Y (mm):</span><input type="number" value={originY} step={1} onChange={e=>setOriginY(+e.target.value)} style={inp()}/></div>
          </div>

          {/* Stats */}
          <div style={{...card,background:'rgba(0,229,255,0.04)',border:'1px solid rgba(0,229,255,0.12)'}}>
            <div style={{display:'flex',gap:16}}>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>קווים</div><div style={{fontSize:20,fontWeight:700,color:'#00e5ff'}}>{strokes.length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>אותיות</div><div style={{fontSize:20,fontWeight:700,color:'#c8d8f0'}}>{Array.from(text.replace(/\n/g,'')).length}</div></div>
              <div><div style={{fontSize:11,color:'#3a5a7a'}}>שורות</div><div style={{fontSize:20,fontWeight:700,color:'#c8d8f0'}}>{text.split('\n').length}</div></div>
            </div>
          </div>

          {/* Export */}
          <div style={{marginBottom:8}}>
            <input value={fileName} onChange={e=>setFileName(e.target.value)}
              style={{width:'100%',background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'7px 10px',color:'#c8d8f0',fontSize:13,boxSizing:'border-box',marginBottom:8}}
              placeholder="שם קובץ"/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={exportGcode} disabled={!strokes.length}
              style={{padding:'12px',borderRadius:8,fontSize:14,cursor:'pointer',background:'linear-gradient(135deg,#a855f7,#6366f1)',border:'none',color:'#fff',fontFamily:'inherit',fontWeight:600}}>
              ⬇ ייצוא {fileName}.gcode
            </button>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={exportSVG} disabled={!strokes.length}
                style={{flex:1,padding:'10px',borderRadius:8,fontSize:13,cursor:'pointer',background:'transparent',border:'1px solid #4a3a7a',color:'#a855f7',fontFamily:'inherit',fontWeight:500}}>
                ⬇ ייצוא {fileName}.svg
              </button>
              <input type="color" value={svgColor} onChange={e=>setSvgColor(e.target.value)}
                style={{width:36,height:36,borderRadius:6,border:'1px solid #1e3050',cursor:'pointer',background:'transparent',padding:2}}/>
            </div>
          </div>
        </div>

        {/* RIGHT — preview */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:'#090d18',border:'1px solid #1a2540',borderRadius:10,overflow:'hidden',flex:1}}>
            <div style={{padding:'10px 16px',borderBottom:'1px solid #1a2540',fontSize:12,color:'#3a5a7a',display:'flex',gap:12,alignItems:'center'}}>
              <span>תצוגה מקדימה — קו בודד</span>
              <span style={{fontSize:11,color:'#2a4060'}}>כחול = חיתוך | אדום = תנועת אוויר</span>
            </div>
            <canvas ref={previewCanvas} width={900} height={520} style={{width:'100%',display:'block'}}/>
          </div>

          {/* Supported chars info */}
          <div style={{background:'#0d1525',border:'1px solid #1a2540',borderRadius:10,padding:'12px 16px',fontSize:12,color:'#3a5a7a',lineHeight:1.8}}>
            <span style={{color:'#4a6a8a',fontWeight:600}}>תווים נתמכים: </span>
            A-Z · a-z · 0-9 · עברית (א-ת) · סימני פיסוק בסיסיים
          </div>
        </div>
      </div>
    </div>
  );
}
