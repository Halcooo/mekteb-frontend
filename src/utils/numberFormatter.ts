// Percentages have no grouping. Explicit punctuation also works in browsers
// shipped without Bosnian ICU data.
export function formatPercent(value:number|string|null|undefined,language='bs'):string {
  const number=Number(value??0);
  const text=(Number.isFinite(number)?number:0).toFixed(1);
  return (language.startsWith('en')?text:text.replace('.',','))+'%';
}
