const ROMAJI_MAP: { [key: string]: string[] } = {
  'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
  'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  'さ': ['sa'], 'し': ['si', 'shi'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
  'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
  'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  'わ': ['wa'], 'を': ['wo'], 'ん': ['nn', 'n'],
  'ー': ['-'],
  '、': [','], '。': ['.'], '！': ['!'], '？': ['?'],
  'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
  'しゃ': ['sya', 'sha'], 'しゅ': ['syu', 'shu'], 'しょ': ['syo', 'sho'],
  'ちゃ': ['tya', 'cha'], 'ちゅ': ['tyu', 'chu'], 'ちょ': ['tyo', 'cho'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['zya', 'ja'], 'じゅ': ['zyu', 'ju'], 'じょ': ['zyo', 'jo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
  'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
  'っ': ['ltu', 'xtu', 'ltsu'],
  'ぁ': ['la', 'xa'], 'ぃ': ['li', 'xi'], 'ぅ': ['lu', 'xu'], 'ぇ': ['le', 'xe'], 'ぉ': ['lo', 'xo'],
  'ゃ': ['lya', 'xya'], 'ゅ': ['lyu', 'xyu'], 'ょ': ['lyo', 'xyo'],
};

export function hiraganaToRomaji(hiragana: string): string[] {
  const results: string[] = [''];
  let i = 0;

  while (i < hiragana.length) {
    let matched = false;

    // Try 3-character match first (for combinations like きゃ)
    if (i + 2 < hiragana.length) {
      const threeChar = hiragana.substring(i, i + 3);
      if (ROMAJI_MAP[threeChar]) {
        const newResults: string[] = [];
        for (const result of results) {
          for (const romaji of ROMAJI_MAP[threeChar]) {
            newResults.push(result + romaji);
          }
        }
        results.length = 0;
        results.push(...newResults);
        i += 3;
        matched = true;
        continue;
      }
    }

    // Try 2-character match
    if (i + 1 < hiragana.length) {
      const twoChar = hiragana.substring(i, i + 2);
      if (ROMAJI_MAP[twoChar]) {
        const newResults: string[] = [];
        for (const result of results) {
          for (const romaji of ROMAJI_MAP[twoChar]) {
            newResults.push(result + romaji);
          }
        }
        results.length = 0;
        results.push(...newResults);
        i += 2;
        matched = true;
        continue;
      }
    }

    // Try single character match
    const oneChar = hiragana[i];
    if (ROMAJI_MAP[oneChar]) {
      const newResults: string[] = [];
      for (const result of results) {
        for (const romaji of ROMAJI_MAP[oneChar]) {
          newResults.push(result + romaji);
        }
      }
      results.length = 0;
      results.push(...newResults);
      i += 1;
      matched = true;
    } else {
      // Unknown character, just add it as-is
      for (let j = 0; j < results.length; j++) {
        results[j] += oneChar;
      }
      i += 1;
    }
  }

  return results;
}

export function getAcceptableRomaji(hiragana: string, currentInput: string): string[] {
  const allPossible = hiraganaToRomaji(hiragana);
  return allPossible.filter(romaji => romaji.startsWith(currentInput));
}
