export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export const JLPT_LEVELS: JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
export interface VocabularyWord { id: string; word: string; reading: string; romaji: string; meaningKey: string; level: JlptLevel; }
export interface StarterDeck { id: string; titleKey: string; descriptionKey: string; level: JlptLevel; wordIds: string[]; }
export interface GrammarExample { text: string; reading: string; parts: { text: string; reading?: string }[]; translationKey: string; }
export interface GrammarPoint { id: string; level: JlptLevel; pattern: string; reading: string; structure: string; summaryKey: string; explanationKey: string; tagKey: string; examples: GrammarExample[]; }
export type ExamSection = 'vocabulary' | 'grammar' | 'reading';
export interface ExamQuestion { id: string; section: ExamSection; prompt: string; options: string[]; correct: number; explanationKey: string; }
export interface PracticeExam { id: string; level: JlptLevel; durationSeconds: number; questions: ExamQuestion[]; }
export type GameMechanic = 'typing' | 'meaning' | 'listening' | 'choice' | 'order' | 'match' | 'guess';
export interface GameDefinition { id: string; mechanic: GameMechanic; titleKey: string; descriptionKey: string; color: string; }

export const VOCABULARY: VocabularyWord[] = [
  {
    "id": "water",
    "word": "水",
    "reading": "みず",
    "romaji": "mizu",
    "meaningKey": "word_water",
    "level": "N5"
  },
  {
    "id": "book",
    "word": "本",
    "reading": "ほん",
    "romaji": "hon",
    "meaningKey": "word_book",
    "level": "N5"
  },
  {
    "id": "cat",
    "word": "猫",
    "reading": "ねこ",
    "romaji": "neko",
    "meaningKey": "word_cat",
    "level": "N5"
  },
  {
    "id": "school",
    "word": "学校",
    "reading": "がっこう",
    "romaji": "gakkou",
    "meaningKey": "word_school",
    "level": "N5"
  },
  {
    "id": "friend",
    "word": "友達",
    "reading": "ともだち",
    "romaji": "tomodachi",
    "meaningKey": "word_friend",
    "level": "N5"
  },
  {
    "id": "eat",
    "word": "食べる",
    "reading": "たべる",
    "romaji": "taberu",
    "meaningKey": "word_eat",
    "level": "N5"
  },
  {
    "id": "today",
    "word": "今日",
    "reading": "きょう",
    "romaji": "kyou",
    "meaningKey": "word_today",
    "level": "N5"
  },
  {
    "id": "mountain",
    "word": "山",
    "reading": "やま",
    "romaji": "yama",
    "meaningKey": "word_mountain",
    "level": "N5"
  },
  {
    "id": "station",
    "word": "駅",
    "reading": "えき",
    "romaji": "eki",
    "meaningKey": "word_station",
    "level": "N5"
  },
  {
    "id": "ticket",
    "word": "切符",
    "reading": "きっぷ",
    "romaji": "kippu",
    "meaningKey": "word_ticket",
    "level": "N5"
  },
  {
    "id": "train",
    "word": "電車",
    "reading": "でんしゃ",
    "romaji": "densha",
    "meaningKey": "word_train",
    "level": "N5"
  },
  {
    "id": "travel",
    "word": "旅行",
    "reading": "りょこう",
    "romaji": "ryokou",
    "meaningKey": "word_travel",
    "level": "N5"
  },
  {
    "id": "hotel",
    "word": "ホテル",
    "reading": "ほてる",
    "romaji": "hoteru",
    "meaningKey": "word_hotel",
    "level": "N5"
  },
  {
    "id": "map",
    "word": "地図",
    "reading": "ちず",
    "romaji": "chizu",
    "meaningKey": "word_map",
    "level": "N5"
  },
  {
    "id": "shop",
    "word": "店",
    "reading": "みせ",
    "romaji": "mise",
    "meaningKey": "word_shop",
    "level": "N5"
  },
  {
    "id": "airport",
    "word": "空港",
    "reading": "くうこう",
    "romaji": "kuukou",
    "meaningKey": "word_airport",
    "level": "N5"
  },
  {
    "id": "promise",
    "word": "約束",
    "reading": "やくそく",
    "romaji": "yakusoku",
    "meaningKey": "word_promise",
    "level": "N4"
  },
  {
    "id": "prepare",
    "word": "準備",
    "reading": "じゅんび",
    "romaji": "junbi",
    "meaningKey": "word_prepare",
    "level": "N4"
  },
  {
    "id": "explain",
    "word": "説明",
    "reading": "せつめい",
    "romaji": "setsumei",
    "meaningKey": "word_explain",
    "level": "N4"
  },
  {
    "id": "experience",
    "word": "経験",
    "reading": "けいけん",
    "romaji": "keiken",
    "meaningKey": "word_experience",
    "level": "N4"
  },
  {
    "id": "necessary",
    "word": "必要",
    "reading": "ひつよう",
    "romaji": "hitsuyou",
    "meaningKey": "word_necessary",
    "level": "N4"
  },
  {
    "id": "special",
    "word": "特別",
    "reading": "とくべつ",
    "romaji": "tokubetsu",
    "meaningKey": "word_special",
    "level": "N4"
  },
  {
    "id": "continue",
    "word": "続ける",
    "reading": "つづける",
    "romaji": "tsuzukeru",
    "meaningKey": "word_continue",
    "level": "N4"
  },
  {
    "id": "choose",
    "word": "選ぶ",
    "reading": "えらぶ",
    "romaji": "erabu",
    "meaningKey": "word_choose",
    "level": "N4"
  },
  {
    "id": "effort",
    "word": "努力",
    "reading": "どりょく",
    "romaji": "doryoku",
    "meaningKey": "word_effort",
    "level": "N3"
  },
  {
    "id": "goal",
    "word": "目標",
    "reading": "もくひょう",
    "romaji": "mokuhyou",
    "meaningKey": "word_goal",
    "level": "N3"
  },
  {
    "id": "environment",
    "word": "環境",
    "reading": "かんきょう",
    "romaji": "kankyou",
    "meaningKey": "word_environment",
    "level": "N3"
  },
  {
    "id": "opinion",
    "word": "意見",
    "reading": "いけん",
    "romaji": "iken",
    "meaningKey": "word_opinion",
    "level": "N3"
  },
  {
    "id": "improve",
    "word": "改善",
    "reading": "かいぜん",
    "romaji": "kaizen",
    "meaningKey": "word_improve",
    "level": "N3"
  },
  {
    "id": "responsibility",
    "word": "責任",
    "reading": "せきにん",
    "romaji": "sekinin",
    "meaningKey": "word_responsibility",
    "level": "N3"
  },
  {
    "id": "cooperate",
    "word": "協力",
    "reading": "きょうりょく",
    "romaji": "kyouryoku",
    "meaningKey": "word_cooperate",
    "level": "N3"
  },
  {
    "id": "information",
    "word": "情報",
    "reading": "じょうほう",
    "romaji": "jouhou",
    "meaningKey": "word_information",
    "level": "N3"
  },
  {
    "id": "tendency",
    "word": "傾向",
    "reading": "けいこう",
    "romaji": "keikou",
    "meaningKey": "word_tendency",
    "level": "N2"
  },
  {
    "id": "analysis",
    "word": "分析",
    "reading": "ぶんせき",
    "romaji": "bunseki",
    "meaningKey": "word_analysis",
    "level": "N2"
  },
  {
    "id": "proposal",
    "word": "提案",
    "reading": "ていあん",
    "romaji": "teian",
    "meaningKey": "word_proposal",
    "level": "N2"
  },
  {
    "id": "judgment",
    "word": "判断",
    "reading": "はんだん",
    "romaji": "handan",
    "meaningKey": "word_judgment",
    "level": "N2"
  },
  {
    "id": "influence",
    "word": "影響",
    "reading": "えいきょう",
    "romaji": "eikyou",
    "meaningKey": "word_influence",
    "level": "N2"
  },
  {
    "id": "efficient",
    "word": "効率",
    "reading": "こうりつ",
    "romaji": "kouritsu",
    "meaningKey": "word_efficient",
    "level": "N2"
  },
  {
    "id": "abstract",
    "word": "抽象的",
    "reading": "ちゅうしょうてき",
    "romaji": "chuushouteki",
    "meaningKey": "word_abstract",
    "level": "N1"
  },
  {
    "id": "consistent",
    "word": "一貫",
    "reading": "いっかん",
    "romaji": "ikkan",
    "meaningKey": "word_consistent",
    "level": "N1"
  },
  {
    "id": "consideration",
    "word": "配慮",
    "reading": "はいりょ",
    "romaji": "hairyo",
    "meaningKey": "word_consideration",
    "level": "N1"
  },
  {
    "id": "flexible",
    "word": "柔軟",
    "reading": "じゅうなん",
    "romaji": "juunan",
    "meaningKey": "word_flexible",
    "level": "N1"
  },
  {
    "id": "basis",
    "word": "根拠",
    "reading": "こんきょ",
    "romaji": "konkyo",
    "meaningKey": "word_basis",
    "level": "N1"
  },
  {
    "id": "compromise",
    "word": "妥協",
    "reading": "だきょう",
    "romaji": "dakyou",
    "meaningKey": "word_compromise",
    "level": "N1"
  }
];

export const STARTER_DECKS: StarterDeck[] = [
  {
    "id": "daily",
    "titleKey": "deckDaily",
    "descriptionKey": "deckDailyDesc",
    "level": "N5",
    "wordIds": [
      "water",
      "book",
      "cat",
      "school",
      "friend",
      "eat",
      "today",
      "mountain"
    ]
  },
  {
    "id": "travel",
    "titleKey": "deckTravel",
    "descriptionKey": "deckTravelDesc",
    "level": "N5",
    "wordIds": [
      "station",
      "ticket",
      "train",
      "travel",
      "hotel",
      "map",
      "shop",
      "airport"
    ]
  },
  {
    "id": "n4",
    "titleKey": "deckN4",
    "descriptionKey": "deckN4Desc",
    "level": "N4",
    "wordIds": [
      "promise",
      "prepare",
      "explain",
      "experience",
      "necessary",
      "special",
      "continue",
      "choose"
    ]
  },
  {
    "id": "n3",
    "titleKey": "deckN3",
    "descriptionKey": "deckN3Desc",
    "level": "N3",
    "wordIds": [
      "effort",
      "goal",
      "environment",
      "opinion",
      "improve",
      "responsibility",
      "cooperate",
      "information"
    ]
  },
  {
    "id": "n2",
    "titleKey": "deckN2",
    "descriptionKey": "deckN2Desc",
    "level": "N2",
    "wordIds": [
      "tendency",
      "analysis",
      "proposal",
      "judgment",
      "influence",
      "efficient"
    ]
  },
  {
    "id": "n1",
    "titleKey": "deckN1",
    "descriptionKey": "deckN1Desc",
    "level": "N1",
    "wordIds": [
      "abstract",
      "consistent",
      "consideration",
      "flexible",
      "basis",
      "compromise"
    ]
  }
];

export const GRAMMAR_POINTS: GrammarPoint[] = [
  {
    "id": "desu",
    "level": "N5",
    "pattern": "〜は〜です",
    "reading": "wa … desu",
    "structure": "N1 は N2 です",
    "summaryKey": "grammar_desu_summary",
    "explanationKey": "grammar_desu_explanation",
    "tagKey": "grammar_desu_tag",
    "examples": [
      {
        "text": "この方は先生です。",
        "reading": "このかたはせんせいです",
        "parts": [
          {
            "text": "この方は"
          },
          {
            "text": "先生",
            "reading": "せんせい"
          },
          {
            "text": "です。"
          }
        ],
        "translationKey": "grammar_desu_translation"
      }
    ]
  },
  {
    "id": "no",
    "level": "N5",
    "pattern": "〜の〜",
    "reading": "no",
    "structure": "N1 の N2",
    "summaryKey": "grammar_no_summary",
    "explanationKey": "grammar_no_explanation",
    "tagKey": "grammar_no_tag",
    "examples": [
      {
        "text": "これは妹の本です。",
        "reading": "これはいもうとのほんです",
        "parts": [
          {
            "text": "これは"
          },
          {
            "text": "妹",
            "reading": "いもうと"
          },
          {
            "text": "の本です。"
          }
        ],
        "translationKey": "grammar_no_translation"
      }
    ]
  },
  {
    "id": "masen",
    "level": "N5",
    "pattern": "〜ません",
    "reading": "masen",
    "structure": "V bỏ ます + ません",
    "summaryKey": "grammar_masen_summary",
    "explanationKey": "grammar_masen_explanation",
    "tagKey": "grammar_masen_tag",
    "examples": [
      {
        "text": "日曜日は働きません。",
        "reading": "にちようびははたらきません",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "日曜日",
            "reading": "にちようび"
          },
          {
            "text": "は働きません。"
          }
        ],
        "translationKey": "grammar_masen_translation"
      }
    ]
  },
  {
    "id": "tai",
    "level": "N5",
    "pattern": "〜たい",
    "reading": "tai",
    "structure": "V bỏ ます + たいです",
    "summaryKey": "grammar_tai_summary",
    "explanationKey": "grammar_tai_explanation",
    "tagKey": "grammar_tai_tag",
    "examples": [
      {
        "text": "京都へ行きたいです。",
        "reading": "きょうとへいきたいです",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "京都",
            "reading": "きょうと"
          },
          {
            "text": "へ行きたいです。"
          }
        ],
        "translationKey": "grammar_tai_translation"
      }
    ]
  },
  {
    "id": "teiru",
    "level": "N4",
    "pattern": "〜ている",
    "reading": "te iru",
    "structure": "V thể て + います",
    "summaryKey": "grammar_teiru_summary",
    "explanationKey": "grammar_teiru_explanation",
    "tagKey": "grammar_teiru_tag",
    "examples": [
      {
        "text": "姉は今、本を読んでいます。",
        "reading": "あねはいま、ほんをよんでいます",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "姉",
            "reading": "あね"
          },
          {
            "text": "は今、本を読んでいます。"
          }
        ],
        "translationKey": "grammar_teiru_translation"
      }
    ]
  },
  {
    "id": "koto",
    "level": "N4",
    "pattern": "〜たことがある",
    "reading": "ta koto ga aru",
    "structure": "V thể た + ことがあります",
    "summaryKey": "grammar_koto_summary",
    "explanationKey": "grammar_koto_explanation",
    "tagKey": "grammar_koto_tag",
    "examples": [
      {
        "text": "北海道へ行ったことがあります。",
        "reading": "ほっかいどうへいったことがあります",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "北海道",
            "reading": "ほっかいどう"
          },
          {
            "text": "へ行ったことがあります。"
          }
        ],
        "translationKey": "grammar_koto_translation"
      }
    ]
  },
  {
    "id": "nagara",
    "level": "N4",
    "pattern": "〜ながら",
    "reading": "nagara",
    "structure": "V bỏ ます + ながら + hành động chính",
    "summaryKey": "grammar_nagara_summary",
    "explanationKey": "grammar_nagara_explanation",
    "tagKey": "grammar_nagara_tag",
    "examples": [
      {
        "text": "音楽を聞きながら料理します。",
        "reading": "おんがくをききながらりょうりします",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "音楽",
            "reading": "おんがく"
          },
          {
            "text": "を聞きながら料理します。"
          }
        ],
        "translationKey": "grammar_nagara_translation"
      }
    ]
  },
  {
    "id": "houga",
    "level": "N4",
    "pattern": "〜たほうがいい",
    "reading": "ta hou ga ii",
    "structure": "V thể た + ほうがいいです",
    "summaryKey": "grammar_houga_summary",
    "explanationKey": "grammar_houga_explanation",
    "tagKey": "grammar_houga_tag",
    "examples": [
      {
        "text": "今日は早く寝たほうがいいです。",
        "reading": "きょうははやくねたほうがいいです",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "今日",
            "reading": "きょう"
          },
          {
            "text": "は早く寝たほうがいいです。"
          }
        ],
        "translationKey": "grammar_houga_translation"
      }
    ]
  },
  {
    "id": "youni",
    "level": "N3",
    "pattern": "〜ようになる",
    "reading": "you ni naru",
    "structure": "V từ điển / V thể ない + ようになる",
    "summaryKey": "grammar_youni_summary",
    "explanationKey": "grammar_youni_explanation",
    "tagKey": "grammar_youni_tag",
    "examples": [
      {
        "text": "日本語の新聞が読めるようになりました。",
        "reading": "にほんごのしんぶんがよめるようになりました",
        "parts": [
          {
            "text": "日本語の"
          },
          {
            "text": "新聞",
            "reading": "しんぶん"
          },
          {
            "text": "が読めるようになりました。"
          }
        ],
        "translationKey": "grammar_youni_translation"
      }
    ]
  },
  {
    "id": "bakari",
    "level": "N3",
    "pattern": "〜たばかり",
    "reading": "ta bakari",
    "structure": "V thể た + ばかりです",
    "summaryKey": "grammar_bakari_summary",
    "explanationKey": "grammar_bakari_explanation",
    "tagKey": "grammar_bakari_tag",
    "examples": [
      {
        "text": "先月、この町に引っ越してきたばかりです。",
        "reading": "せんげつ、このまちにひっこしてきたばかりです",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "先月",
            "reading": "せんげつ"
          },
          {
            "text": "、この町に引っ越してきたばかりです。"
          }
        ],
        "translationKey": "grammar_bakari_translation"
      }
    ]
  },
  {
    "id": "hazu",
    "level": "N3",
    "pattern": "〜はずだ",
    "reading": "hazu da",
    "structure": "V / tính từ い + はずだ; N / tính từ な + の / な + はずだ",
    "summaryKey": "grammar_hazu_summary",
    "explanationKey": "grammar_hazu_explanation",
    "tagKey": "grammar_hazu_tag",
    "examples": [
      {
        "text": "電車はもう着いたはずです。",
        "reading": "でんしゃはもうついたはずです",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "電車",
            "reading": "でんしゃ"
          },
          {
            "text": "はもう着いたはずです。"
          }
        ],
        "translationKey": "grammar_hazu_translation"
      }
    ]
  },
  {
    "id": "niyotte",
    "level": "N3",
    "pattern": "〜によって",
    "reading": "ni yotte",
    "structure": "N + によって",
    "summaryKey": "grammar_niyotte_summary",
    "explanationKey": "grammar_niyotte_explanation",
    "tagKey": "grammar_niyotte_tag",
    "examples": [
      {
        "text": "国によって習慣が違います。",
        "reading": "くにによってしゅうかんがちがいます",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "国",
            "reading": "くに"
          },
          {
            "text": "によって習慣が違います。"
          }
        ],
        "translationKey": "grammar_niyotte_translation"
      }
    ]
  },
  {
    "id": "wakede",
    "level": "N2",
    "pattern": "〜わけではない",
    "reading": "wake dewa nai",
    "structure": "Thể thông thường + わけではない",
    "summaryKey": "grammar_wakede_summary",
    "explanationKey": "grammar_wakede_explanation",
    "tagKey": "grammar_wakede_tag",
    "examples": [
      {
        "text": "高い物が必ずしも良いわけではありません。",
        "reading": "たかいものがかならずしもよいわけではありません",
        "parts": [
          {
            "text": "高い"
          },
          {
            "text": "物",
            "reading": "もの"
          },
          {
            "text": "が必ずしも良いわけではありません。"
          }
        ],
        "translationKey": "grammar_wakede_translation"
      }
    ]
  },
  {
    "id": "nikagiri",
    "level": "N2",
    "pattern": "〜に限らず",
    "reading": "ni kagirazu",
    "structure": "N + に限らず",
    "summaryKey": "grammar_nikagiri_summary",
    "explanationKey": "grammar_nikagiri_explanation",
    "tagKey": "grammar_nikagiri_tag",
    "examples": [
      {
        "text": "この店は週末に限らず平日も混んでいます。",
        "reading": "このみせはしゅうまつにかぎらずへいじつもこんでいます",
        "parts": [
          {
            "text": "この店は"
          },
          {
            "text": "週末",
            "reading": "しゅうまつ"
          },
          {
            "text": "に限らず平日も混んでいます。"
          }
        ],
        "translationKey": "grammar_nikagiri_translation"
      }
    ]
  },
  {
    "id": "monono",
    "level": "N2",
    "pattern": "〜ものの",
    "reading": "mono no",
    "structure": "Thể thông thường + ものの; tính từ な + なものの",
    "summaryKey": "grammar_monono_summary",
    "explanationKey": "grammar_monono_explanation",
    "tagKey": "grammar_monono_tag",
    "examples": [
      {
        "text": "本を買ったものの、まだ読んでいません。",
        "reading": "ほんをかったものの、まだよんでいません",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "本",
            "reading": "ほん"
          },
          {
            "text": "を買ったものの、まだ読んでいません。"
          }
        ],
        "translationKey": "grammar_monono_translation"
      }
    ]
  },
  {
    "id": "nikawari",
    "level": "N2",
    "pattern": "〜に代わって",
    "reading": "ni kawatte",
    "structure": "N + に代わって",
    "summaryKey": "grammar_nikawari_summary",
    "explanationKey": "grammar_nikawari_explanation",
    "tagKey": "grammar_nikawari_tag",
    "examples": [
      {
        "text": "部長に代わって会議に出席します。",
        "reading": "ぶちょうにかわってかいぎにしゅっせきします",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "部長",
            "reading": "ぶちょう"
          },
          {
            "text": "に代わって会議に出席します。"
          }
        ],
        "translationKey": "grammar_nikawari_translation"
      }
    ]
  },
  {
    "id": "beku",
    "level": "N1",
    "pattern": "〜べく",
    "reading": "beku",
    "structure": "V từ điển + べく (する → するべく / すべく)",
    "summaryKey": "grammar_beku_summary",
    "explanationKey": "grammar_beku_explanation",
    "tagKey": "grammar_beku_tag",
    "examples": [
      {
        "text": "問題を解決すべく、専門家に相談した。",
        "reading": "もんだいをかいけつすべく、せんもんかにそうだんした",
        "parts": [
          {
            "text": ""
          },
          {
            "text": "問題",
            "reading": "もんだい"
          },
          {
            "text": "を解決すべく、専門家に相談した。"
          }
        ],
        "translationKey": "grammar_beku_translation"
      }
    ]
  },
  {
    "id": "sura",
    "level": "N1",
    "pattern": "〜すら",
    "reading": "sura",
    "structure": "N + すら",
    "summaryKey": "grammar_sura_summary",
    "explanationKey": "grammar_sura_explanation",
    "tagKey": "grammar_sura_tag",
    "examples": [
      {
        "text": "忙しくて、昼ご飯を食べる時間すらない。",
        "reading": "いそがしくて、ひるごはんをたべるじかんすらない",
        "parts": [
          {
            "text": "忙しくて、昼ご飯を食べる"
          },
          {
            "text": "時間",
            "reading": "じかん"
          },
          {
            "text": "すらない。"
          }
        ],
        "translationKey": "grammar_sura_translation"
      }
    ]
  },
  {
    "id": "wofumae",
    "level": "N1",
    "pattern": "〜を踏まえて",
    "reading": "wo fumaete",
    "structure": "N + を踏まえて",
    "summaryKey": "grammar_wofumae_summary",
    "explanationKey": "grammar_wofumae_explanation",
    "tagKey": "grammar_wofumae_tag",
    "examples": [
      {
        "text": "調査の結果を踏まえて、計画を見直します。",
        "reading": "ちょうさのけっかをふまえて、けいかくをみなおします",
        "parts": [
          {
            "text": "調査の"
          },
          {
            "text": "結果",
            "reading": "けっか"
          },
          {
            "text": "を踏まえて、計画を見直します。"
          }
        ],
        "translationKey": "grammar_wofumae_translation"
      }
    ]
  },
  {
    "id": "nikataku",
    "level": "N1",
    "pattern": "〜にかたくない",
    "reading": "ni kataku nai",
    "structure": "V từ điển + にかたくない",
    "summaryKey": "grammar_nikataku_summary",
    "explanationKey": "grammar_nikataku_explanation",
    "tagKey": "grammar_nikataku_tag",
    "examples": [
      {
        "text": "彼の喜びは想像にかたくない。",
        "reading": "かれのよろこびはそうぞうにかたくない",
        "parts": [
          {
            "text": "彼の"
          },
          {
            "text": "喜び",
            "reading": "よろこび"
          },
          {
            "text": "は想像にかたくない。"
          }
        ],
        "translationKey": "grammar_nikataku_translation"
      }
    ]
  }
];

export const PRACTICE_EXAMS: PracticeExam[] = [
  {
    "id": "n5-practice",
    "level": "N5",
    "durationSeconds": 300,
    "questions": [
      {
        "id": "n5-1",
        "section": "vocabulary",
        "prompt": "「水」の読み方はどれですか。",
        "options": [
          "みず",
          "やま",
          "そら",
          "かわ"
        ],
        "correct": 0,
        "explanationKey": "exam_n5_1"
      },
      {
        "id": "n5-2",
        "section": "vocabulary",
        "prompt": "「ねこ」はどれですか。",
        "options": [
          "犬",
          "鳥",
          "猫",
          "魚"
        ],
        "correct": 2,
        "explanationKey": "exam_n5_2"
      },
      {
        "id": "n5-3",
        "section": "grammar",
        "prompt": "私は毎朝パン（　）食べます。",
        "options": [
          "に",
          "を",
          "で",
          "へ"
        ],
        "correct": 1,
        "explanationKey": "exam_n5_3"
      },
      {
        "id": "n5-4",
        "section": "grammar",
        "prompt": "きのう、学校へ（　）。",
        "options": [
          "行きます",
          "行きません",
          "行って",
          "行きました"
        ],
        "correct": 3,
        "explanationKey": "exam_n5_4"
      },
      {
        "id": "n5-5",
        "section": "reading",
        "prompt": "田中さんは月曜日から金曜日まで働きます。土曜日と日曜日は休みです。田中さんはいつ休みますか。",
        "options": [
          "月曜日",
          "水曜日",
          "金曜日",
          "土曜日と日曜日"
        ],
        "correct": 3,
        "explanationKey": "exam_n5_5"
      }
    ]
  },
  {
    "id": "n4-practice",
    "level": "N4",
    "durationSeconds": 300,
    "questions": [
      {
        "id": "n4-1",
        "section": "vocabulary",
        "prompt": "「約束」の読み方はどれですか。",
        "options": [
          "やくそく",
          "よやく",
          "やくしょ",
          "やくもく"
        ],
        "correct": 0,
        "explanationKey": "exam_n4_1"
      },
      {
        "id": "n4-2",
        "section": "grammar",
        "prompt": "私は日本へ行った（　）があります。",
        "options": [
          "もの",
          "こと",
          "ところ",
          "ため"
        ],
        "correct": 1,
        "explanationKey": "exam_n4_2"
      },
      {
        "id": "n4-3",
        "section": "grammar",
        "prompt": "音楽を聞き（　）、宿題をします。",
        "options": [
          "ても",
          "ので",
          "ながら",
          "まで"
        ],
        "correct": 2,
        "explanationKey": "exam_n4_3"
      },
      {
        "id": "n4-4",
        "section": "grammar",
        "prompt": "熱がありますね。早く（　）ほうがいいですよ。",
        "options": [
          "寝る",
          "寝ます",
          "寝て",
          "寝た"
        ],
        "correct": 3,
        "explanationKey": "exam_n4_4"
      },
      {
        "id": "n4-5",
        "section": "reading",
        "prompt": "図書館は午前九時に開きます。月曜日は休みです。今日は月曜日です。今日、本を借りられますか。",
        "options": [
          "九時から借りられます",
          "午後だけ借りられます",
          "借りられません",
          "いつでも借りられます"
        ],
        "correct": 2,
        "explanationKey": "exam_n4_5"
      }
    ]
  },
  {
    "id": "n3-practice",
    "level": "N3",
    "durationSeconds": 300,
    "questions": [
      {
        "id": "n3-1",
        "section": "vocabulary",
        "prompt": "「目標」の読み方はどれですか。",
        "options": [
          "もくひょう",
          "もくてき",
          "めひょう",
          "もくしょう"
        ],
        "correct": 0,
        "explanationKey": "exam_n3_1"
      },
      {
        "id": "n3-2",
        "section": "grammar",
        "prompt": "毎日練習して、日本語が話せる（　）なりました。",
        "options": [
          "ために",
          "ように",
          "そうに",
          "ばかりに"
        ],
        "correct": 1,
        "explanationKey": "exam_n3_2"
      },
      {
        "id": "n3-3",
        "section": "grammar",
        "prompt": "昼ご飯を食べた（　）なので、おなかがすいていません。",
        "options": [
          "はず",
          "こと",
          "ばかり",
          "よう"
        ],
        "correct": 2,
        "explanationKey": "exam_n3_3"
      },
      {
        "id": "n3-4",
        "section": "grammar",
        "prompt": "国（　）食事の習慣が違います。",
        "options": [
          "として",
          "に対して",
          "について",
          "によって"
        ],
        "correct": 3,
        "explanationKey": "exam_n3_4"
      },
      {
        "id": "n3-5",
        "section": "reading",
        "prompt": "この店では袋が有料になりました。店長は、ごみを減らすために自分の袋を持ってきてほしいと言っています。店の目的は何ですか。",
        "options": [
          "袋をたくさん売ること",
          "客を減らすこと",
          "ごみを減らすこと",
          "店を大きくすること"
        ],
        "correct": 2,
        "explanationKey": "exam_n3_5"
      }
    ]
  },
  {
    "id": "n2-practice",
    "level": "N2",
    "durationSeconds": 300,
    "questions": [
      {
        "id": "n2-1",
        "section": "vocabulary",
        "prompt": "「影響」の読み方はどれですか。",
        "options": [
          "えいきょう",
          "えいぎょう",
          "いんしょう",
          "えんきょう"
        ],
        "correct": 0,
        "explanationKey": "exam_n2_1"
      },
      {
        "id": "n2-2",
        "section": "grammar",
        "prompt": "値段が高いからといって、品質がいい（　）。",
        "options": [
          "に違いない",
          "わけではない",
          "に決まっている",
          "はずだ"
        ],
        "correct": 1,
        "explanationKey": "exam_n2_2"
      },
      {
        "id": "n2-3",
        "section": "grammar",
        "prompt": "このサービスは国内（　）、海外でも利用できます。",
        "options": [
          "を問わず",
          "に反して",
          "に限らず",
          "にかかわらず"
        ],
        "correct": 2,
        "explanationKey": "exam_n2_3"
      },
      {
        "id": "n2-4",
        "section": "grammar",
        "prompt": "資格は取った（　）、それを生かす仕事が見つからない。",
        "options": [
          "うえで",
          "以上",
          "ところで",
          "ものの"
        ],
        "correct": 3,
        "explanationKey": "exam_n2_4"
      },
      {
        "id": "n2-5",
        "section": "reading",
        "prompt": "会社は会議を減らし、必要な情報を文書で共有する方針を決めた。ただし、意見が分かれる問題は直接話し合う。直接話し合うのはどんな場合か。",
        "options": [
          "情報を送るとき",
          "意見が分かれるとき",
          "毎朝",
          "文書を読んだとき"
        ],
        "correct": 1,
        "explanationKey": "exam_n2_5"
      }
    ]
  },
  {
    "id": "n1-practice",
    "level": "N1",
    "durationSeconds": 300,
    "questions": [
      {
        "id": "n1-1",
        "section": "vocabulary",
        "prompt": "「配慮」の読み方はどれですか。",
        "options": [
          "はいりょ",
          "はいりょう",
          "ばいりょ",
          "はいろ"
        ],
        "correct": 0,
        "explanationKey": "exam_n1_1"
      },
      {
        "id": "n1-2",
        "section": "grammar",
        "prompt": "事故の原因を明らかにする（　）、調査委員会が設けられた。",
        "options": [
          "まじく",
          "べく",
          "ごとく",
          "かたわら"
        ],
        "correct": 1,
        "explanationKey": "exam_n1_2"
      },
      {
        "id": "n1-3",
        "section": "grammar",
        "prompt": "忙しすぎて、休む時間（　）ない。",
        "options": [
          "こそ",
          "のみ",
          "すら",
          "だけに"
        ],
        "correct": 2,
        "explanationKey": "exam_n1_3"
      },
      {
        "id": "n1-4",
        "section": "grammar",
        "prompt": "過去の失敗（　）、新しい対策を検討した。",
        "options": [
          "に即しては",
          "にかかわらず",
          "をよそに",
          "を踏まえて"
        ],
        "correct": 3,
        "explanationKey": "exam_n1_4"
      },
      {
        "id": "n1-5",
        "section": "reading",
        "prompt": "効率を追求するあまり、対話の余地が失われては本末転倒である。制度は人を支えるためのものであり、その逆であってはならない。筆者が重視しているのは何か。",
        "options": [
          "効率を最優先すること",
          "制度に人を合わせること",
          "人を支える制度と対話",
          "対話をなくすこと"
        ],
        "correct": 2,
        "explanationKey": "exam_n1_5"
      }
    ]
  }
];

export const GAMES: GameDefinition[] = [
  {
    "id": "word-shot",
    "mechanic": "typing",
    "titleKey": "game_word_shot_title",
    "descriptionKey": "game_word_shot_description",
    "color": "primary"
  },
  {
    "id": "word-rain",
    "mechanic": "meaning",
    "titleKey": "game_word_rain_title",
    "descriptionKey": "game_word_rain_description",
    "color": "info"
  },
  {
    "id": "spelling-bee",
    "mechanic": "listening",
    "titleKey": "game_spelling_bee_title",
    "descriptionKey": "game_spelling_bee_description",
    "color": "n1"
  },
  {
    "id": "fruit-throw",
    "mechanic": "typing",
    "titleKey": "game_fruit_throw_title",
    "descriptionKey": "game_fruit_throw_description",
    "color": "success"
  },
  {
    "id": "cloud-runner",
    "mechanic": "choice",
    "titleKey": "game_cloud_runner_title",
    "descriptionKey": "game_cloud_runner_description",
    "color": "info"
  },
  {
    "id": "bridge-builder",
    "mechanic": "order",
    "titleKey": "game_bridge_builder_title",
    "descriptionKey": "game_bridge_builder_description",
    "color": "n2"
  },
  {
    "id": "word-match",
    "mechanic": "match",
    "titleKey": "game_word_match_title",
    "descriptionKey": "game_word_match_description",
    "color": "success"
  },
  {
    "id": "meteor",
    "mechanic": "choice",
    "titleKey": "game_meteor_title",
    "descriptionKey": "game_meteor_description",
    "color": "n2"
  },
  {
    "id": "word-guess",
    "mechanic": "guess",
    "titleKey": "game_word_guess_title",
    "descriptionKey": "game_word_guess_description",
    "color": "primary"
  },
  {
    "id": "bubble-pop",
    "mechanic": "choice",
    "titleKey": "game_bubble_pop_title",
    "descriptionKey": "game_bubble_pop_description",
    "color": "n4"
  }
];

export const SENTENCE_ORDERS = [
  {
    "tokens": [
      "私は",
      "毎朝",
      "水を",
      "飲みます。"
    ],
    "meaningKey": "order_0"
  },
  {
    "tokens": [
      "友達と",
      "図書館で",
      "日本語を",
      "勉強します。"
    ],
    "meaningKey": "order_1"
  },
  {
    "tokens": [
      "明日は",
      "電車で",
      "学校へ",
      "行きます。"
    ],
    "meaningKey": "order_2"
  },
  {
    "tokens": [
      "これは",
      "妹の",
      "新しい",
      "本です。"
    ],
    "meaningKey": "order_3"
  },
  {
    "tokens": [
      "音楽を",
      "聞きながら",
      "晩ご飯を",
      "作ります。"
    ],
    "meaningKey": "order_4"
  }
];
