const LETTER_DATA = {
  A: {
    sound: "A says /æ/, like ah",
    words: [
      { word: "apple",     emoji: "🍎", hint: "a red fruit" },
      { word: "ant",       emoji: "🐜", hint: "a tiny insect" },
      { word: "alligator", emoji: "🐊", hint: "a big reptile" },
    ],
  },
  B: {
    sound: "B says /b/, like buh",
    words: [
      { word: "ball",    emoji: "⚽", hint: "you kick it" },
      { word: "bear",    emoji: "🐻", hint: "a big animal" },
      { word: "banana",  emoji: "🍌", hint: "a yellow fruit" },
    ],
  },
  C: {
    sound: "C says /k/, like kuh",
    words: [
      { word: "cat",   emoji: "🐱", hint: "says meow" },
      { word: "car",   emoji: "🚗", hint: "you ride in it" },
      { word: "cake",  emoji: "🎂", hint: "a birthday treat" },
    ],
  },
  D: {
    sound: "D says /d/, like duh",
    words: [
      { word: "dog",    emoji: "🐶", hint: "says woof" },
      { word: "duck",   emoji: "🦆", hint: "says quack" },
      { word: "door",   emoji: "🚪", hint: "you open it" },
    ],
  },
  E: {
    sound: "E says /ɛ/, like eh",
    words: [
      { word: "egg",      emoji: "🥚", hint: "from a chicken" },
      { word: "elephant", emoji: "🐘", hint: "a huge animal" },
      { word: "elbow",    emoji: "💪", hint: "part of your arm" },
    ],
  },
  F: {
    sound: "F says /f/, like fff",
    words: [
      { word: "fish",   emoji: "🐟", hint: "swims in water" },
      { word: "frog",   emoji: "🐸", hint: "jumps and says ribbit" },
      { word: "flower", emoji: "🌸", hint: "grows in a garden" },
    ],
  },
  G: {
    sound: "G says /ɡ/, like guh",
    words: [
      { word: "goat",    emoji: "🐐", hint: "lives on a farm" },
      { word: "grape",   emoji: "🍇", hint: "a small purple fruit" },
      { word: "guitar",  emoji: "🎸", hint: "a musical instrument" },
    ],
  },
  H: {
    sound: "H says /h/, like huh",
    words: [
      { word: "hat",     emoji: "🎩", hint: "you wear it on your head" },
      { word: "horse",   emoji: "🐴", hint: "you can ride it" },
      { word: "house",   emoji: "🏠", hint: "you live in it" },
    ],
  },
  I: {
    sound: "I says /ɪ/, like ih",
    words: [
      { word: "igloo",    emoji: "🏠", hint: "an ice house" },
      { word: "insect",   emoji: "🐛", hint: "a tiny bug" },
      { word: "ice cream",emoji: "🍦", hint: "a cold treat" },
    ],
  },
  J: {
    sound: "J says /dʒ/, like juh",
    words: [
      { word: "juice",    emoji: "🧃", hint: "a yummy drink" },
      { word: "jellyfish",emoji: "🪼", hint: "swims in the sea" },
      { word: "jet",      emoji: "✈️", hint: "flies in the sky" },
    ],
  },
  K: {
    sound: "K says /k/, like kuh",
    words: [
      { word: "kite",    emoji: "🪁", hint: "flies in the wind" },
      { word: "king",    emoji: "🤴", hint: "wears a crown" },
      { word: "koala",   emoji: "🐨", hint: "lives in trees" },
    ],
  },
  L: {
    sound: "L says /l/, like lll",
    words: [
      { word: "lion",    emoji: "🦁", hint: "king of the jungle" },
      { word: "lamp",    emoji: "💡", hint: "gives you light" },
      { word: "leaf",    emoji: "🍃", hint: "on a tree" },
    ],
  },
  M: {
    sound: "M says /m/, like mmm",
    words: [
      { word: "moon",    emoji: "🌙", hint: "shines at night" },
      { word: "monkey",  emoji: "🐵", hint: "loves bananas" },
      { word: "milk",    emoji: "🥛", hint: "a white drink" },
    ],
  },
  N: {
    sound: "N says /n/, like nnn",
    words: [
      { word: "nest",    emoji: "🪺", hint: "where birds live" },
      { word: "nose",    emoji: "👃", hint: "on your face" },
      { word: "nut",     emoji: "🥜", hint: "a crunchy snack" },
    ],
  },
  O: {
    sound: "O says /ɑ/, like ah",
    words: [
      { word: "orange",  emoji: "🍊", hint: "an orange fruit" },
      { word: "octopus", emoji: "🐙", hint: "has eight arms" },
      { word: "owl",     emoji: "🦉", hint: "says hoo hoo" },
    ],
  },
  P: {
    sound: "P says /p/, like puh",
    words: [
      { word: "pig",     emoji: "🐷", hint: "says oink" },
      { word: "pizza",   emoji: "🍕", hint: "a yummy food" },
      { word: "penguin", emoji: "🐧", hint: "a bird that can't fly" },
    ],
  },
  Q: {
    sound: "Q says /kw/, like kwuh",
    words: [
      { word: "queen",   emoji: "👸", hint: "wears a crown" },
      { word: "quilt",   emoji: "🛏️", hint: "keeps you warm" },
      { word: "question",emoji: "❓", hint: "you ask one" },
    ],
  },
  R: {
    sound: "R says /r/, like rrr",
    words: [
      { word: "rabbit",  emoji: "🐰", hint: "hops around" },
      { word: "rain",    emoji: "🌧️", hint: "falls from the sky" },
      { word: "rocket",  emoji: "🚀", hint: "goes to space" },
    ],
  },
  S: {
    sound: "S says /s/, like sss",
    words: [
      { word: "sun",     emoji: "☀️", hint: "bright in the sky" },
      { word: "star",    emoji: "⭐", hint: "twinkles at night" },
      { word: "snake",   emoji: "🐍", hint: "goes hiss" },
    ],
  },
  T: {
    sound: "T says /t/, like tuh",
    words: [
      { word: "tree",    emoji: "🌳", hint: "grows tall" },
      { word: "tiger",   emoji: "🐯", hint: "has stripes" },
      { word: "turtle",  emoji: "🐢", hint: "walks slowly" },
    ],
  },
  U: {
    sound: "U says /ʌ/, like uh",
    words: [
      { word: "umbrella",emoji: "☂️", hint: "keeps you dry" },
      { word: "unicorn", emoji: "🦄", hint: "a magical horse" },
      { word: "up",      emoji: "⬆️", hint: "the opposite of down" },
    ],
  },
  V: {
    sound: "V says /v/, like vvv",
    words: [
      { word: "van",     emoji: "🚐", hint: "a big car" },
      { word: "violin",  emoji: "🎻", hint: "a string instrument" },
      { word: "volcano", emoji: "🌋", hint: "a fire mountain" },
    ],
  },
  W: {
    sound: "W says /w/, like wuh",
    words: [
      { word: "whale",   emoji: "🐋", hint: "biggest animal" },
      { word: "water",   emoji: "💧", hint: "you drink it" },
      { word: "watch",   emoji: "⌚", hint: "tells time" },
    ],
  },
  X: {
    sound: "X says /ks/, like ks",
    words: [
      { word: "fox",     emoji: "🦊", hint: "a clever animal" },
      { word: "box",     emoji: "📦", hint: "you put things in it" },
      { word: "six",     emoji: "6️⃣", hint: "a number" },
    ],
  },
  Y: {
    sound: "Y says /j/, like yuh",
    words: [
      { word: "yak",     emoji: "🐂", hint: "a hairy animal" },
      { word: "yellow",  emoji: "💛", hint: "a sunny color" },
      { word: "yo-yo",   emoji: "🪀", hint: "a fun toy" },
    ],
  },
  Z: {
    sound: "Z says /z/, like zzz",
    words: [
      { word: "zebra",   emoji: "🦓", hint: "black and white stripes" },
      { word: "zoo",     emoji: "🦁", hint: "animals live there" },
      { word: "zip",     emoji: "🤐", hint: "close it up" },
    ],
  },
};
