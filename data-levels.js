// 1-10 级分级课程数据
// 参考小学英语课本 (人教版 PEP) 从易到难编排
const COURSE_LEVELS = [
  // ─── Level 1: 字母与单音节词 ───
  {
    id: 1, name: "字母启蒙", nameEn: "Letter Sounds",
    desc: "认识字母发音，学习最简单的单词",
    icon: "🌱", color: "#2ed573",
    units: [
      { title: "A-F 字母音", type: "phonics", items: [
        { letter: "A", sound: "/æ/", words: [
          { word: "apple", emoji: "🍎", cn: "苹果" },
          { word: "ant", emoji: "🐜", cn: "蚂蚁" },
          { word: "cat", emoji: "🐱", cn: "猫" },
        ]},
        { letter: "B", sound: "/b/", words: [
          { word: "ball", emoji: "⚽", cn: "球" },
          { word: "bed", emoji: "🛏️", cn: "床" },
          { word: "bus", emoji: "🚌", cn: "公交车" },
        ]},
        { letter: "C", sound: "/k/", words: [
          { word: "cup", emoji: "🥤", cn: "杯子" },
          { word: "car", emoji: "🚗", cn: "汽车" },
          { word: "cap", emoji: "🧢", cn: "帽子" },
        ]},
        { letter: "D", sound: "/d/", words: [
          { word: "dog", emoji: "🐶", cn: "狗" },
          { word: "dad", emoji: "👨", cn: "爸爸" },
          { word: "duck", emoji: "🦆", cn: "鸭子" },
        ]},
        { letter: "E", sound: "/ɛ/", words: [
          { word: "egg", emoji: "🥚", cn: "鸡蛋" },
          { word: "red", emoji: "❤️", cn: "红色" },
          { word: "pen", emoji: "🖊️", cn: "笔" },
        ]},
        { letter: "F", sound: "/f/", words: [
          { word: "fish", emoji: "🐟", cn: "鱼" },
          { word: "fan", emoji: "🌀", cn: "风扇" },
          { word: "fun", emoji: "😄", cn: "快乐" },
        ]},
      ]},
      { title: "G-L 字母音", type: "phonics", items: [
        { letter: "G", sound: "/ɡ/", words: [
          { word: "go", emoji: "🏃", cn: "去" },
          { word: "got", emoji: "🤲", cn: "得到" },
          { word: "gum", emoji: "🫧", cn: "口香糖" },
        ]},
        { letter: "H", sound: "/h/", words: [
          { word: "hat", emoji: "🎩", cn: "帽子" },
          { word: "hot", emoji: "🔥", cn: "热" },
          { word: "hug", emoji: "🤗", cn: "拥抱" },
        ]},
        { letter: "I", sound: "/ɪ/", words: [
          { word: "it", emoji: "👆", cn: "它" },
          { word: "big", emoji: "🐘", cn: "大" },
          { word: "pig", emoji: "🐷", cn: "猪" },
        ]},
        { letter: "J", sound: "/dʒ/", words: [
          { word: "jet", emoji: "✈️", cn: "喷气机" },
          { word: "jam", emoji: "🫙", cn: "果酱" },
          { word: "jog", emoji: "🏃", cn: "慢跑" },
        ]},
        { letter: "K", sound: "/k/", words: [
          { word: "kid", emoji: "🧒", cn: "小孩" },
          { word: "kit", emoji: "🧰", cn: "工具箱" },
          { word: "key", emoji: "🔑", cn: "钥匙" },
        ]},
        { letter: "L", sound: "/l/", words: [
          { word: "leg", emoji: "🦵", cn: "腿" },
          { word: "log", emoji: "🪵", cn: "木头" },
          { word: "lip", emoji: "👄", cn: "嘴唇" },
        ]},
      ]},
      { title: "M-R 字母音", type: "phonics", items: [
        { letter: "M", sound: "/m/", words: [
          { word: "mom", emoji: "👩", cn: "妈妈" },
          { word: "map", emoji: "🗺️", cn: "地图" },
          { word: "mug", emoji: "☕", cn: "杯子" },
        ]},
        { letter: "N", sound: "/n/", words: [
          { word: "net", emoji: "🥅", cn: "网" },
          { word: "nap", emoji: "😴", cn: "小睡" },
          { word: "nut", emoji: "🥜", cn: "坚果" },
        ]},
        { letter: "O", sound: "/ɑ/", words: [
          { word: "on", emoji: "💡", cn: "开" },
          { word: "hot", emoji: "🌡️", cn: "热" },
          { word: "box", emoji: "📦", cn: "盒子" },
        ]},
        { letter: "P", sound: "/p/", words: [
          { word: "pig", emoji: "🐷", cn: "猪" },
          { word: "pot", emoji: "🍲", cn: "锅" },
          { word: "pan", emoji: "🍳", cn: "平底锅" },
        ]},
        { letter: "Q", sound: "/kw/", words: [
          { word: "quiz", emoji: "❓", cn: "测验" },
          { word: "queen", emoji: "👸", cn: "女王" },
          { word: "quick", emoji: "⚡", cn: "快" },
        ]},
        { letter: "R", sound: "/r/", words: [
          { word: "run", emoji: "🏃", cn: "跑" },
          { word: "red", emoji: "🔴", cn: "红色" },
          { word: "rat", emoji: "🐀", cn: "老鼠" },
        ]},
      ]},
      { title: "S-Z 字母音", type: "phonics", items: [
        { letter: "S", sound: "/s/", words: [
          { word: "sun", emoji: "☀️", cn: "太阳" },
          { word: "sit", emoji: "🪑", cn: "坐" },
          { word: "six", emoji: "6️⃣", cn: "六" },
        ]},
        { letter: "T", sound: "/t/", words: [
          { word: "ten", emoji: "🔟", cn: "十" },
          { word: "top", emoji: "🔝", cn: "顶" },
          { word: "tap", emoji: "🚰", cn: "水龙头" },
        ]},
        { letter: "U", sound: "/ʌ/", words: [
          { word: "up", emoji: "⬆️", cn: "上" },
          { word: "cup", emoji: "🥤", cn: "杯子" },
          { word: "bus", emoji: "🚌", cn: "公交车" },
        ]},
        { letter: "V", sound: "/v/", words: [
          { word: "van", emoji: "🚐", cn: "面包车" },
          { word: "vet", emoji: "👨‍⚕️", cn: "兽医" },
          { word: "vest", emoji: "🦺", cn: "背心" },
        ]},
        { letter: "W", sound: "/w/", words: [
          { word: "wet", emoji: "💧", cn: "湿" },
          { word: "win", emoji: "🏆", cn: "赢" },
          { word: "wig", emoji: "💇", cn: "假发" },
        ]},
        { letter: "X", sound: "/ks/", words: [
          { word: "box", emoji: "📦", cn: "盒子" },
          { word: "fox", emoji: "🦊", cn: "狐狸" },
          { word: "mix", emoji: "🥣", cn: "混合" },
        ]},
        { letter: "Y", sound: "/j/", words: [
          { word: "yes", emoji: "✅", cn: "是" },
          { word: "yam", emoji: "🍠", cn: "山药" },
          { word: "yet", emoji: "⏳", cn: "还" },
        ]},
        { letter: "Z", sound: "/z/", words: [
          { word: "zoo", emoji: "🦁", cn: "动物园" },
          { word: "zip", emoji: "🤐", cn: "拉链" },
          { word: "zap", emoji: "⚡", cn: "一击" },
        ]},
      ]},
    ],
  },

  // ─── Level 2: 短元音 CVC ───
  {
    id: 2, name: "短元音单词", nameEn: "Short Vowels",
    desc: "学习短元音 a, e, i, o, u 的发音规律",
    icon: "🌿", color: "#48dbfb",
    units: [
      { title: "Short A: /æ/", type: "phonics", items: [
        { letter: "A", sound: "/æ/ as in cat", words: [
          { word: "cat", emoji: "🐱", cn: "猫" },
          { word: "bat", emoji: "🦇", cn: "蝙蝠" },
          { word: "hat", emoji: "🎩", cn: "帽子" },
          { word: "map", emoji: "🗺️", cn: "地图" },
          { word: "van", emoji: "🚐", cn: "面包车" },
        ]},
      ]},
      { title: "Short E: /ɛ/", type: "phonics", items: [
        { letter: "E", sound: "/ɛ/ as in bed", words: [
          { word: "bed", emoji: "🛏️", cn: "床" },
          { word: "red", emoji: "❤️", cn: "红色" },
          { word: "hen", emoji: "🐔", cn: "母鸡" },
          { word: "leg", emoji: "🦵", cn: "腿" },
          { word: "net", emoji: "🥅", cn: "网" },
        ]},
      ]},
      { title: "Short I: /ɪ/", type: "phonics", items: [
        { letter: "I", sound: "/ɪ/ as in pig", words: [
          { word: "pig", emoji: "🐷", cn: "猪" },
          { word: "big", emoji: "🐘", cn: "大" },
          { word: "sit", emoji: "🪑", cn: "坐" },
          { word: "fin", emoji: "🦈", cn: "鱼鳍" },
          { word: "win", emoji: "🏆", cn: "赢" },
        ]},
      ]},
      { title: "Short O: /ɑ/", type: "phonics", items: [
        { letter: "O", sound: "/ɑ/ as in hot", words: [
          { word: "hot", emoji: "🔥", cn: "热" },
          { word: "dog", emoji: "🐶", cn: "狗" },
          { word: "top", emoji: "🔝", cn: "顶" },
          { word: "fox", emoji: "🦊", cn: "狐狸" },
          { word: "pot", emoji: "🍲", cn: "锅" },
        ]},
      ]},
      { title: "Short U: /ʌ/", type: "phonics", items: [
        { letter: "U", sound: "/ʌ/ as in cup", words: [
          { word: "cup", emoji: "🥤", cn: "杯子" },
          { word: "bug", emoji: "🐛", cn: "虫子" },
          { word: "run", emoji: "🏃", cn: "跑" },
          { word: "sun", emoji: "☀️", cn: "太阳" },
          { word: "fun", emoji: "😄", cn: "快乐" },
        ]},
      ]},
    ],
  },

  // ─── Level 3: 长元音 & Magic E ───
  {
    id: 3, name: "长元音 Magic E", nameEn: "Long Vowels",
    desc: "学习 magic e 让元音变长音",
    icon: "🌳", color: "#ff9f43",
    units: [
      { title: "A: /æ/ vs /eɪ/", type: "contrast", items: [
        { short: { word: "cap", emoji: "🧢", sound: "/æ/" }, long: { word: "cape", emoji: "🦸", sound: "/eɪ/" }},
        { short: { word: "hat", emoji: "🎩", sound: "/æ/" }, long: { word: "hate", emoji: "😠", sound: "/eɪ/" }},
        { short: { word: "tap", emoji: "🚰", sound: "/æ/" }, long: { word: "tape", emoji: "📼", sound: "/eɪ/" }},
        { short: { word: "can", emoji: "🥫", sound: "/æ/" }, long: { word: "cane", emoji: "🦯", sound: "/eɪ/" }},
      ]},
      { title: "I: /ɪ/ vs /aɪ/", type: "contrast", items: [
        { short: { word: "bit", emoji: "🔹", sound: "/ɪ/" }, long: { word: "bite", emoji: "🦷", sound: "/aɪ/" }},
        { short: { word: "kit", emoji: "🧰", sound: "/ɪ/" }, long: { word: "kite", emoji: "🪁", sound: "/aɪ/" }},
        { short: { word: "pin", emoji: "📌", sound: "/ɪ/" }, long: { word: "pine", emoji: "🌲", sound: "/aɪ/" }},
        { short: { word: "fin", emoji: "🦈", sound: "/ɪ/" }, long: { word: "fine", emoji: "👌", sound: "/aɪ/" }},
      ]},
      { title: "O: /ɑ/ vs /oʊ/", type: "contrast", items: [
        { short: { word: "hop", emoji: "🐰", sound: "/ɑ/" }, long: { word: "hope", emoji: "🤞", sound: "/oʊ/" }},
        { short: { word: "not", emoji: "❌", sound: "/ɑ/" }, long: { word: "note", emoji: "📝", sound: "/oʊ/" }},
        { short: { word: "rob", emoji: "🦹", sound: "/ɑ/" }, long: { word: "robe", emoji: "👘", sound: "/oʊ/" }},
        { short: { word: "cod", emoji: "🐟", sound: "/ɑ/" }, long: { word: "code", emoji: "💻", sound: "/oʊ/" }},
      ]},
      { title: "U: /ʌ/ vs /juː/", type: "contrast", items: [
        { short: { word: "cub", emoji: "🐻", sound: "/ʌ/" }, long: { word: "cube", emoji: "🧊", sound: "/juː/" }},
        { short: { word: "cut", emoji: "✂️", sound: "/ʌ/" }, long: { word: "cute", emoji: "🥰", sound: "/juː/" }},
        { short: { word: "tub", emoji: "🛁", sound: "/ʌ/" }, long: { word: "tube", emoji: "🧴", sound: "/juː/" }},
      ]},
    ],
  },

  // ─── Level 4: 辅音组合 ───
  {
    id: 4, name: "辅音组合", nameEn: "Consonant Blends",
    desc: "学习 sh, ch, th, wh 等组合发音",
    icon: "🌻", color: "#ff6b6b",
    units: [
      { title: "SH: /ʃ/", type: "phonics", items: [
        { letter: "SH", sound: "/ʃ/ as in ship", words: [
          { word: "ship", emoji: "🚢", cn: "船" },
          { word: "shop", emoji: "🏪", cn: "商店" },
          { word: "fish", emoji: "🐟", cn: "鱼" },
          { word: "dish", emoji: "🍽️", cn: "盘子" },
          { word: "shoe", emoji: "👟", cn: "鞋" },
        ]},
      ]},
      { title: "CH: /tʃ/", type: "phonics", items: [
        { letter: "CH", sound: "/tʃ/ as in chip", words: [
          { word: "chip", emoji: "🍟", cn: "薯条" },
          { word: "chat", emoji: "💬", cn: "聊天" },
          { word: "chin", emoji: "🧔", cn: "下巴" },
          { word: "rich", emoji: "💰", cn: "富有" },
          { word: "much", emoji: "📈", cn: "很多" },
        ]},
      ]},
      { title: "TH: /θ/ & /ð/", type: "phonics", items: [
        { letter: "TH", sound: "/θ/ (thin) & /ð/ (this)", words: [
          { word: "this", emoji: "👆", cn: "这个" },
          { word: "that", emoji: "👉", cn: "那个" },
          { word: "thin", emoji: "🤏", cn: "薄" },
          { word: "math", emoji: "🔢", cn: "数学" },
          { word: "bath", emoji: "🛁", cn: "洗澡" },
        ]},
      ]},
      { title: "WH & PH", type: "phonics", items: [
        { letter: "WH", sound: "/w/ as in what", words: [
          { word: "what", emoji: "❓", cn: "什么" },
          { word: "when", emoji: "⏰", cn: "什么时候" },
          { word: "white", emoji: "⬜", cn: "白色" },
        ]},
        { letter: "PH", sound: "/f/ as in phone", words: [
          { word: "phone", emoji: "📱", cn: "电话" },
          { word: "photo", emoji: "📷", cn: "照片" },
        ]},
      ]},
    ],
  },

  // ─── Level 5: 常用词汇 ───
  {
    id: 5, name: "日常词汇", nameEn: "Daily Words",
    desc: "学习学校、家庭、食物的常用单词",
    icon: "🌸", color: "#a55eea",
    units: [
      { title: "学校用品", type: "vocab", items: [
        { word: "book", emoji: "📖", cn: "书" },
        { word: "pencil", emoji: "✏️", cn: "铅笔" },
        { word: "ruler", emoji: "📏", cn: "尺子" },
        { word: "eraser", emoji: "🧽", cn: "橡皮" },
        { word: "desk", emoji: "🪑", cn: "课桌" },
        { word: "school", emoji: "🏫", cn: "学校" },
        { word: "teacher", emoji: "👩‍🏫", cn: "老师" },
      ]},
      { title: "家庭成员", type: "vocab", items: [
        { word: "father", emoji: "👨", cn: "爸爸" },
        { word: "mother", emoji: "👩", cn: "妈妈" },
        { word: "brother", emoji: "👦", cn: "哥哥/弟弟" },
        { word: "sister", emoji: "👧", cn: "姐姐/妹妹" },
        { word: "grandpa", emoji: "👴", cn: "爷爷" },
        { word: "grandma", emoji: "👵", cn: "奶奶" },
        { word: "baby", emoji: "👶", cn: "宝宝" },
      ]},
      { title: "食物饮料", type: "vocab", items: [
        { word: "bread", emoji: "🍞", cn: "面包" },
        { word: "rice", emoji: "🍚", cn: "米饭" },
        { word: "chicken", emoji: "🍗", cn: "鸡肉" },
        { word: "noodle", emoji: "🍜", cn: "面条" },
        { word: "juice", emoji: "🧃", cn: "果汁" },
        { word: "water", emoji: "💧", cn: "水" },
        { word: "candy", emoji: "🍬", cn: "糖果" },
      ]},
    ],
  },

  // ─── Level 6: 同字母不同发音 ───
  {
    id: 6, name: "一字多音", nameEn: "Letter Sounds",
    desc: "同一个字母在不同单词里发不同的音",
    icon: "🔔", color: "#01a3a4",
    units: [
      { title: "C: /k/ vs /s/", type: "contrast", items: [
        { short: { word: "cat", emoji: "🐱", sound: "C = /k/" }, long: { word: "city", emoji: "🏙️", sound: "C = /s/" }},
        { short: { word: "cup", emoji: "🥤", sound: "C = /k/" }, long: { word: "cell", emoji: "📱", sound: "C = /s/" }},
        { short: { word: "come", emoji: "🤙", sound: "C = /k/" }, long: { word: "cent", emoji: "💰", sound: "C = /s/" }},
      ]},
      { title: "G: /ɡ/ vs /dʒ/", type: "contrast", items: [
        { short: { word: "go", emoji: "🏃", sound: "G = /ɡ/" }, long: { word: "gym", emoji: "🏋️", sound: "G = /dʒ/" }},
        { short: { word: "gap", emoji: "🕳️", sound: "G = /ɡ/" }, long: { word: "gem", emoji: "💎", sound: "G = /dʒ/" }},
        { short: { word: "game", emoji: "🎮", sound: "G = /ɡ/" }, long: { word: "giraffe", emoji: "🦒", sound: "G = /dʒ/" }},
      ]},
      { title: "S: /s/ vs /z/", type: "contrast", items: [
        { short: { word: "sun", emoji: "☀️", sound: "S = /s/" }, long: { word: "nose", emoji: "👃", sound: "S = /z/" }},
        { short: { word: "sit", emoji: "🪑", sound: "S = /s/" }, long: { word: "his", emoji: "👈", sound: "S = /z/" }},
        { short: { word: "see", emoji: "👀", sound: "S = /s/" }, long: { word: "rose", emoji: "🌹", sound: "S = /z/" }},
      ]},
      { title: "OO: /uː/ vs /ʊ/", type: "contrast", items: [
        { short: { word: "book", emoji: "📖", sound: "OO = /ʊ/" }, long: { word: "moon", emoji: "🌙", sound: "OO = /uː/" }},
        { short: { word: "cook", emoji: "👨‍🍳", sound: "OO = /ʊ/" }, long: { word: "food", emoji: "🍽️", sound: "OO = /uː/" }},
        { short: { word: "good", emoji: "👍", sound: "OO = /ʊ/" }, long: { word: "school", emoji: "🏫", sound: "OO = /uː/" }},
      ]},
      { title: "EA: /iː/ vs /ɛ/", type: "contrast", items: [
        { short: { word: "head", emoji: "🧑", sound: "EA = /ɛ/" }, long: { word: "read", emoji: "📖", sound: "EA = /iː/" }},
        { short: { word: "bread", emoji: "🍞", sound: "EA = /ɛ/" }, long: { word: "eat", emoji: "🍽️", sound: "EA = /iː/" }},
        { short: { word: "dead", emoji: "💀", sound: "EA = /ɛ/" }, long: { word: "sea", emoji: "🌊", sound: "EA = /iː/" }},
      ]},
    ],
  },

  // ─── Level 7: 基础句型 ───
  {
    id: 7, name: "基础句型", nameEn: "Basic Sentences",
    desc: "学习 I am / I have / I like 等基础句型",
    icon: "💐", color: "#ff6348",
    units: [
      { title: "I am...", type: "sentence", items: [
        { en: "I am happy.", cn: "我很开心。" },
        { en: "I am a student.", cn: "我是一个学生。" },
        { en: "I am seven years old.", cn: "我七岁了。" },
        { en: "I am hungry.", cn: "我饿了。" },
        { en: "I am ready.", cn: "我准备好了。" },
      ]},
      { title: "I have...", type: "sentence", items: [
        { en: "I have a dog.", cn: "我有一只狗。" },
        { en: "I have two books.", cn: "我有两本书。" },
        { en: "I have a big family.", cn: "我有一个大家庭。" },
        { en: "I have an idea.", cn: "我有一个主意。" },
      ]},
      { title: "I like / I can...", type: "sentence", items: [
        { en: "I like apples.", cn: "我喜欢苹果。" },
        { en: "I like to read.", cn: "我喜欢阅读。" },
        { en: "I can swim.", cn: "我会游泳。" },
        { en: "I can run fast.", cn: "我能跑得很快。" },
        { en: "Can I help you?", cn: "我能帮你吗？" },
      ]},
      { title: "Where / What", type: "sentence", items: [
        { en: "Where is the cat?", cn: "猫在哪里？" },
        { en: "What is this?", cn: "这是什么？" },
        { en: "What color is it?", cn: "它是什么颜色的？" },
        { en: "Where do you live?", cn: "你住在哪里？" },
      ]},
    ],
  },

  // ─── Level 8: 进阶词汇 ───
  {
    id: 8, name: "进阶词汇", nameEn: "More Words",
    desc: "学习动作词、形容词和方位词",
    icon: "🌺", color: "#5f27cd",
    units: [
      { title: "动作词", type: "vocab", items: [
        { word: "jump", emoji: "🤸", cn: "跳" },
        { word: "climb", emoji: "🧗", cn: "爬" },
        { word: "dance", emoji: "💃", cn: "跳舞" },
        { word: "write", emoji: "✍️", cn: "写" },
        { word: "sleep", emoji: "😴", cn: "睡觉" },
        { word: "think", emoji: "🤔", cn: "思考" },
        { word: "listen", emoji: "👂", cn: "听" },
        { word: "speak", emoji: "🗣️", cn: "说" },
      ]},
      { title: "形容词", type: "vocab", items: [
        { word: "happy", emoji: "😊", cn: "开心" },
        { word: "sad", emoji: "😢", cn: "难过" },
        { word: "fast", emoji: "⚡", cn: "快" },
        { word: "slow", emoji: "🐢", cn: "慢" },
        { word: "tall", emoji: "🦒", cn: "高" },
        { word: "short", emoji: "🐿️", cn: "矮" },
        { word: "strong", emoji: "💪", cn: "强壮" },
        { word: "beautiful", emoji: "🌸", cn: "美丽" },
      ]},
      { title: "方位与时间", type: "vocab", items: [
        { word: "today", emoji: "📅", cn: "今天" },
        { word: "tomorrow", emoji: "🌅", cn: "明天" },
        { word: "morning", emoji: "🌄", cn: "早上" },
        { word: "afternoon", emoji: "🌤️", cn: "下午" },
        { word: "inside", emoji: "🏠", cn: "里面" },
        { word: "outside", emoji: "🌳", cn: "外面" },
        { word: "between", emoji: "↔️", cn: "之间" },
      ]},
    ],
  },

  // ─── Level 9: 实用对话 ───
  {
    id: 9, name: "实用对话", nameEn: "Real Conversations",
    desc: "在商店、餐厅、公园的实际对话",
    icon: "🌈", color: "#feca57",
    units: [
      { title: "在商店", type: "sentence", items: [
        { en: "How much is this?", cn: "这个多少钱？" },
        { en: "I want to buy a toy.", cn: "我想买一个玩具。" },
        { en: "It is too expensive.", cn: "太贵了。" },
        { en: "Do you have a smaller one?", cn: "有小一点的吗？" },
        { en: "Here is the money.", cn: "这是钱。" },
      ]},
      { title: "在餐厅", type: "sentence", items: [
        { en: "Can I have the menu?", cn: "可以给我菜单吗？" },
        { en: "I would like some pizza.", cn: "我想要一些披萨。" },
        { en: "It tastes really good.", cn: "味道真好。" },
        { en: "May I have some more?", cn: "我可以再来一些吗？" },
        { en: "The bill, please.", cn: "请结账。" },
      ]},
      { title: "在公园", type: "sentence", items: [
        { en: "Let's go to the park!", cn: "我们去公园吧！" },
        { en: "I can see a butterfly.", cn: "我看到一只蝴蝶。" },
        { en: "Can I ride my bike?", cn: "我可以骑自行车吗？" },
        { en: "The flowers are so pretty.", cn: "花好漂亮啊。" },
        { en: "It is time to go home.", cn: "该回家了。" },
      ]},
    ],
  },

  // ─── Level 10: 故事与阅读 ───
  {
    id: 10, name: "小故事阅读", nameEn: "Story Time",
    desc: "跟读简单的英语小故事",
    icon: "🏆", color: "#f368e0",
    units: [
      { title: "小猫的一天", type: "sentence", items: [
        { en: "Once upon a time, there was a little cat.", cn: "从前，有一只小猫。" },
        { en: "The cat was very hungry.", cn: "小猫非常饿。" },
        { en: "She found a big fish in the river.", cn: "她在河里发现了一条大鱼。" },
        { en: "She ate the fish and felt very happy.", cn: "她吃了鱼，感到很开心。" },
        { en: "Then she went home and took a nap.", cn: "然后她回家睡了个午觉。" },
        { en: "The end.", cn: "故事结束。" },
      ]},
      { title: "下雨天", type: "sentence", items: [
        { en: "It was a rainy day.", cn: "那是一个下雨天。" },
        { en: "Tom could not go outside.", cn: "Tom 不能出去玩。" },
        { en: "He read a book about animals.", cn: "他读了一本关于动物的书。" },
        { en: "He learned many new words.", cn: "他学到了很多新词。" },
        { en: "When the rain stopped, he told his friend all about it.", cn: "雨停了，他把学到的都告诉了朋友。" },
      ]},
      { title: "生日派对", type: "sentence", items: [
        { en: "Today is my birthday!", cn: "今天是我的生日！" },
        { en: "My friends came to my house.", cn: "我的朋友们来我家了。" },
        { en: "We played games and sang songs.", cn: "我们玩游戏，唱歌。" },
        { en: "Mom made a big chocolate cake.", cn: "妈妈做了一个大巧克力蛋糕。" },
        { en: "I made a wish and blew out the candles.", cn: "我许了个愿，吹灭了蜡烛。" },
        { en: "It was the best day ever!", cn: "这是最棒的一天！" },
      ]},
    ],
  },
];
