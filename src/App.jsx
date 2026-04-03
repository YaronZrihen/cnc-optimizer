import { useState, useRef, useEffect, useCallback } from "react";
import ImageToGcode from "./ImageToGcode";
import TextToGcode from "./TextToGcode";

// ============================================================
// UTILITIES
// ============================================================

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '0ש"';
  if (seconds < 60) return `${Math.round(seconds)}ש"`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}ד' ${Math.round(seconds % 60)}ש"`;
  return `${Math.floor(seconds / 3600)}ש' ${Math.floor((seconds % 3600) / 60)}ד'`;
}

function applyTransform(x, y, matrix) {
  if (!matrix) return [x, y];
  const [a, b, c, d, e, f] = matrix;
  return [a * x + c * y + e, b * x + d * y + f];
}

function parseTransformAttr(str) {
  if (!str) return null;
  const mat = str.match(/matrix\(([^)]+)\)/);
  if (mat) return mat[1].split(/[\s,]+/).map(Number);
  const tr = str.match(/translate\(([^)]+)\)/);
  if (tr) { const p = tr[1].split(/[\s,]+/).map(Number); return [1, 0, 0, 1, p[0] || 0, p[1] || 0]; }
  const sc = str.match(/scale\(([^)]+)\)/);
  if (sc) { const p = sc[1].split(/[\s,]+/).map(Number); return [p[0], 0, 0, p[1] || p[0], 0, 0]; }
  return null;
}

// ============================================================
// BEZIER / ARC SAMPLING
// ============================================================

function sampleCubicBezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2, steps = 12) {
  const segs = []; let px = x1, py = y1;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, mt = 1 - t;
    const nx = mt**3*x1 + 3*mt**2*t*cx1 + 3*mt*t**2*cx2 + t**3*x2;
    const ny = mt**3*y1 + 3*mt**2*t*cy1 + 3*mt*t**2*cy2 + t**3*y2;
    segs.push({ x1: px, y1: py, x2: nx, y2: ny, type: 'cut' });
    px = nx; py = ny;
  }
  return segs;
}

function sampleQuadBezier(x1, y1, cx, cy, x2, y2, steps = 10) {
  const segs = []; let px = x1, py = y1;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, mt = 1 - t;
    const nx = mt**2*x1 + 2*mt*t*cx + t**2*x2;
    const ny = mt**2*y1 + 2*mt*t*cy + t**2*y2;
    segs.push({ x1: px, y1: py, x2: nx, y2: ny, type: 'cut' });
    px = nx; py = ny;
  }
  return segs;
}

function sampleArc(cx, cy, rx, ry, startAngle, endAngle, steps = 16) {
  const segs = [];
  if (Math.abs(endAngle - startAngle) < 0.001) return segs;
  let px = cx + rx * Math.cos(startAngle);
  let py = cy + ry * Math.sin(startAngle);
  for (let i = 1; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps);
    const nx = cx + rx * Math.cos(angle);
    const ny = cy + ry * Math.sin(angle);
    segs.push({ x1: px, y1: py, x2: nx, y2: ny, type: 'cut' });
    px = nx; py = ny;
  }
  return segs;
}

function svgArcToCenter(x1, y1, rx, ry, xRot, largeArc, sweep, x2, y2) {
  const phi = (xRot * Math.PI) / 180;
  const cphi = Math.cos(phi), sphi = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cphi * dx + sphi * dy, y1p = -sphi * dx + cphi * dy;
  const num = Math.max(0, rx**2*ry**2 - rx**2*y1p**2 - ry**2*x1p**2);
  const den = rx**2*y1p**2 + ry**2*x1p**2;
  const sq = den === 0 ? 0 : Math.sqrt(num / den);
  const sign = largeArc === sweep ? -1 : 1;
  const cxp = sign * sq * rx * y1p / ry, cyp = -sign * sq * ry * x1p / rx;
  const cxx = cphi*cxp - sphi*cyp + (x1+x2)/2;
  const cyy = sphi*cxp + cphi*cyp + (y1+y2)/2;
  const ux = (x1p-cxp)/rx, uy = (y1p-cyp)/ry;
  const vx = (-x1p-cxp)/rx, vy = (-y1p-cyp)/ry;
  let startAngle = Math.atan2(uy, ux);
  let dAngle = Math.atan2(vy, vx) - startAngle;
  if (sweep === 0 && dAngle > 0) dAngle -= 2 * Math.PI;
  if (sweep === 1 && dAngle < 0) dAngle += 2 * Math.PI;
  return { cx: cxx, cy: cyy, startAngle, endAngle: startAngle + dAngle };
}

// ============================================================
// SVG PARSER — Y axis NOT flipped here (done after parsing)
// ============================================================

function parseSVGPath(d, transform) {
  const segments = [];
  const cmds = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  let cx = 0, cy = 0, startX = 0, startY = 0;

  const push = (x1, y1, x2, y2) => {
    const [ax1, ay1] = applyTransform(x1, y1, transform);
    const [ax2, ay2] = applyTransform(x2, y2, transform);
    if (isFinite(ax1) && isFinite(ay1) && isFinite(ax2) && isFinite(ay2))
      segments.push({ x1: ax1, y1: ay1, x2: ax2, y2: ay2, type: 'cut' });
  };
  const pushSegs = (segs) => segs.forEach(s => push(s.x1, s.y1, s.x2, s.y2));

  for (const cmd of cmds) {
    const type = cmd[0];
    const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    switch (type) {
      case 'M': cx=args[0];cy=args[1];startX=cx;startY=cy; for(let i=2;i<args.length;i+=2){push(cx,cy,args[i],args[i+1]);cx=args[i];cy=args[i+1];} break;
      case 'm': cx+=args[0];cy+=args[1];startX=cx;startY=cy; for(let i=2;i<args.length;i+=2){push(cx,cy,cx+args[i],cy+args[i+1]);cx+=args[i];cy+=args[i+1];} break;
      case 'L': for(let i=0;i<args.length;i+=2){push(cx,cy,args[i],args[i+1]);cx=args[i];cy=args[i+1];} break;
      case 'l': for(let i=0;i<args.length;i+=2){push(cx,cy,cx+args[i],cy+args[i+1]);cx+=args[i];cy+=args[i+1];} break;
      case 'H': args.forEach(x=>{push(cx,cy,x,cy);cx=x;}); break;
      case 'h': args.forEach(dx=>{push(cx,cy,cx+dx,cy);cx+=dx;}); break;
      case 'V': args.forEach(y=>{push(cx,cy,cx,y);cy=y;}); break;
      case 'v': args.forEach(dy=>{push(cx,cy,cx,cy+dy);cy+=dy;}); break;
      case 'Z': case 'z': push(cx,cy,startX,startY);cx=startX;cy=startY; break;
      case 'C': for(let i=0;i<args.length;i+=6){pushSegs(sampleCubicBezier(cx,cy,args[i],args[i+1],args[i+2],args[i+3],args[i+4],args[i+5]));cx=args[i+4];cy=args[i+5];} break;
      case 'c': for(let i=0;i<args.length;i+=6){pushSegs(sampleCubicBezier(cx,cy,cx+args[i],cy+args[i+1],cx+args[i+2],cy+args[i+3],cx+args[i+4],cy+args[i+5]));cx+=args[i+4];cy+=args[i+5];} break;
      case 'S': for(let i=0;i<args.length;i+=4){pushSegs(sampleCubicBezier(cx,cy,cx,cy,args[i],args[i+1],args[i+2],args[i+3]));cx=args[i+2];cy=args[i+3];} break;
      case 's': for(let i=0;i<args.length;i+=4){pushSegs(sampleCubicBezier(cx,cy,cx,cy,cx+args[i],cy+args[i+1],cx+args[i+2],cy+args[i+3]));cx+=args[i+2];cy+=args[i+3];} break;
      case 'Q': for(let i=0;i<args.length;i+=4){pushSegs(sampleQuadBezier(cx,cy,args[i],args[i+1],args[i+2],args[i+3]));cx=args[i+2];cy=args[i+3];} break;
      case 'q': for(let i=0;i<args.length;i+=4){pushSegs(sampleQuadBezier(cx,cy,cx+args[i],cy+args[i+1],cx+args[i+2],cy+args[i+3]));cx+=args[i+2];cy+=args[i+3];} break;
      case 'A': for(let i=0;i<args.length;i+=7){try{const arc=svgArcToCenter(cx,cy,Math.abs(args[i]),Math.abs(args[i+1]),args[i+2],args[i+3],args[i+4],args[i+5],args[i+6]);pushSegs(sampleArc(arc.cx,arc.cy,Math.abs(args[i]),Math.abs(args[i+1]),arc.startAngle,arc.endAngle));}catch(e){}cx=args[i+5];cy=args[i+6];} break;
      case 'a': for(let i=0;i<args.length;i+=7){try{const arc=svgArcToCenter(cx,cy,Math.abs(args[i]),Math.abs(args[i+1]),args[i+2],args[i+3],args[i+4],cx+args[i+5],cy+args[i+6]);pushSegs(sampleArc(arc.cx,arc.cy,Math.abs(args[i]),Math.abs(args[i+1]),arc.startAngle,arc.endAngle));}catch(e){}cx+=args[i+5];cy+=args[i+6];} break;
    }
  }
  return segments;
}

function parseSVG(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');
  const segments = [];

  // Detect SVG height for Y-flip
  const svgEl = doc.querySelector('svg');
  let svgHeight = 0;
  if (svgEl) {
    const vb = svgEl.getAttribute('viewBox');
    if (vb) { const p = vb.split(/[\s,]+/).map(Number); svgHeight = p[3] || 0; }
    if (!svgHeight) svgHeight = parseFloat(svgEl.getAttribute('height')) || 0;
  }

  const getTransform = (el) => {
    let node = el;
    while (node && node.getAttribute) {
      const t = node.getAttribute('transform');
      if (t) { const m = parseTransformAttr(t); if (m) return m; }
      node = node.parentNode;
    }
    return null;
  };

  doc.querySelectorAll('path').forEach(el => {
    const d = el.getAttribute('d') || '';
    if (d) segments.push(...parseSVGPath(d, getTransform(el)));
  });
  doc.querySelectorAll('line').forEach(el => {
    const tr = getTransform(el);
    const [ax1,ay1] = applyTransform(+el.getAttribute('x1')||0, +el.getAttribute('y1')||0, tr);
    const [ax2,ay2] = applyTransform(+el.getAttribute('x2')||0, +el.getAttribute('y2')||0, tr);
    segments.push({ x1:ax1, y1:ay1, x2:ax2, y2:ay2, type:'cut' });
  });
  doc.querySelectorAll('rect').forEach(el => {
    const x=+el.getAttribute('x')||0, y=+el.getAttribute('y')||0;
    const w=+el.getAttribute('width')||0, h=+el.getAttribute('height')||0;
    const rx=+el.getAttribute('rx')||0, tr=getTransform(el);
    const d = rx===0
      ? `M${x},${y} H${x+w} V${y+h} H${x} Z`
      : `M${x+rx},${y} H${x+w-rx} A${rx},${rx} 0 0 1 ${x+w},${y+rx} V${y+h-rx} A${rx},${rx} 0 0 1 ${x+w-rx},${y+h} H${x+rx} A${rx},${rx} 0 0 1 ${x},${y+h-rx} V${y+rx} A${rx},${rx} 0 0 1 ${x+rx},${y} Z`;
    segments.push(...parseSVGPath(d, tr));
  });
  doc.querySelectorAll('circle').forEach(el => {
    const cx=+el.getAttribute('cx')||0, cy=+el.getAttribute('cy')||0, r=+el.getAttribute('r')||0;
    const tr=getTransform(el);
    sampleArc(cx,cy,r,r,0,2*Math.PI).forEach(s=>{
      const [ax1,ay1]=applyTransform(s.x1,s.y1,tr); const [ax2,ay2]=applyTransform(s.x2,s.y2,tr);
      segments.push({x1:ax1,y1:ay1,x2:ax2,y2:ay2,type:'cut'});
    });
  });
  doc.querySelectorAll('ellipse').forEach(el => {
    const cx=+el.getAttribute('cx')||0, cy=+el.getAttribute('cy')||0;
    const rx=+el.getAttribute('rx')||0, ry=+el.getAttribute('ry')||0, tr=getTransform(el);
    sampleArc(cx,cy,rx,ry,0,2*Math.PI).forEach(s=>{
      const [ax1,ay1]=applyTransform(s.x1,s.y1,tr); const [ax2,ay2]=applyTransform(s.x2,s.y2,tr);
      segments.push({x1:ax1,y1:ay1,x2:ax2,y2:ay2,type:'cut'});
    });
  });
  doc.querySelectorAll('polyline,polygon').forEach(el => {
    const pts=(el.getAttribute('points')||'').trim().split(/[\s,]+/).map(Number).filter(n=>!isNaN(n));
    const tr=getTransform(el);
    for(let i=0;i<pts.length-3;i+=2){
      const [ax1,ay1]=applyTransform(pts[i],pts[i+1],tr);
      const [ax2,ay2]=applyTransform(pts[i+2],pts[i+3],tr);
      segments.push({x1:ax1,y1:ay1,x2:ax2,y2:ay2,type:'cut'});
    }
    if(el.tagName==='polygon'&&pts.length>=4){
      const [ax1,ay1]=applyTransform(pts[pts.length-2],pts[pts.length-1],tr);
      const [ax2,ay2]=applyTransform(pts[0],pts[1],tr);
      segments.push({x1:ax1,y1:ay1,x2:ax2,y2:ay2,type:'cut'});
    }
  });

  // Y-FLIP: SVG Y goes down, CNC Y goes up
  if (svgHeight > 0) {
    return segments.map(s => ({
      ...s,
      y1: svgHeight - s.y1,
      y2: svgHeight - s.y2,
    }));
  }
  // Fallback: flip around bounding box center
  const maxY = segments.reduce((m, s) => Math.max(m, s.y1, s.y2), -Infinity);
  return segments.map(s => ({ ...s, y1: maxY - s.y1, y2: maxY - s.y2 }));
}

// ============================================================
// DXF PARSER — CNC native coordinates (no flip needed)
// ============================================================

function parseDXF(content) {
  const segments = [];
  const lines = content.split('\n').map(l => l.trim());

  const readVals = (start) => {
    const v = {};
    for (let i = start; i < Math.min(start + 100, lines.length - 1); i += 2) {
      const code = parseInt(lines[i]);
      if (!isNaN(code)) v[code] = lines[i + 1];
    }
    return v;
  };

  let i = 0;
  while (i < lines.length) {
    const entity = lines[i];
    if (entity === 'LINE') {
      const v = readVals(i+1);
      const x1=parseFloat(v[10])||0,y1=parseFloat(v[20])||0,x2=parseFloat(v[11])||0,y2=parseFloat(v[21])||0;
      if (dist(x1,y1,x2,y2) > 0.001) segments.push({x1,y1,x2,y2,type:'cut'});
    }
    if (entity === 'ARC') {
      const v = readVals(i+1);
      const cx=parseFloat(v[10])||0,cy=parseFloat(v[20])||0,r=parseFloat(v[40])||1;
      let sa=(parseFloat(v[50])||0)*Math.PI/180;
      let ea=(parseFloat(v[51])||360)*Math.PI/180;
      if (ea <= sa) ea += 2*Math.PI;
      segments.push(...sampleArc(cx,cy,r,r,sa,ea));
    }
    if (entity === 'CIRCLE') {
      const v = readVals(i+1);
      segments.push(...sampleArc(parseFloat(v[10])||0,parseFloat(v[20])||0,parseFloat(v[40])||1,parseFloat(v[40])||1,0,2*Math.PI));
    }
    if (entity === 'LWPOLYLINE') {
      const pts = [];
      for (let j=i+1; j<Math.min(i+600,lines.length-1); j+=2) {
        const code=parseInt(lines[j]);
        if (code===10) pts.push([parseFloat(lines[j+1]),0]);
        if (code===20&&pts.length>0) pts[pts.length-1][1]=parseFloat(lines[j+1]);
        if (code===0&&j>i+2) break;
      }
      for (let k=0;k<pts.length-1;k++)
        segments.push({x1:pts[k][0],y1:pts[k][1],x2:pts[k+1][0],y2:pts[k+1][1],type:'cut'});
    }
    if (entity === 'SPLINE') {
      const cps = [];
      for (let j=i+1;j<Math.min(i+400,lines.length-1);j+=2) {
        const code=parseInt(lines[j]);
        if (code===10) cps.push([parseFloat(lines[j+1]),0]);
        if (code===20&&cps.length>0) cps[cps.length-1][1]=parseFloat(lines[j+1]);
        if (code===0&&j>i+2) break;
      }
      for (let k=0;k+3<cps.length;k+=3)
        segments.push(...sampleCubicBezier(cps[k][0],cps[k][1],cps[k+1][0],cps[k+1][1],cps[k+2][0],cps[k+2][1],cps[k+3][0],cps[k+3][1]));
    }
    i++;
  }
  return segments;
}

// ============================================================
// G-CODE PARSER
// ============================================================

function parseGcode(content) {
  const segments = [];
  let cx=0, cy=0, feedRate=1000;
  for (const line of content.split('\n')) {
    const t = line.trim().toUpperCase().replace(/;.*$/,'').replace(/\(.*?\)/g,'');
    if (!t) continue;
    const fM=t.match(/F([\d.]+)/); if(fM) feedRate=parseFloat(fM[1]);
    const xM=t.match(/X([-\d.]+)/), yM=t.match(/Y([-\d.]+)/);
    const isG0=/G0\b|G00\b/.test(t), isG1=/G1\b|G01\b/.test(t);
    const isG2=/G2\b|G02\b/.test(t), isG3=/G3\b|G03\b/.test(t);
    if ((isG0||isG1||isG2||isG3)&&(xM||yM)) {
      const nx=xM?parseFloat(xM[1]):cx, ny=yM?parseFloat(yM[1]):cy;
      if (isG2||isG3) {
        const I=parseFloat((t.match(/I([-\d.]+)/)||[,0])[1]);
        const J=parseFloat((t.match(/J([-\d.]+)/)||[,0])[1]);
        const acx=cx+I, acy=cy+J, r=dist(cx,cy,acx,acy);
        let sa=Math.atan2(cy-acy,cx-acx), ea=Math.atan2(ny-acy,nx-acx);
        if(isG2&&ea>sa) ea-=2*Math.PI;
        if(isG3&&ea<sa) ea+=2*Math.PI;
        sampleArc(acx,acy,r,r,sa,ea).forEach(s=>segments.push({...s,type:'cut',feedRate}));
      } else {
        segments.push({x1:cx,y1:cy,x2:nx,y2:ny,type:isG0?'travel':'cut',feedRate});
      }
      cx=nx; cy=ny;
    }
  }
  return segments;
}

// ============================================================
// EPS / AI PARSER
// ============================================================

function parseEPS(content) {
  const segments = [];
  const text = content.replace(/^%!.*$/m,'').replace(/%[^\n]*/g,' ');
  const tokens = text.split(/\s+/).filter(Boolean);
  let stack=[], cx=0, cy=0, startX=0, startY=0;
  for (const t of tokens) {
    const n=parseFloat(t);
    if (!isNaN(n)&&t!=='') { stack.push(n); continue; }
    switch(t) {
      case 'moveto': case 'm': if(stack.length>=2){cy=stack.pop();cx=stack.pop();startX=cx;startY=cy;} break;
      case 'rmoveto': if(stack.length>=2){cy+=stack.pop();cx+=stack.pop();startX=cx;startY=cy;} break;
      case 'lineto': case 'l': if(stack.length>=2){const ny=stack.pop(),nx=stack.pop();segments.push({x1:cx,y1:cy,x2:nx,y2:ny,type:'cut'});cx=nx;cy=ny;} break;
      case 'rlineto': if(stack.length>=2){const dy=stack.pop(),dx=stack.pop();segments.push({x1:cx,y1:cy,x2:cx+dx,y2:cy+dy,type:'cut'});cx+=dx;cy+=dy;} break;
      case 'curveto': case 'c': if(stack.length>=6){const y3=stack.pop(),x3=stack.pop(),y2=stack.pop(),x2=stack.pop(),y1=stack.pop(),x1=stack.pop();segments.push(...sampleCubicBezier(cx,cy,x1,y1,x2,y2,x3,y3));cx=x3;cy=y3;} break;
      case 'rcurveto': if(stack.length>=6){const dy3=stack.pop(),dx3=stack.pop(),dy2=stack.pop(),dx2=stack.pop(),dy1=stack.pop(),dx1=stack.pop();segments.push(...sampleCubicBezier(cx,cy,cx+dx1,cy+dy1,cx+dx2,cy+dy2,cx+dx3,cy+dy3));cx+=dx3;cy+=dy3;} break;
      case 'closepath': case 'cp': segments.push({x1:cx,y1:cy,x2:startX,y2:startY,type:'cut'});cx=startX;cy=startY; break;
      case 'arc': if(stack.length>=5){const ea=stack.pop()*Math.PI/180,sa=stack.pop()*Math.PI/180,r=stack.pop(),ay=stack.pop(),ax=stack.pop();const end=ea<sa?ea+2*Math.PI:ea;const s=sampleArc(ax,ay,r,r,sa,end);segments.push(...s);if(s.length){cx=s[s.length-1].x2;cy=s[s.length-1].y2;}} break;
      case 'arcn': if(stack.length>=5){const ea=stack.pop()*Math.PI/180,sa=stack.pop()*Math.PI/180,r=stack.pop(),ay=stack.pop(),ax=stack.pop();const end=ea>sa?ea-2*Math.PI:ea;const s=sampleArc(ax,ay,r,r,sa,end);segments.push(...s);if(s.length){cx=s[s.length-1].x2;cy=s[s.length-1].y2;}} break;
      default: if(isNaN(n)) stack=[]; break;
    }
  }
  // EPS Y is already CNC-style (Y up) — no flip needed
  return segments;
}

// ============================================================
// PLT / HPGL PARSER
// ============================================================

function parsePLT(content) {
  const segments = [];
  let cx=0, cy=0, penDown=false;
  const scale=0.025;
  for (const cmd of content.toUpperCase().split(';')) {
    const t=cmd.trim(); if(!t) continue;
    if(t.startsWith('PU')){penDown=false;const c=t.slice(2).split(',').map(Number).filter(n=>!isNaN(n));if(c.length>=2){cx=c[0]*scale;cy=c[1]*scale;}}
    else if(t.startsWith('PD')){penDown=true;const c=t.slice(2).split(',').map(Number).filter(n=>!isNaN(n));for(let i=0;i<c.length-1;i+=2){const nx=c[i]*scale,ny=c[i+1]*scale;segments.push({x1:cx,y1:cy,x2:nx,y2:ny,type:'cut'});cx=nx;cy=ny;}}
    else if(t.startsWith('PA')||t.startsWith('PR')){const rel=t.startsWith('PR');const c=t.slice(2).split(',').map(Number).filter(n=>!isNaN(n));for(let i=0;i<c.length-1;i+=2){const nx=rel?cx+c[i]*scale:c[i]*scale,ny=rel?cy+c[i+1]*scale:c[i+1]*scale;if(penDown)segments.push({x1:cx,y1:cy,x2:nx,y2:ny,type:'cut'});cx=nx;cy=ny;}}
    else if(t.startsWith('CI')){const r=parseFloat(t.slice(2))*scale;if(!isNaN(r))segments.push(...sampleArc(cx,cy,r,r,0,2*Math.PI));}
  }
  return segments;
}

// ============================================================
// CHAIN LINKING — continuous cutting without unnecessary lifts
// Connects segments that share endpoints into chains,
// then sorts chains by nearest-neighbor for minimum travel.
// ============================================================

function buildChains(segs, tol = 0.1) {
  // Build adjacency: find segments that connect end-to-start
  const remaining = segs.map((s, i) => ({ ...s, id: i, used: false }));
  const chains = [];

  while (remaining.some(s => !s.used)) {
    // Start a new chain with the first unused segment
    const startIdx = remaining.findIndex(s => !s.used);
    remaining[startIdx].used = true;
    const chain = [remaining[startIdx]];
    let headX = remaining[startIdx].x1, headY = remaining[startIdx].y1;
    let tailX = remaining[startIdx].x2, tailY = remaining[startIdx].y2;

    // Extend chain forward from tail
    let extended = true;
    while (extended) {
      extended = false;
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].used) continue;
        const s = remaining[i];
        if (dist(tailX, tailY, s.x1, s.y1) < tol) {
          remaining[i].used = true; chain.push(s);
          tailX = s.x2; tailY = s.y2; extended = true; break;
        }
        if (dist(tailX, tailY, s.x2, s.y2) < tol) {
          remaining[i].used = true;
          const flipped = { ...s, x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1 };
          chain.push(flipped);
          tailX = flipped.x2; tailY = flipped.y2; extended = true; break;
        }
      }
    }

    // Extend chain backward from head
    extended = true;
    while (extended) {
      extended = false;
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].used) continue;
        const s = remaining[i];
        if (dist(headX, headY, s.x2, s.y2) < tol) {
          remaining[i].used = true; chain.unshift(s);
          headX = s.x1; headY = s.y1; extended = true; break;
        }
        if (dist(headX, headY, s.x1, s.y1) < tol) {
          remaining[i].used = true;
          const flipped = { ...s, x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1 };
          chain.unshift(flipped);
          headX = flipped.x1; headY = flipped.y1; extended = true; break;
        }
      }
    }

    chains.push(chain);
  }
  return chains;
}

function sortChainsByNearestNeighbor(chains) {
  if (!chains.length) return chains;
  const remaining = [...chains];
  const sorted = [remaining.splice(0, 1)[0]];
  let cx = sorted[0][sorted[0].length - 1].x2;
  let cy = sorted[0][sorted[0].length - 1].y2;

  while (remaining.length) {
    let bestIdx = 0, bestDist = Infinity, bestFlip = false;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const d1 = dist(cx, cy, c[0].x1, c[0].y1);
      const d2 = dist(cx, cy, c[c.length-1].x2, c[c.length-1].y2);
      if (d1 < bestDist) { bestDist = d1; bestIdx = i; bestFlip = false; }
      if (d2 < bestDist) { bestDist = d2; bestIdx = i; bestFlip = true; }
    }
    let chain = remaining.splice(bestIdx, 1)[0];
    if (bestFlip) {
      chain = chain.reverse().map(s => ({ ...s, x1: s.x2, y1: s.y2, x2: s.x1, y2: s.y1 }));
    }
    sorted.push(chain);
    cx = chain[chain.length-1].x2;
    cy = chain[chain.length-1].y2;
  }
  return sorted;
}

function removeDuplicates(segs, tol = 0.05) {
  const unique = [];
  for (const s of segs) {
    if (dist(s.x1,s.y1,s.x2,s.y2) < 0.001) continue;
    const isDup = unique.some(u =>
      (dist(u.x1,u.y1,s.x1,s.y1)<tol && dist(u.x2,u.y2,s.x2,s.y2)<tol) ||
      (dist(u.x1,u.y1,s.x2,s.y2)<tol && dist(u.x2,u.y2,s.x1,s.y1)<tol)
    );
    if (!isDup) unique.push(s);
  }
  return unique;
}

function optimizeSegments(segs) {
  let cuts = segs.filter(s => s.type === 'cut');
  cuts = removeDuplicates(cuts);
  // Build continuous chains, then sort chains
  const chains = buildChains(cuts, 0.1);
  const sortedChains = sortChainsByNearestNeighbor(chains);
  return sortedChains.flat();
}

// ============================================================
// STATS
// ============================================================

function getTravelSegments(segs) {
  const travels = [];
  for (let i = 1; i < segs.length; i++) {
    const d = dist(segs[i-1].x2, segs[i-1].y2, segs[i].x1, segs[i].y1);
    if (d > 0.1) travels.push({ x1:segs[i-1].x2, y1:segs[i-1].y2, x2:segs[i].x1, y2:segs[i].y1, type:'travel' });
  }
  return travels;
}

function computeStats(segs, cutSpeed=1000, travelSpeed=3000) {
  const cuts = segs.filter(s => s.type === 'cut');
  const travels = getTravelSegments(cuts);
  const cutLen = cuts.reduce((a,s)=>a+dist(s.x1,s.y1,s.x2,s.y2),0);
  const travLen = travels.reduce((a,s)=>a+dist(s.x1,s.y1,s.x2,s.y2),0);
  let cutTime=0;
  for (const s of cuts) { const spd=s.feedRate||cutSpeed; cutTime+=(dist(s.x1,s.y1,s.x2,s.y2)/spd)*60; }
  const travTime=(travLen/travelSpeed)*60;
  // Count lifts (travel moves > 0.1mm)
  const liftCount = travels.length;
  // Sharp turns
  let sharpTurns=0;
  for(let i=1;i<cuts.length-1;i++){
    const dx1=cuts[i].x2-cuts[i].x1,dy1=cuts[i].y2-cuts[i].y1;
    const dx2=cuts[i+1].x2-cuts[i+1].x1,dy2=cuts[i+1].y2-cuts[i+1].y1;
    const d1=Math.sqrt(dx1**2+dy1**2),d2=Math.sqrt(dx2**2+dy2**2);
    if(d1>0&&d2>0){const dot=(dx1*dx2+dy1*dy2)/(d1*d2);if(Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI>100)sharpTurns++;}
  }
  return { cutLen, travLen, sharpTurns, segCount:cuts.length, travCount:travels.length, cutTime, travTime, totalTime:cutTime+travTime, liftCount };
}

function getBounds(segs) {
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const s of segs){minX=Math.min(minX,s.x1,s.x2);minY=Math.min(minY,s.y1,s.y2);maxX=Math.max(maxX,s.x1,s.x2);maxY=Math.max(maxY,s.y1,s.y2);}
  if(!isFinite(minX)) return {minX:0,minY:0,maxX:100,maxY:100};
  return {minX,minY,maxX,maxY};
}

// ============================================================
// CANVAS RENDERER
// ============================================================

function renderCanvas(canvas, segs, showTravel, bounds) {
  if (!canvas||!segs.length) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const pad=36;
  const bw=bounds.maxX-bounds.minX||1, bh=bounds.maxY-bounds.minY||1;
  const scale=Math.min((W-pad*2)/bw,(H-pad*2)/bh);
  const offX=pad+(W-pad*2-bw*scale)/2;
  const offY=pad+(H-pad*2-bh*scale)/2;
  const tx=x=>offX+(x-bounds.minX)*scale;
  const ty=y=>H-offY-(y-bounds.minY)*scale; // Y up

  const cuts=segs.filter(s=>s.type==='cut');
  const travels=getTravelSegments(cuts);

  if(showTravel&&travels.length){
    ctx.strokeStyle='rgba(255,80,80,0.5)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
    for(const s of travels){ctx.beginPath();ctx.moveTo(tx(s.x1),ty(s.y1));ctx.lineTo(tx(s.x2),ty(s.y2));ctx.stroke();}
    ctx.setLineDash([]);
  }
  ctx.strokeStyle='#00e5ff';ctx.lineWidth=1.2;
  for(const s of cuts){ctx.beginPath();ctx.moveTo(tx(s.x1),ty(s.y1));ctx.lineTo(tx(s.x2),ty(s.y2));ctx.stroke();}
}

// ============================================================
// APP SHELL
// ============================================================

export default function App() {
  const [appTab, setAppTab] = useState('optimizer');
  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a' }}>
      <div style={{ background: '#060a14', borderBottom: '1px solid #1a2540', padding: '0 32px', display: 'flex' }}>
        {[['optimizer','⚙ אופטימיזציית וקטור'],['image','🖼 תמונה → G-code'],['text','T טקסט → G-code']].map(([tab, label]) => (
          <button key={tab} onClick={() => setAppTab(tab)} style={{
            padding: '14px 24px', fontSize: 14, cursor: 'pointer', border: 'none',
            borderBottom: appTab === tab ? '2px solid #00e5ff' : '2px solid transparent',
            background: 'transparent', color: appTab === tab ? '#00e5ff' : '#4a6a8a',
            fontFamily: "'Segoe UI',Arial,sans-serif", transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>
      {appTab === 'optimizer' ? <CNCOptimizer /> : appTab === 'image' ? <ImageToGcode /> : <TextToGcode />}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

function CNCOptimizer() {
  const [original, setOriginal] = useState([]);
  const [optimized, setOptimized] = useState([]);
  const [fileName, setFileName] = useState('');
  const [showTravel, setShowTravel] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState('compare');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [cutSpeed, setCutSpeed] = useState(1000);
  const [travelSpeed, setTravelSpeed] = useState(3000);
  const [flipY, setFlipY] = useState(false); // manual Y-flip toggle

  const origCanvas=useRef(null), optCanvas=useRef(null), fileInput=useRef(null);

  // Apply manual flip on top of parsed segments
  const displayOriginal = flipY ? original.map(s=>({...s,y1:-s.y1,y2:-s.y2})) : original;
  const displayOptimized = flipY ? optimized.map(s=>({...s,y1:-s.y1,y2:-s.y2})) : optimized;

  const origStats = displayOriginal.length ? computeStats(displayOriginal, cutSpeed, travelSpeed) : null;
  const optStats = displayOptimized.length ? computeStats(displayOptimized, cutSpeed, travelSpeed) : null;
  const bounds = displayOriginal.length ? getBounds([...displayOriginal,...displayOptimized]) : {minX:0,minY:0,maxX:100,maxY:100};

  useEffect(()=>{ if(displayOriginal.length) renderCanvas(origCanvas.current,displayOriginal,showTravel,bounds); },[displayOriginal,showTravel,bounds]);
  useEffect(()=>{ if(displayOptimized.length) renderCanvas(optCanvas.current,displayOptimized,showTravel,bounds); },[displayOptimized,showTravel,bounds]);

  const processFile = useCallback((file) => {
    setError(''); setIsProcessing(true);
    const reader=new FileReader();
    reader.onload=(e)=>{
      try {
        const content=e.target.result;
        const ext=file.name.split('.').pop().toLowerCase();
        let segs=[];
        if(ext==='svg') segs=parseSVG(content);
        else if(ext==='dxf') segs=parseDXF(content);
        else if(['gcode','nc','g','tap','cnc'].includes(ext)) segs=parseGcode(content);
        else if(['eps','ai'].includes(ext)) segs=parseEPS(content);
        else if(['plt','hpgl'].includes(ext)) segs=parsePLT(content);
        else { setError(`פורמט לא נתמך: .${ext}`); setIsProcessing(false); return; }

        const valid=segs.filter(s=>isFinite(s.x1)&&isFinite(s.y1)&&isFinite(s.x2)&&isFinite(s.y2));
        if(!valid.length){ setError('לא נמצאו נתיבי חיתוך תקינים בקובץ.'); setIsProcessing(false); return; }

        setFileName(file.name);
        setOriginal(valid);
        setOptimized(optimizeSegments(valid));
        setActiveTab('compare');
        setFlipY(false);
      } catch(err) {
        setError('שגיאה בעיבוד: '+err.message);
        console.error(err);
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop=useCallback((e)=>{
    e.preventDefault();setIsDragging(false);
    if(e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  },[processFile]);

  // שם קובץ ללא סיומת
  const baseName = fileName.replace(/\.[^.]+$/, '');

  const segsToGcode=(segs, comment)=>{
    let g=`; ${comment}\n; Generated by CNC Vector Optimizer\nG21\nG90\nG0 Z5\n`;
    let cx=0,cy=0;
    for(const s of segs){
      if(dist(cx,cy,s.x1,s.y1)>0.1){
        g+=`G0 X${s.x1.toFixed(3)} Y${s.y1.toFixed(3)}\nG0 Z0\n`;
      }
      g+=`G1 X${s.x2.toFixed(3)} Y${s.y2.toFixed(3)} F${cutSpeed}\n`;
      cx=s.x2;cy=s.y2;
    }
    g+='G0 Z5\nM2\n';
    return g;
  };

  const downloadFile=(content, name)=>{
    const url=URL.createObjectURL(new Blob([content],{type:'text/plain'}));
    const a=document.createElement('a');a.href=url;a.download=name;a.click();
    URL.revokeObjectURL(url);
  };

  // ייצוא קובץ מקורי כ-G-code (ללא אופטימיזציה)
  const exportOriginalGcode=()=>{
    if(!displayOriginal.length) return;
    const cuts=displayOriginal.filter(s=>s.type==='cut');
    downloadFile(segsToGcode(cuts,`מקורי — ${fileName}`), `${baseName}.gcode`);
  };

  // ייצוא קובץ מאופטם עם סיומת -OPT
  const exportGcode=()=>{
    if(!displayOptimized.length) return;
    downloadFile(segsToGcode(displayOptimized,`מאופטם — ${fileName}`), `${baseName}-OPT.gcode`);
  };

  const timeSaved=origStats&&optStats?origStats.totalTime-optStats.totalTime:0;
  const timePct=origStats&&origStats.totalTime>0?((timeSaved/origStats.totalTime)*100).toFixed(1):0;
  const travSaved=origStats&&optStats?origStats.travLen-optStats.travLen:0;
  const travPct=origStats&&origStats.travLen>0?((travSaved/origStats.travLen)*100).toFixed(1):0;
  const liftsSaved=origStats&&optStats?origStats.liftCount-optStats.liftCount:0;

  const card={background:'#0d1525',border:'1px solid #1e2d4a',borderRadius:10,padding:'16px 18px'};
  const lbl={fontSize:13,color:'#3a5a7a'};
  const big=(c)=>({fontSize:26,fontWeight:700,color:c});
  const sub={fontSize:12,color:'#3a5a7a',marginTop:4};

  return (
    <div dir="rtl" style={{minHeight:'100vh',background:'#0a0e1a',fontFamily:"'Segoe UI',Arial,sans-serif",fontSize:'16px',color:'#c8d8f0'}}>

      {/* Header */}
      <div style={{borderBottom:'1px solid #1e2d4a',background:'linear-gradient(180deg,#0d1525,#0a0e1a)',padding:'20px 32px',display:'flex',alignItems:'center',gap:'16px'}}>
        <div style={{width:42,height:42,borderRadius:8,background:'linear-gradient(135deg,#00e5ff,#0070ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>⚙</div>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:'#e8f4ff'}}>CNC VECTOR OPTIMIZER</div>
          <div style={{fontSize:13,color:'#4a6a8a',marginTop:2}}>מנוע אופטימיזציה למסלולי חיתוך רצופים</div>
        </div>
        {fileName&&<div style={{marginRight:'auto',background:'#111e33',border:'1px solid #1e3050',borderRadius:6,padding:'7px 16px',fontSize:14,color:'#5a8ab0'}}>📄 {fileName}</div>}
      </div>

      <div style={{padding:'28px 32px',maxWidth:1300,margin:'0 auto'}}>

        {/* Settings Bar */}
        <div style={{...card,marginBottom:20,display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:14,color:'#4a6a8a',fontWeight:600}}>⚙ הגדרות:</span>
          {[
            {label:'מהירות חיתוך (mm/min)',val:cutSpeed,set:setCutSpeed,color:'#00e5ff'},
            {label:'מהירות אוויר (mm/min)',val:travelSpeed,set:setTravelSpeed,color:'#ff9900'},
          ].map(({label,val,set,color},i)=>(
            <label key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:14}}>
              <span style={{color:'#6a8aaa'}}>{label}:</span>
              <input type="number" value={val} min={1} max={100000} onChange={e=>set(+e.target.value)}
                style={{width:90,background:'#0a0e1a',border:'1px solid #1e3050',borderRadius:6,padding:'5px 10px',color,fontSize:14,textAlign:'center'}}/>
            </label>
          ))}
          {original.length>0&&(
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:14,color:'#ff9900',marginRight:'auto',background:'rgba(255,153,0,0.08)',border:'1px solid rgba(255,153,0,0.2)',borderRadius:6,padding:'6px 14px'}}>
              <input type="checkbox" checked={flipY} onChange={e=>setFlipY(e.target.checked)} style={{accentColor:'#ff9900'}}/>
              היפוך ציר Y ידני
            </label>
          )}
        </div>

        {/* Upload */}
        {!original.length&&(
          <div onDragOver={e=>{e.preventDefault();setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)}
            onDrop={handleDrop} onClick={()=>fileInput.current?.click()}
            style={{border:`2px dashed ${isDragging?'#00e5ff':'#1e3050'}`,borderRadius:12,padding:'72px 32px',textAlign:'center',cursor:'pointer',background:isDragging?'rgba(0,229,255,0.04)':'rgba(13,21,37,0.6)',transition:'all 0.2s',marginBottom:24}}>
            <div style={{fontSize:52,marginBottom:18}}>📂</div>
            <div style={{fontSize:18,color:'#8ab0d0',marginBottom:10}}>גרור קובץ לכאן או לחץ לבחירה</div>
            <div style={{fontSize:14,color:'#3a5470'}}>SVG · DXF · G-code (.gcode .nc .g .tap) · EPS · AI · PLT/HPGL</div>
            <input ref={fileInput} type="file" accept=".svg,.dxf,.gcode,.nc,.g,.tap,.cnc,.eps,.ai,.plt,.hpgl"
              onChange={e=>{if(e.target.files[0])processFile(e.target.files[0])}} style={{display:'none'}}/>
          </div>
        )}

        {isProcessing&&<div style={{textAlign:'center',padding:40,color:'#00e5ff',fontSize:17}}><div style={{fontSize:28,marginBottom:10}}>⚙</div>מעבד ומייעל מסלולים...</div>}
        {error&&<div style={{background:'rgba(255,60,60,0.1)',border:'1px solid #ff3c3c44',borderRadius:8,padding:'14px 18px',marginBottom:18,color:'#ff8080',fontSize:15}}>⚠ {error}</div>}

        {/* Stats */}
        {origStats&&optStats&&(
          <>
            {/* Time row */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}>
              {[
                {label:'זמן לפני',value:formatTime(origStats.totalTime),sub:`חיתוך: ${formatTime(origStats.cutTime)} | אוויר: ${formatTime(origStats.travTime)}`,color:'#ff9900',icon:'⏱'},
                {label:'זמן אחרי',value:formatTime(optStats.totalTime),sub:`חיתוך: ${formatTime(optStats.cutTime)} | אוויר: ${formatTime(optStats.travTime)}`,color:'#00e5ff',icon:'⏱'},
                {label:'חיסכון בזמן',value:formatTime(timeSaved),sub:`${timePct}% שיפור`,color:timeSaved>0?'#00ff88':'#c8d8f0',icon:'🚀'},
              ].map((s,i)=>(
                <div key={i} style={card}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{fontSize:18}}>{s.icon}</span><span style={lbl}>{s.label}</span></div>
                  <div style={big(s.color)}>{s.value}</div>
                  <div style={sub}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Detail row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
              {[
                {label:'הרמות כלי חסכו',value:liftsSaved,sub:`${optStats.liftCount} הרמות נותרו`,good:liftsSaved>0,icon:'⬆'},
                {label:'תנועות אוויר חסכו',value:travSaved>0?`-${travSaved.toFixed(1)}mm`:'0mm',sub:`${travPct}% שיפור`,good:travSaved>0,icon:'✈'},
                {label:'כפילויות הוסרו',value:origStats.segCount-optStats.segCount,sub:'קטעים כפולים',good:origStats.segCount>optStats.segCount,icon:'🔗'},
                {label:'שרשראות רציפות',value:optStats.liftCount+1,sub:`${optStats.segCount} מקטעים`,good:false,icon:'🔄'},
              ].map((s,i)=>(
                <div key={i} style={card}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{fontSize:18}}>{s.icon}</span><span style={lbl}>{s.label}</span></div>
                  <div style={big(s.good?'#00e5ff':'#c8d8f0')}>{s.value}</div>
                  <div style={sub}>{s.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Viewer */}
        {original.length>0&&(
          <>
            <div style={{display:'flex',gap:8,marginBottom:18,alignItems:'center'}}>
              <div style={{display:'flex',gap:6}}>
                {[['before','לפני'],['after','אחרי'],['compare','השוואה']].map(([tab,label])=>(
                  <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:'8px 20px',borderRadius:6,fontSize:14,cursor:'pointer',border:activeTab===tab?'1px solid #00e5ff':'1px solid #1e3050',background:activeTab===tab?'rgba(0,229,255,0.1)':'transparent',color:activeTab===tab?'#00e5ff':'#4a6a8a',transition:'all 0.15s'}}>
                    {label}
                  </button>
                ))}
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginRight:'auto',fontSize:14,color:'#4a6a8a'}}>
                <input type="checkbox" checked={showTravel} onChange={e=>setShowTravel(e.target.checked)} style={{accentColor:'#ff5050'}}/>
                הצג תנועות אוויר (אדום)
              </label>
            </div>

            <div style={{display:'grid',gridTemplateColumns:activeTab==='compare'?'1fr 1fr':'1fr',gap:18,marginBottom:28}}>
              {(activeTab==='before'||activeTab==='compare')&&(
                <div style={{background:'#090d18',border:'1px solid #1a2540',borderRadius:10,overflow:'hidden'}}>
                  <div style={{padding:'12px 18px',borderBottom:'1px solid #1a2540',fontSize:13,color:'#3a5a7a',display:'flex',alignItems:'center',gap:12}}>
                    <span>● לפני</span>
                    {origStats&&<span style={{color:'#ff9900'}}>⏱ {formatTime(origStats.totalTime)}</span>}
                    {origStats&&<span style={{color:'#ff5050'}}>⬆ {origStats.liftCount} הרמות</span>}
                  </div>
                  <canvas ref={origCanvas} width={580} height={420} style={{width:'100%',display:'block'}}/>
                </div>
              )}
              {(activeTab==='after'||activeTab==='compare')&&(
                <div style={{background:'#090d18',border:'1px solid #1a2540',borderRadius:10,overflow:'hidden'}}>
                  <div style={{padding:'12px 18px',borderBottom:'1px solid #1a2540',fontSize:13,color:'#3a5a7a',display:'flex',alignItems:'center',gap:12}}>
                    <span>● אחרי</span>
                    {optStats&&<span style={{color:'#00e5ff'}}>⏱ {formatTime(optStats.totalTime)}</span>}
                    {optStats&&<span style={{color:'#00ff88'}}>⬆ {optStats.liftCount} הרמות</span>}
                  </div>
                  <canvas ref={optCanvas} width={580} height={420} style={{width:'100%',display:'block'}}/>
                </div>
              )}
            </div>

            <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:32}}>
              <button onClick={exportGcode} style={{padding:'13px 28px',borderRadius:8,fontSize:15,cursor:'pointer',background:'linear-gradient(135deg,#00b4d8,#0077b6)',border:'none',color:'#fff',fontFamily:'inherit',fontWeight:600}}>
                ⬇ שמור {baseName}-OPT.gcode
              </button>
              <button onClick={exportOriginalGcode} style={{padding:'13px 28px',borderRadius:8,fontSize:15,cursor:'pointer',background:'transparent',border:'1px solid #1e5070',color:'#4a8aaa',fontFamily:'inherit',fontWeight:500}}>
                ⬇ שמור {baseName}.gcode (מקורי)
              </button>
              <button onClick={()=>{setOriginal([]);setOptimized([]);setFileName('');setError('');}} style={{padding:'13px 28px',borderRadius:8,fontSize:15,cursor:'pointer',background:'transparent',border:'1px solid #1e3050',color:'#4a6a8a',fontFamily:'inherit'}}>
                ✕ נקה וטען קובץ חדש
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{padding:'18px 22px',background:'#0d1525',border:'1px solid #1a2540',borderRadius:10,fontSize:13,color:'#3a5a7a',lineHeight:2}}>
          <div style={{color:'#4a6a8a',marginBottom:6,fontWeight:700,fontSize:14}}>אלגוריתמי אופטימיזציה</div>
          <div>🔗 Chain Linking — מחבר קצוות צמודים לשרשראות חיתוך רציפות (ללא הרמת כלי)</div>
          <div>⚡ Nearest Neighbor — מסדר שרשראות לפי קרבה גיאוגרפית למינימום אוויר</div>
          <div>↩ Segment Reversal — הופך כיוון מקטעים לחיבור רציף מקסימלי</div>
          <div>🔄 Duplicate Removal — מסיר קווים כפולים (סף 0.05mm)</div>
          <div>📐 Y-Flip Auto-Detect — מתקן ציר Y אוטומטית ל-SVG (היפוך ידני זמין)</div>
        </div>

      </div>
    </div>
  );
}
