// ============================================================
// SHARED OPTIMIZATION ENGINE
// Used by both CNCOptimizer and ImageToGcode
// ============================================================

export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function removeDuplicates(segs, tol = 0.05) {
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

export function buildChains(segs, tol = 0.1) {
  const remaining = segs.map((s, i) => ({ ...s, id: i, used: false }));
  const chains = [];

  while (remaining.some(s => !s.used)) {
    const startIdx = remaining.findIndex(s => !s.used);
    remaining[startIdx].used = true;
    const chain = [remaining[startIdx]];
    let headX = remaining[startIdx].x1, headY = remaining[startIdx].y1;
    let tailX = remaining[startIdx].x2, tailY = remaining[startIdx].y2;

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
          const fl = { ...s, x1:s.x2, y1:s.y2, x2:s.x1, y2:s.y1 };
          chain.push(fl); tailX = fl.x2; tailY = fl.y2; extended = true; break;
        }
      }
    }
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
          const fl = { ...s, x1:s.x2, y1:s.y2, x2:s.x1, y2:s.y1 };
          chain.unshift(fl); headX = fl.x1; headY = fl.y1; extended = true; break;
        }
      }
    }
    chains.push(chain);
  }
  return chains;
}

export function sortChainsByNearestNeighbor(chains) {
  if (!chains.length) return chains;
  const remaining = [...chains];
  const sorted = [remaining.splice(0, 1)[0]];
  let cx = sorted[0][sorted[0].length-1].x2;
  let cy = sorted[0][sorted[0].length-1].y2;

  while (remaining.length) {
    let bestIdx=0, bestDist=Infinity, bestFlip=false;
    for (let i=0; i<remaining.length; i++) {
      const c = remaining[i];
      const d1 = dist(cx, cy, c[0].x1, c[0].y1);
      const d2 = dist(cx, cy, c[c.length-1].x2, c[c.length-1].y2);
      if (d1 < bestDist) { bestDist=d1; bestIdx=i; bestFlip=false; }
      if (d2 < bestDist) { bestDist=d2; bestIdx=i; bestFlip=true; }
    }
    let chain = remaining.splice(bestIdx, 1)[0];
    if (bestFlip) chain = chain.reverse().map(s=>({...s,x1:s.x2,y1:s.y2,x2:s.x1,y2:s.y1}));
    sorted.push(chain);
    cx = chain[chain.length-1].x2;
    cy = chain[chain.length-1].y2;
  }
  return sorted;
}

export function optimizeSegments(segs) {
  let cuts = segs.filter(s => s.type === 'cut');
  cuts = removeDuplicates(cuts);
  const chains = buildChains(cuts, 0.1);
  return sortChainsByNearestNeighbor(chains).flat();
}

// Convert array of [x,y] point-paths to segments format
export function pathsToSegments(paths, feedRate) {
  const segs = [];
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      segs.push({
        x1: path[i-1][0], y1: path[i-1][1],
        x2: path[i][0],   y2: path[i][1],
        type: 'cut',
        feedRate
      });
    }
  }
  return segs;
}

// Convert segments back to point-paths (for rendering)
export function segmentsToPaths(segs) {
  if (!segs.length) return [];
  const paths = [];
  let current = [[segs[0].x1, segs[0].y1], [segs[0].x2, segs[0].y2]];
  for (let i = 1; i < segs.length; i++) {
    const prev = segs[i-1], s = segs[i];
    if (dist(prev.x2, prev.y2, s.x1, s.y1) < 0.15) {
      current.push([s.x2, s.y2]);
    } else {
      paths.push(current);
      current = [[s.x1, s.y1], [s.x2, s.y2]];
    }
  }
  paths.push(current);
  return paths;
}

export function getTravelSegments(segs) {
  const travels = [];
  for (let i = 1; i < segs.length; i++) {
    const d = dist(segs[i-1].x2, segs[i-1].y2, segs[i].x1, segs[i].y1);
    if (d > 0.1) travels.push({ x1:segs[i-1].x2, y1:segs[i-1].y2, x2:segs[i].x1, y2:segs[i].y1, type:'travel' });
  }
  return travels;
}

export function computeOptStats(before, after) {
  const countLifts = segs => getTravelSegments(segs.filter(s=>s.type==='cut')).length;
  const totalLen = segs => segs.filter(s=>s.type==='cut').reduce((a,s)=>a+dist(s.x1,s.y1,s.x2,s.y2),0);
  const travelLen = segs => getTravelSegments(segs.filter(s=>s.type==='cut')).reduce((a,s)=>a+dist(s.x1,s.y1,s.x2,s.y2),0);
  return {
    beforeLifts: countLifts(before),
    afterLifts: countLifts(after),
    beforeTravel: travelLen(before),
    afterTravel: travelLen(after),
    beforeLen: totalLen(before),
    afterLen: totalLen(after),
  };
}