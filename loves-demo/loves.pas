program Loves;

{ The LOVES love-calculator, the way 15-year-old me would have written it.
  Turbo Pascal 7 / DOSBox. Compile, run, then type two names.
  Same algorithm as loves.js: count L O V E S, sum adjacent pairs to one number. }

uses Crt;

var
  nameA, nameB, line, header, rowStr : string;
  letters : array[1..5] of char;
  steps : array[1..5, 1..5] of integer;
  stepLen : array[1..5] of integer;
  i, j, finalVal, triWidth, width, baseIndent : integer;

function Repeated(c : char; n : integer) : string;
var
  s : string;
  k : integer;
begin
  s := '';
  for k := 1 to n do
    s := s + c;
  Repeated := s;
end;

function Centre(s : string; w : integer) : string;
var
  total, left : integer;
begin
  total := w - Length(s);
  if total < 0 then
    total := 0;
  left := total div 2;
  Centre := Repeated(' ', left) + s + Repeated(' ', total - left);
end;

function IntStr(n : integer) : string;
var
  s : string;
begin
  Str(n, s);
  IntStr := s;
end;

function CountChar(s : string; c : char) : integer;
var
  idx, cnt : integer;
begin
  cnt := 0;
  for idx := 1 to Length(s) do
    if UpCase(s[idx]) = c then
      cnt := cnt + 1;
  CountChar := cnt;
end;

function Verdict(n : integer) : string;
begin
  if n > 45 then
    Verdict := 'A match made in heaven'
  else if n >= 35 then
    Verdict := 'Ooh, there is potential'
  else if n >= 25 then
    Verdict := 'It is... complicated'
  else
    Verdict := 'Friendzone, sorry';
end;

begin
  ClrScr;
  Write('Your name:  ');
  ReadLn(nameA);
  Write('Their name: ');
  ReadLn(nameB);

  { default to Drake + Rihanna if either is left blank }
  if nameA = '' then
    nameA := 'Drake';
  if nameB = '' then
    nameB := 'Rihanna';

  letters[1] := 'L';
  letters[2] := 'O';
  letters[3] := 'V';
  letters[4] := 'E';
  letters[5] := 'S';

  { build NAME1 + LOVES + NAME2 and upper-case everything }
  line := nameA + 'LOVES' + nameB;
  for i := 1 to Length(line) do
    line[i] := UpCase(line[i]);
  for i := 1 to Length(nameA) do
    nameA[i] := UpCase(nameA[i]);
  for i := 1 to Length(nameB) do
    nameB[i] := UpCase(nameB[i]);

  { step 1: count each of L O V E S across the whole line }
  stepLen[1] := 5;
  for i := 1 to 5 do
    steps[1, i] := CountChar(line, letters[i]);

  { steps 2..5: sum adjacent pairs until one number remains }
  for i := 2 to 5 do
  begin
    stepLen[i] := stepLen[i - 1] - 1;
    for j := 1 to stepLen[i] do
      steps[i, j] := steps[i - 1, j] + steps[i - 1, j + 1];
  end;

  finalVal := steps[5, 1] mod 100;

  { layout: each number centred in a 6-wide cell, each row indented half a cell }
  triWidth := 5 * 6;
  header := nameA + '  LOVES  ' + nameB;
  width := triWidth;
  if Length(header) > width then
    width := Length(header);
  baseIndent := (width - triWidth) div 2;

  WriteLn;
  WriteLn(Centre(header, width));
  WriteLn(Repeated('-', width));
  for i := 1 to 5 do
  begin
    rowStr := Repeated(' ', baseIndent + (i - 1) * 3);
    for j := 1 to stepLen[i] do
      rowStr := rowStr + Centre(IntStr(steps[i, j]), 6);
    WriteLn(rowStr);
  end;
  WriteLn(Repeated('-', width));
  WriteLn(Centre(IntStr(finalVal) + '% compatible', width));
  WriteLn(Centre(Verdict(finalVal), width));
  WriteLn;
  Write('Press any key to exit...');
  ReadKey;
end.
