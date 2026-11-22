import type { TestConfig, Wordlist } from "../types";

const english = `the of and to in is you that it he was for on are as with his they at be this from have or by one had not but what all were when we there can an your which their said if do will each about how up out them then she many some so these would other into has more her two like him see time could no make than first been its who now people my made over did down only way find use may water long little very after words called just where most know get through back much before go good new write our used me man too any day same right look think also around another came come work three word must because does part even place well such here take why help put different away again off went old number great tell men say small every found still between name should home big give air line set own under read last never us left end along while might next sound below saw something thought both few those always show large often together asked house world going want school important until form food keep children feet land side without boy once animal life enough took sometimes four head above kind began almost live page got earth need far hand high year mother light country father let night picture being study second soon story since white ever paper hard near sentence better best across during today however sure knew try told young sun thing whole hear example heard several change answer room sea against top turned learn point city play toward five using himself usually money seen car morning body dog family door table music color fire stand friend begin walk ease grow open cut remember love problem listen speak move carry quiet game stop wait fast power ready simple reach strong follow idea voice mind river heart rest window bring believe happen build bright dream garden machine stone wind winter summer cloud forest field bridge silver market letter engine planet shadow travel master pocket castle orange yellow purple tower wonder season spirit moment energy pattern reason future memory silence journey mountain thunder ocean village balance anchor harvest lantern compass horizon velvet marble copper meadow breeze whisper canyon ember frost quartz`
  .split(/\s+/);

const code = `function const let var return import export default class extends interface type async await promise string number boolean array object null undefined void enum struct impl trait match loop while break continue switch case try catch finally throw error module package public private static final override abstract constructor prototype closure callback iterator generator yield lambda map filter reduce sort push pop shift slice splice split join parse stringify console log debug compile runtime binary index query select insert update delete table schema commit branch merge rebase stash token cache thread mutex socket buffer stream pipe fetch request response header cookie session render component state props effect hook reducer context router build deploy docker server client proxy kernel memory pointer reference vector matrix hash tree graph queue stack node edge parent child sibling recursion` 
  .split(/\s+/);

export const wordlists: Record<Wordlist, string[]> = {
  english: Array.from(new Set(english)),
  code: Array.from(new Set(code)),
};

/** Longer words used by the arcade game (lengths 8-12). */
const longWords = `adventure blueprint challenge character community condition construct discovery education emphasis equipment evolution excellent expansion fantasy framework fortunate generate guardian happiness historic horizon illusion imagine industry infinite innocent invasion judgment keyboard knowledge language lifetime magnetic marathon measure midnight mystery navigate notebook obstacle official ordinary painting passport pathway perfect platform pleasure portrait positive powerful practice precious pressure princess progress project promise protect quality question railroad reaction recovery resource response revolve scholar science shelter shimmer skyline snowfall software solution spectrum stadium strategy strength surface survive teacher terminal thousand tonight topmost tropical umbrella universe unstable vacation velocity venture victory village visitor volcano warrior weather western whisper wildlife wireless workshop yourself zeppelin accelerate adrenaline atmosphere battlefield brilliance commander constellation destroyer dimension explosion fortress gravity hurricane intercept lightning meteorite offensive overdrive paradox quantum radiation satellite starship trajectory turbulence ultimate vanguard wavelength`.split(/\s+/);

export const gameWordsByLength: Record<number, string[]> = (() => {
  const all = new Set<string>([...english, ...code, ...longWords].filter((w) => /^[a-z]{3,12}$/.test(w)));
  const out: Record<number, string[]> = {};
  all.forEach((w) => (out[w.length] ??= []).push(w));
  return out;
})();

export const bossPhrases = [
  "keep calm and type on",
  "hello from the void",
  "never stop typing",
  "forge your own path",
  "fingers of fury",
  "speed means nothing without accuracy",
  "the stars are watching",
  "type fast stay sharp",
  "one more wave to go",
  "steady hands win wars",
  "show them what you got",
  "rise above the noise",
];

// ---------------------------------------------------------------------------
// Test text generation
// ---------------------------------------------------------------------------

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function randomNumber(): string {
  const r = Math.random();
  const digits = r < 0.3 ? 1 : r < 0.6 ? 2 : r < 0.85 ? 3 : 4;
  let s = String(1 + Math.floor(Math.random() * 9));
  for (let i = 1; i < digits; i++) s += Math.floor(Math.random() * 10);
  return s;
}

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

export interface GenOptions {
  wordlist: Wordlist;
  punctuation: boolean;
  numbers: boolean;
}

export function generateWords(count: number, opts: GenOptions | TestConfig): string[] {
  const list = wordlists[opts.wordlist];
  const out: string[] = [];
  let prev1 = "";
  let prev2 = "";
  let capNext = opts.punctuation;

  for (let i = 0; i < count; i++) {
    if (opts.numbers && Math.random() < 0.14) {
      out.push(randomNumber());
      continue;
    }

    let w = rand(list);
    for (let tries = 0; tries < 6 && (w === prev1 || w === prev2); tries++) w = rand(list);
    prev2 = prev1;
    prev1 = w;

    if (opts.punctuation) {
      if (capNext) {
        w = capitalize(w);
        capNext = false;
      }
      const r = Math.random();
      if (r < 0.06) {
        w += ".";
        capNext = true;
      } else if (r < 0.12) w += ",";
      else if (r < 0.14) {
        w += "?";
        capNext = true;
      } else if (r < 0.155) {
        w += "!";
        capNext = true;
      } else if (r < 0.17) w += ";";
      else if (r < 0.185) w += ":";
      else if (r < 0.21) w = `"${w}"`;
      else if (r < 0.225) w = `(${w})`;
      else if (r < 0.24) w = `'${w}'`;
      else if (r < 0.25) w += "-";
    }
    out.push(w);
  }
  return out;
}
