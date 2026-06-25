// LOVES calculator — the "1998 terminal" version.
// This is the spiritual port of the Pascal program I wrote at 15.
// Run: node loves.js "Drake" "Rihanna"

function lovesSteps(nameA, nameB) {
  const line = (nameA + 'LOVES' + nameB).toUpperCase();
  const letters = ['L', 'O', 'V', 'E', 'S'];

  // Step 1: count each letter of L-O-V-E-S across the whole line.
  let seq = letters.map(
    (ch) => [...line].filter((c) => c === ch).length
  );

  // Step 2: keep summing adjacent pairs until a single number remains.
  const steps = [seq];
  while (seq.length > 1) {
    const next = [];
    for (let i = 0; i < seq.length - 1; i++) {
      next.push(seq[i] + seq[i + 1]);
    }
    seq = next;
    steps.push(seq);
  }
  return steps;
}

const verdictFor = (n) =>
  n > 45 ? 'A match made in heaven' :
  n >= 35 ? "Ooh, there's potential" :
  n >= 25 ? "It's... complicated" :
            'Friendzone, sorry';

const [, , a = 'Drake', b = 'Rihanna'] = process.argv;
const steps = lovesSteps(a, b);

// Render each number centred in a fixed-width cell, and indent each row by
// half a cell so the rows funnel inward — an inverted triangle, like the web version.
const CELL = 6;
const center = (s, w) => {
  s = String(s);
  const pad = Math.max(0, w - s.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + s + ' '.repeat(pad - left);
};

const header = a.toUpperCase() + '  LOVES  ' + b.toUpperCase();
const triWidth = steps[0].length * CELL;          // width of the widest (first) row
const width = Math.max(triWidth, header.length);
const baseIndent = Math.floor((width - triWidth) / 2);  // centre the whole triangle
const rowToLine = (row, i) =>
  ' '.repeat(baseIndent + i * (CELL / 2)) + row.map((n) => center(n, CELL)).join('');

console.log('');
console.log(center(header, width));
console.log(center('-'.repeat(width), width));
steps.forEach((row, i) => console.log(rowToLine(row, i)));
const result = steps[steps.length - 1][0] % 100;
console.log(center('-'.repeat(width), width));
console.log(center(result + '% compatible', width));
console.log(center(verdictFor(result), width));
console.log('');
