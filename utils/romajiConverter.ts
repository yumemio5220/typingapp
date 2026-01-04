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
  'しゃ': ['sya', 'sha'], 'しゅ': ['syu', 'shu'], 'しょ': ['syo', 'sho'], 'しぇ': ['sye', 'she'],
  'ちゃ': ['tya', 'cha'], 'ちゅ': ['tyu', 'chu'], 'ちょ': ['tyo', 'cho'], 'ちぇ': ['tye', 'che'],
  'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
  'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
  'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
  'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
  'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
  'じゃ': ['zya', 'ja'], 'じゅ': ['zyu', 'ju'], 'じょ': ['zyo', 'jo'], 'じぇ': ['zye', 'je'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
  'ふぁ': ['fa'], 'ふぃ': ['fi'], 'ふぇ': ['fe'], 'ふぉ': ['fo'],
  'うぃ': ['wi'], 'うぇ': ['we'], 'うぉ': ['wo'],
  'ゔぁ': ['va'], 'ゔぃ': ['vi'], 'ゔ': ['vu'], 'ゔぇ': ['ve'], 'ゔぉ': ['vo'],
  'てぃ': ['thi'], 'でぃ': ['dhi'],
  'とぅ': ['tu'], 'どぅ': ['du'],
  'っ': ['ltu', 'xtu', 'ltsu'],
  'ぁ': ['la', 'xa'], 'ぃ': ['li', 'xi'], 'ぅ': ['lu', 'xu'], 'ぇ': ['le', 'xe'], 'ぉ': ['lo', 'xo'],
  'ゃ': ['lya', 'xya'], 'ゅ': ['lyu', 'xyu'], 'ょ': ['lyo', 'xyo'],
};

export function hiraganaToRomaji(hiragana: string): string[] {
  const results: string[] = [''];
  let i = 0;

  while (i < hiragana.length) {

    // 促音「っ」の処理
    if (hiragana[i] === 'っ' && i + 1 < hiragana.length) {
      // 次の文字を確認（2文字の組み合わせも考慮）
      let nextRomajiList: string[] = [];

      // まず2文字の組み合わせを試す
      if (i + 2 < hiragana.length) {
        const twoChar = hiragana.substring(i + 1, i + 3);
        if (ROMAJI_MAP[twoChar]) {
          nextRomajiList = ROMAJI_MAP[twoChar];
        }
      }

      // 2文字の組み合わせがなければ1文字を試す
      if (nextRomajiList.length === 0) {
        const nextChar = hiragana[i + 1];
        if (ROMAJI_MAP[nextChar]) {
          nextRomajiList = ROMAJI_MAP[nextChar];
        }
      }

      // 子音のセットを取得（重複を避けるためSetを使用）
      const consonants = new Set<string>();
      for (const nextRomaji of nextRomajiList) {
        if (nextRomaji.length > 0) {
          const consonant = nextRomaji[0];
          // 子音の場合のみ追加
          if (consonant !== 'a' && consonant !== 'i' && consonant !== 'u' && consonant !== 'e' && consonant !== 'o' && consonant !== 'n' && consonant !== '-') {
            consonants.add(consonant);
          }
        }
      }

      // 子音が取得できた場合、それを重ねる
      if (consonants.size > 0) {
        const newResults: string[] = [];
        for (const result of results) {
          for (const consonant of consonants) {
            newResults.push(result + consonant);
          }
        }
        results.length = 0;
        results.push(...newResults);
        i += 1;
        continue;
      } else {
        // 通常の「っ」の処理（ltu, xtu, ltsuのいずれか）
        const newResults: string[] = [];
        for (const result of results) {
          for (const romaji of ROMAJI_MAP['っ']) {
            newResults.push(result + romaji);
          }
        }
        results.length = 0;
        results.push(...newResults);
        i += 1;
        continue;
      }
    }

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
